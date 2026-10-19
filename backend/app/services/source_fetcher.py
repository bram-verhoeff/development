"""Haalt de leesbare tekst van een webpagina op, als bron voor posts.

Beveiligd tegen SSRF: alleen http(s) naar publieke IP-adressen, ook na redirects.
"""

import ipaddress
import re
import socket
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

MAX_BYTES = 2 * 1024 * 1024
MAX_REDIRECTS = 3
# Genoeg voor de kern van een pagina; daarboven is het vooral navigatie en herhaling
MAX_TEXT_CHARS = 15_000


class SourceError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def _check_public(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise SourceError("source_invalid_url")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror:
        raise SourceError("source_unreachable")
    for info in infos:
        if not ipaddress.ip_address(info[4][0]).is_global:
            raise SourceError("source_invalid_url")


def _download(url: str) -> tuple[bytes, str]:
    for _ in range(MAX_REDIRECTS + 1):
        _check_public(url)
        try:
            with httpx.stream(
                "GET",
                url,
                follow_redirects=False,
                timeout=10,
                headers={"User-Agent": "PostPilot/1.0 (+content research)"},
            ) as response:
                if response.is_redirect:
                    url = urljoin(url, response.headers.get("location", ""))
                    continue
                if response.status_code >= 400:
                    raise SourceError("source_unreachable")
                content_type = response.headers.get("content-type", "")
                if not any(t in content_type for t in ("text/html", "text/plain", "application/xhtml")):
                    raise SourceError("source_unsupported")
                data = b""
                for chunk in response.iter_bytes():
                    data += chunk
                    if len(data) > MAX_BYTES:
                        break
                return data[:MAX_BYTES], content_type
        except httpx.HTTPError:
            raise SourceError("source_unreachable")
    raise SourceError("source_unreachable")


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "nav", "footer", "header", "aside", "form", "iframe"]):
        tag.decompose()

    parts = []
    if soup.title and soup.title.string:
        parts.append(f"Titel: {soup.title.string.strip()}")
    description = soup.find("meta", attrs={"name": "description"})
    if description and description.get("content"):
        parts.append(f"Beschrijving: {description['content'].strip()}")

    main = soup.find("main") or soup.find("article") or soup.body or soup
    text = main.get_text("\n", strip=True)
    parts.append(re.sub(r"\n{3,}", "\n\n", text))
    return "\n\n".join(parts)


def fetch_source_text(url: str) -> str:
    data, content_type = _download(url)
    raw = data.decode("utf-8", errors="replace")
    text = raw if "text/plain" in content_type else html_to_text(raw)
    text = text.strip()
    if not text:
        raise SourceError("source_empty")
    return text[:MAX_TEXT_CHARS]
