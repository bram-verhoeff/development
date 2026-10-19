import socket

import pytest

from app.services import source_fetcher
from app.services.source_fetcher import SourceError, fetch_source_text, html_to_text


def fake_dns(ip: str):
    return lambda host, port, *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port))]


@pytest.mark.parametrize("url", ["ftp://voorbeeld.nl", "file:///etc/passwd", "javascript:alert(1)", "http://"])
def test_rejects_non_http_urls(url):
    with pytest.raises(SourceError) as exc:
        fetch_source_text(url)
    assert exc.value.code == "source_invalid_url"


@pytest.mark.parametrize("ip", ["127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.169.254", "::1"])
def test_blocks_private_and_internal_addresses(monkeypatch, ip):
    monkeypatch.setattr(source_fetcher.socket, "getaddrinfo", fake_dns(ip))
    with pytest.raises(SourceError) as exc:
        fetch_source_text("https://intern.voorbeeld.nl/admin")
    assert exc.value.code == "source_invalid_url"


def test_html_to_text_keeps_content_and_drops_chrome():
    html = """<html><head><title>Herfstblend</title><meta name="description" content="Nieuw seizoen">
    <script>var x = 1;</script></head><body><nav>Menu Home Contact</nav>
    <main><h1>Onze herfstblend</h1><p>Met tonen van karamel.</p></main><footer>(c) 2026</footer></body></html>"""
    text = html_to_text(html)
    assert "Titel: Herfstblend" in text and "Beschrijving: Nieuw seizoen" in text
    assert "Onze herfstblend" in text and "karamel" in text
    assert "Menu" not in text and "var x" not in text and "2026" not in text
