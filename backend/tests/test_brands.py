import pytest

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 64

BRAND = {
    "name": "Koffiebar De Boon",
    "website_url": "https://deboon.nl",
    "target_audience": "Studenten en thuiswerkers in Utrecht",
    "tone_of_voice": "Warm, nuchter, beetje eigenwijs",
    "usps": ["Eigen branderij", "Havermelk zonder meerprijs"],
    "colors": ["#3b2a1a", "#F2E8DC"],
    "avoid_terms": ["goedkoop"],
    "content_language": "nl",
}


@pytest.fixture
def owner(auth_headers):
    return auth_headers()


@pytest.fixture
def other(auth_headers):
    return auth_headers(email="tweede@voorbeeld.nl")


def create(client, headers, **overrides):
    response = client.post("/brands", json=BRAND | overrides, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_requires_login(client):
    assert client.get("/brands").status_code == 401


def test_create_and_get(client, owner):
    brand = create(client, owner)
    assert brand["name"] == "Koffiebar De Boon"
    assert brand["colors"] == ["#3B2A1A", "#F2E8DC"]
    assert brand["website_url"] == "https://deboon.nl/"
    assert brand["logo_url"] is None
    assert client.get(f"/brands/{brand['id']}", headers=owner).json() == brand


def test_list_is_sorted_by_name(client, owner):
    create(client, owner, name="Zeilschool")
    create(client, owner, name="Atelier")
    assert [b["name"] for b in client.get("/brands", headers=owner).json()] == ["Atelier", "Zeilschool"]


def test_update(client, owner):
    brand = create(client, owner)
    response = client.put(f"/brands/{brand['id']}", json=BRAND | {"name": "De Boon", "usps": []}, headers=owner)
    assert response.status_code == 200
    assert response.json()["name"] == "De Boon"
    assert response.json()["usps"] == []


def test_lists_are_cleaned(client, owner):
    brand = create(client, owner, usps=["  Snel ", "", "snel", "Lokaal"], avoid_terms=["  "])
    assert brand["usps"] == ["Snel", "Lokaal"]
    assert brand["avoid_terms"] == []


@pytest.mark.parametrize(
    "overrides",
    [{"name": ""}, {"name": "   "}, {"colors": ["rood"]}, {"website_url": "geen-url"}, {"content_language": "de"}],
)
def test_validation(client, owner, overrides):
    assert client.post("/brands", json=BRAND | overrides, headers=owner).status_code == 422


def test_delete(client, owner):
    brand = create(client, owner)
    assert client.delete(f"/brands/{brand['id']}", headers=owner).status_code == 204
    assert client.get(f"/brands/{brand['id']}", headers=owner).status_code == 404


def test_users_cannot_see_each_others_brands(client, owner, other):
    brand = create(client, owner)
    url = f"/brands/{brand['id']}"

    assert client.get("/brands", headers=other).json() == []
    assert client.get(url, headers=other).status_code == 404
    assert client.put(url, json=BRAND, headers=other).status_code == 404
    assert client.delete(url, headers=other).status_code == 404
    assert client.post(f"{url}/logo", files={"file": ("l.png", PNG)}, headers=other).status_code == 404
    # En het merk is ongewijzigd
    assert client.get(url, headers=owner).json()["name"] == BRAND["name"]


@pytest.mark.parametrize("data", [PNG, JPEG, WEBP])
def test_upload_logo(client, owner, storage, data):
    brand = create(client, owner)
    response = client.post(f"/brands/{brand['id']}/logo", files={"file": ("logo", data)}, headers=owner)
    assert response.status_code == 200
    assert response.json()["logo_url"].startswith(storage.prefix)
    assert list(storage.files.values()) == [data]


def test_replacing_logo_removes_old_file(client, owner, storage):
    brand = create(client, owner)
    url = f"/brands/{brand['id']}/logo"
    client.post(url, files={"file": ("a.png", PNG)}, headers=owner)
    client.post(url, files={"file": ("b.jpg", JPEG)}, headers=owner)
    assert list(storage.files.values()) == [JPEG]


def test_logo_rejects_other_file_types(client, owner, storage):
    brand = create(client, owner)
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    response = client.post(
        f"/brands/{brand['id']}/logo", files={"file": ("logo.png", svg, "image/png")}, headers=owner
    )
    assert response.status_code == 415
    assert response.json()["detail"] == "logo_invalid_type"
    assert storage.files == {}


def test_logo_too_large(client, owner, storage):
    brand = create(client, owner)
    big = PNG + b"\x00" * (2 * 1024 * 1024)
    response = client.post(f"/brands/{brand['id']}/logo", files={"file": ("big.png", big)}, headers=owner)
    assert response.status_code == 413
    assert storage.files == {}


def test_delete_logo_and_brand_clean_up_storage(client, owner, storage):
    first = create(client, owner)
    second = create(client, owner, name="Tweede merk")
    client.post(f"/brands/{first['id']}/logo", files={"file": ("a.png", PNG)}, headers=owner)
    client.post(f"/brands/{second['id']}/logo", files={"file": ("b.png", PNG)}, headers=owner)

    response = client.delete(f"/brands/{first['id']}/logo", headers=owner)
    assert response.json()["logo_url"] is None
    assert len(storage.files) == 1

    client.delete(f"/brands/{second['id']}", headers=owner)
    assert storage.files == {}
