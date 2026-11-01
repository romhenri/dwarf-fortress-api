from fastapi.testclient import TestClient

import main

main.DB = "test.db"


def test_api():
    with TestClient(main.app) as c:
        assert c.get("/creatures", params={"hostile": True, "sort": "size", "order": "desc"}).json()["items"][0]["name"] in ("Dragon", "Bronze Colossus")
        assert c.get("/creatures", params={"sort": "1;DROP"}).status_code == 400
        assert c.get("/animals", params={"product": "wool"}).json()["total"] == 3
        assert [o["name"] for o in c.get("/metals/silver/ores").json()] == ["Horn Silver", "Native Silver"]
        r = c.post("/creatures", json={"name": "Test Beast", "biome": "caverns", "size": 5})
        assert r.status_code == 201
        assert c.post("/creatures", json={"name": "X", "biome": "moon", "size": 5}).status_code == 409
        assert c.delete(f"/creatures/{r.json()['id']}").status_code == 204
        assert c.get("/biomes/caverns/inhabitants").json()["animals"][0]["name"] == "Mole Dog"
        assert c.get("/dwarves/random", params={"seed": 1, "count": 3}).json() == c.get("/dwarves/random", params={"seed": 1, "count": 3}).json()
        assert c.get("/events/random").json()["message"]
        for path in ["/", "/creatures/random", "/creatures/1", "/animals/1", "/ores", "/ores/1", "/metals",
                     "/gems", "/gems/1", "/biomes", "/search?q=dr", "/stats"]:
            assert c.get(path).status_code == 200, path
