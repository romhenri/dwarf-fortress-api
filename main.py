import asyncio
import json
import random
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

DB = "df.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS biomes (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, savagery TEXT NOT NULL, alignment TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS creatures (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, biome TEXT NOT NULL REFERENCES biomes(name),
  hostile INTEGER NOT NULL, size INTEGER NOT NULL, description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS animals (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, biome TEXT NOT NULL REFERENCES biomes(name),
  tameable INTEGER NOT NULL, trainable INTEGER NOT NULL, pet_value INTEGER NOT NULL, product TEXT);
CREATE TABLE IF NOT EXISTS ores (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, metal TEXT NOT NULL, value INTEGER NOT NULL, environment TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS gems (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, color TEXT NOT NULL, value INTEGER NOT NULL, rarity TEXT NOT NULL);
"""

SEED = {
    "biomes": ("name, savagery, alignment", [
        ("mountain", "wild", "neutral"), ("forest", "calm", "good"), ("grassland", "calm", "neutral"),
        ("desert", "wild", "neutral"), ("tundra", "savage", "neutral"), ("swamp", "savage", "evil"),
        ("ocean", "wild", "neutral"), ("caverns", "savage", "neutral"), ("glacier", "savage", "evil"),
    ]),
    "creatures": ("name, biome, hostile, size, description", [
        ("Dragon", "mountain", 1, 25000000, "A gigantic fire-breathing reptile. Hoards treasure, burns fortresses."),
        ("Hydra", "swamp", 1, 15000000, "A seven-headed reptile that lurks in savage wetlands."),
        ("Roc", "mountain", 1, 20000000, "An enormous bird capable of carrying off a dwarf."),
        ("Bronze Colossus", "desert", 1, 25000000, "A towering statue of bronze, animated and furious."),
        ("Cyclops", "tundra", 1, 4000000, "A one-eyed giant living alone in savage lands."),
        ("Ettin", "glacier", 1, 4000000, "A two-headed giant. Twice the heads, twice the trouble."),
        ("Minotaur", "caverns", 1, 600000, "A bull-headed humanoid that haunts labyrinths."),
        ("Giant Cave Spider", "caverns", 1, 3000000, "Spits webs, injects paralytic venom. Pure terror."),
        ("Troll", "caverns", 1, 200000, "Hulking, hairy, always in goblin sieges."),
        ("Goblin", "swamp", 1, 60000, "Cruel, immortal, and organized. Sieges your fortress."),
        ("Kobold", "caverns", 1, 20000, "Small thieving creature that steals your goods."),
        ("Elf", "forest", 0, 60000, "Tree-loving trader. Do not offer them wooden goods."),
        ("Carp", "ocean", 1, 15000, "The most feared creature in the world. Ask any fisherdwarf."),
        ("Werebeast", "forest", 1, 70000, "Cursed creature that transforms under the full moon."),
        ("Forgotten Beast", "caverns", 1, 10000000, "A unique horror from the depths. Every one is different."),
    ]),
    "animals": ("name, biome, tameable, trainable, pet_value, product", [
        ("Cat", "grassland", 1, 0, 10, None), ("Dog", "grassland", 1, 1, 30, None),
        ("Horse", "grassland", 1, 0, 200, None), ("Cow", "grassland", 1, 0, 100, "milk"),
        ("Sheep", "grassland", 1, 0, 50, "wool"), ("Alpaca", "mountain", 1, 0, 200, "wool"),
        ("Llama", "mountain", 1, 0, 200, "wool"), ("Yak", "tundra", 1, 0, 200, "milk"),
        ("Goat", "mountain", 1, 0, 50, "milk"), ("Pig", "grassland", 1, 0, 30, None),
        ("Chicken", "grassland", 1, 0, 10, "eggs"), ("Turkey", "grassland", 1, 0, 10, "eggs"),
        ("Elephant", "grassland", 1, 1, 500, None), ("Giant Eagle", "mountain", 1, 1, 300, None),
        ("Camel", "desert", 1, 0, 200, "milk"), ("Polar Bear", "glacier", 1, 1, 300, None),
        ("Mole Dog", "caverns", 1, 1, 50, None), ("Crocodile", "swamp", 0, 0, 0, None),
    ]),
    "ores": ("name, metal, value, environment", [
        ("Hematite", "iron", 8, "sedimentary"), ("Magnetite", "iron", 8, "igneous"),
        ("Limonite", "iron", 8, "sedimentary"), ("Native Gold", "gold", 30, "vein"),
        ("Native Silver", "silver", 10, "vein"), ("Horn Silver", "silver", 10, "vein"),
        ("Native Copper", "copper", 2, "igneous"), ("Malachite", "copper", 2, "sedimentary"),
        ("Tetrahedrite", "copper", 2, "vein"), ("Galena", "lead", 2, "vein"),
        ("Sphalerite", "zinc", 2, "metamorphic"), ("Cassiterite", "tin", 2, "igneous"),
        ("Garnierite", "nickel", 2, "igneous"), ("Native Platinum", "platinum", 40, "vein"),
        ("Native Aluminum", "aluminum", 40, "vein"), ("Bismuthinite", "bismuth", 2, "vein"),
    ]),
    "gems": ("name, color, value, rarity", [
        ("Diamond", "clear", 40, "rare"), ("Emerald", "green", 40, "rare"), ("Ruby", "red", 40, "rare"),
        ("Sapphire", "blue", 40, "rare"), ("Amethyst", "violet", 20, "uncommon"), ("Topaz", "yellow", 20, "uncommon"),
        ("Aquamarine", "aqua", 20, "uncommon"), ("Garnet", "red", 10, "common"), ("Jasper", "red", 3, "common"),
        ("Onyx", "black", 5, "common"), ("Bloodstone", "red", 5, "common"), ("Adamantine", "cyan", 300, "legendary"),
    ]),
}


def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def rows(sql, args=()):
    with db() as con:
        return [dict(r) for r in con.execute(sql, args)]


def init_db():
    with db() as con:
        con.executescript(SCHEMA)
        for table, (cols, data) in SEED.items():
            if not con.execute(f"SELECT 1 FROM {table} LIMIT 1").fetchone():
                marks = ",".join("?" * len(data[0]))
                con.executemany(f"INSERT INTO {table} ({cols}) VALUES ({marks})", data)


def listing(table, filters, sort, order, limit, offset):
    """filters: list of (sql_fragment, value); fragments with value None are skipped."""
    cols = [r["name"] for r in rows(f"PRAGMA table_info({table})")]
    if sort not in cols:  # sort is interpolated, so whitelist it
        raise HTTPException(400, f"sort must be one of {cols}")
    active = [(f, v) for f, v in filters if v is not None]
    where = " AND ".join(f for f, _ in active) or "1"
    args = [v for _, v in active]
    total = rows(f"SELECT COUNT(*) n FROM {table} WHERE {where}", args)[0]["n"]
    items = rows(f"SELECT * FROM {table} WHERE {where} ORDER BY {sort} {order} LIMIT ? OFFSET ?", [*args, limit, offset])
    return {"total": total, "limit": limit, "offset": offset, "items": items}


def get_one(table, id):
    found = rows(f"SELECT * FROM {table} WHERE id = ?", (id,))
    if not found:
        raise HTTPException(404, f"{table[:-1]} {id} not found")
    return found[0]


def like(q):
    return f"%{q}%" if q else None


@asynccontextmanager
async def lifespan(app):
    init_db()
    yield


DESCRIPTION = """
API de consulta sobre o universo de **Dwarf Fortress**: criaturas, animais, minérios, metais, gemas e biomas,
além de um gerador de anões e um **stream de eventos aleatórios** que simula o que acontece numa fortaleza.

## Como consumir

Todas as respostas são JSON (exceto o stream, que é `text/event-stream`). Não há autenticação.

```bash
curl "http://localhost:8000/creatures?hostile=true&sort=size&order=desc&limit=5"
```

```js
const res = await fetch("http://localhost:8000/ores?metal=iron");
const { total, items } = await res.json();
```

## Listagens, filtros e paginação

As rotas de listagem (`/creatures`, `/animals`, `/ores`, `/gems`) aceitam:

| Parâmetro | O que faz |
|---|---|
| `q` | busca parcial pelo nome (`q=dra` encontra *Dragon*) |
| filtros próprios | ex.: `biome`, `hostile`, `metal`, `min_value` (veja cada rota) |
| `sort` | coluna para ordenar (ex.: `name`, `size`, `value`) |
| `order` | `asc` ou `desc` |
| `limit` / `offset` | paginação (máx. 100 por página) |

E retornam sempre o mesmo envelope:

```json
{"total": 15, "limit": 20, "offset": 0, "items": [ ... ]}
```

Para a próxima página, some `limit` ao `offset` até passar de `total`.

## Erros

| Código | Quando |
|---|---|
| `400` | `sort` com coluna inexistente |
| `404` | recurso não encontrado |
| `409` | criatura com nome repetido ou bioma inexistente |
| `422` | parâmetro inválido (tipo errado, fora do limite) |

## Eventos em tempo real

`GET /events/stream` mantém a conexão aberta e envia um evento a cada 15 segundos
(Server-Sent Events). Use `curl -N` ou `EventSource` no navegador; o botão *Try it out* do Swagger
não funciona bem com streams infinitos.
"""

TAGS = [
    {"name": "Geral", "description": "Ponto de entrada, busca e estatísticas."},
    {"name": "Criaturas", "description": "Monstros, megabestas e povos. Único recurso que aceita criar e apagar."},
    {"name": "Animais", "description": "Animais domesticáveis e selvagens, com valor de pet e produtos (lã, leite, ovos)."},
    {"name": "Minérios e metais", "description": "Minérios encontrados nas camadas de rocha e os metais que produzem."},
    {"name": "Gemas", "description": "Pedras preciosas, cor, raridade e valor."},
    {"name": "Biomas", "description": "Regiões do mundo e quem vive nelas."},
    {"name": "Anões", "description": "Gerador de anões aleatórios."},
    {"name": "Eventos", "description": "Eventos aleatórios da fortaleza, avulsos ou em stream."},
]

app = FastAPI(title="Dwarf Fortress API", version="1.0.0", description=DESCRIPTION, openapi_tags=TAGS,
              lifespan=lifespan)

Order = Literal["asc", "desc"]
Q = Query(None, description="Busca parcial pelo nome, sem diferenciar maiúsculas.", examples=["dra"])
Sort = lambda default: Query(default, description="Coluna usada na ordenação (qualquer campo do item).")
OrderQ = Query("asc", description="Direção da ordenação: `asc` ou `desc`.")
Limit = Query(20, ge=1, le=100, description="Quantos itens por página (1 a 100).")
Offset = Query(0, ge=0, description="Quantos itens pular (paginação).")
Biome = Query(None, description="Nome do bioma, ex.: `mountain`, `caverns`. Veja `/biomes`.")
NOT_FOUND = {404: {"description": "Não encontrado"}}


@app.get("/", tags=["Geral"], summary="Índice da API")
def index():
    """Mensagem de boas-vindas e a lista dos recursos disponíveis."""
    return {"message": "Strike the earth!", "docs": "/docs",
            "resources": ["/creatures", "/animals", "/ores", "/metals", "/gems", "/biomes", "/search", "/stats", "/events/stream"]}


# --- creatures ---

@app.get("/creatures", tags=["Criaturas"], summary="Listar criaturas")
def list_creatures(q: str | None = Q, biome: str | None = Biome,
                   hostile: bool | None = Query(None, description="`true` só hostis, `false` só pacíficas."),
                   min_size: int | None = Query(None, description="Tamanho mínimo (volume corporal em cm³)."),
                   max_size: int | None = Query(None, description="Tamanho máximo (volume corporal em cm³)."),
                   sort: str = Sort("name"), order: Order = OrderQ, limit: int = Limit, offset: int = Offset):
    """
    Lista criaturas com filtros e paginação.

    Exemplo: as 3 maiores criaturas hostis das cavernas:
    `/creatures?biome=caverns&hostile=true&sort=size&order=desc&limit=3`
    """
    return listing("creatures", [("name LIKE ?", like(q)), ("biome = ?", biome), ("hostile = ?", hostile),
                                 ("size >= ?", min_size), ("size <= ?", max_size)], sort, order, limit, offset)


@app.get("/creatures/random", tags=["Criaturas"], summary="Criatura aleatória", responses=NOT_FOUND)
def random_creature(hostile: bool | None = Query(None, description="Restringe a hostis (`true`) ou pacíficas (`false`).")):
    """Sorteia uma criatura. Bom para \"o que vai atacar minha fortaleza hoje?\"."""
    found = rows("SELECT * FROM creatures WHERE ? IS NULL OR hostile = ? ORDER BY RANDOM() LIMIT 1", (hostile, hostile))
    if not found:
        raise HTTPException(404, "no creatures match")
    return found[0]


@app.get("/creatures/{id}", tags=["Criaturas"], summary="Buscar criatura por id", responses=NOT_FOUND)
def get_creature(id: int):
    """Retorna uma criatura pelo `id`."""
    return get_one("creatures", id)


class CreatureIn(BaseModel):
    name: str = Field(min_length=1, max_length=80, description="Nome único da criatura.", examples=["Blind Cave Ogre"])
    biome: str = Field(description="Bioma existente (veja `/biomes`).", examples=["caverns"])
    hostile: bool = Field(True, description="Se ataca anões.")
    size: int = Field(gt=0, description="Volume corporal em cm³.", examples=[650000])
    description: str = Field("", max_length=500, description="Texto livre.", examples=["Lives in the third cavern layer."])


@app.post("/creatures", status_code=201, tags=["Criaturas"], summary="Cadastrar criatura",
          responses={409: {"description": "Nome já existe ou bioma desconhecido"}})
def create_creature(c: CreatureIn):
    """Cria uma criatura nova e devolve o registro salvo (com `id`)."""
    try:
        with db() as con:
            cur = con.execute("INSERT INTO creatures (name, biome, hostile, size, description) VALUES (?,?,?,?,?)",
                              (c.name, c.biome, c.hostile, c.size, c.description))
    except sqlite3.IntegrityError:
        raise HTTPException(409, "name already exists or biome is unknown")
    return get_one("creatures", cur.lastrowid)


@app.delete("/creatures/{id}", status_code=204, tags=["Criaturas"], summary="Apagar criatura", responses=NOT_FOUND)
def delete_creature(id: int):
    """Remove uma criatura. Responde `204` sem corpo."""
    get_one("creatures", id)
    with db() as con:
        con.execute("DELETE FROM creatures WHERE id = ?", (id,))


# --- animals ---

@app.get("/animals", tags=["Animais"], summary="Listar animais")
def list_animals(q: str | None = Q, biome: str | None = Biome,
                 tameable: bool | None = Query(None, description="Se pode ser domesticado."),
                 trainable: bool | None = Query(None, description="Se pode ser treinado para guerra/caça."),
                 product: str | None = Query(None, description="Produto que fornece: `milk`, `wool` ou `eggs`."),
                 min_pet_value: int | None = Query(None, description="Valor mínimo como pet (em ☼)."),
                 sort: str = Sort("name"), order: Order = OrderQ, limit: int = Limit, offset: int = Offset):
    """
    Lista animais com filtros e paginação.

    Exemplo: animais que dão lã, do mais valioso ao menos:
    `/animals?product=wool&sort=pet_value&order=desc`
    """
    return listing("animals", [("name LIKE ?", like(q)), ("biome = ?", biome), ("tameable = ?", tameable),
                               ("trainable = ?", trainable), ("product = ?", product),
                               ("pet_value >= ?", min_pet_value)], sort, order, limit, offset)


@app.get("/animals/{id}", tags=["Animais"], summary="Buscar animal por id", responses=NOT_FOUND)
def get_animal(id: int):
    """Retorna um animal pelo `id`."""
    return get_one("animals", id)


# --- ores & metals ---

@app.get("/ores", tags=["Minérios e metais"], summary="Listar minérios")
def list_ores(q: str | None = Q,
              metal: str | None = Query(None, description="Metal produzido, ex.: `iron`, `gold`. Veja `/metals`."),
              environment: str | None = Query(None, description="Onde aparece: `sedimentary`, `igneous`, `metamorphic` ou `vein`."),
              min_value: int | None = Query(None, description="Valor mínimo do minério."),
              sort: str = Sort("name"), order: Order = OrderQ, limit: int = Limit, offset: int = Offset):
    """
    Lista minérios com filtros e paginação.

    Exemplo: minérios de ferro em rocha sedimentar: `/ores?metal=iron&environment=sedimentary`
    """
    return listing("ores", [("name LIKE ?", like(q)), ("metal = ?", metal), ("environment = ?", environment),
                            ("value >= ?", min_value)], sort, order, limit, offset)


@app.get("/ores/{id}", tags=["Minérios e metais"], summary="Buscar minério por id", responses=NOT_FOUND)
def get_ore(id: int):
    """Retorna um minério pelo `id`."""
    return get_one("ores", id)


@app.get("/metals", tags=["Minérios e metais"], summary="Listar metais")
def list_metals():
    """Metais derivados dos minérios, com quantos minérios produzem cada um e o valor. Mais valiosos primeiro."""
    return rows("SELECT metal, COUNT(*) ore_count, MAX(value) value FROM ores GROUP BY metal ORDER BY value DESC, metal")


@app.get("/metals/{metal}/ores", tags=["Minérios e metais"], summary="Minérios de um metal", responses=NOT_FOUND)
def ores_for_metal(metal: str):
    """Todos os minérios que produzem o metal informado. Ex.: `/metals/copper/ores`."""
    found = rows("SELECT * FROM ores WHERE metal = ? ORDER BY name", (metal.lower(),))
    if not found:
        raise HTTPException(404, f"no ores yield {metal}")
    return found


# --- gems ---

@app.get("/gems", tags=["Gemas"], summary="Listar gemas")
def list_gems(q: str | None = Q,
              color: str | None = Query(None, description="Cor da gema, ex.: `red`, `blue`, `clear`."),
              rarity: str | None = Query(None, description="`common`, `uncommon`, `rare` ou `legendary`."),
              min_value: int | None = Query(None, description="Valor mínimo da gema."),
              sort: str = Sort("value"), order: Order = Query("desc", description="Direção da ordenação: `asc` ou `desc`."),
              limit: int = Limit, offset: int = Offset):
    """
    Lista gemas, por padrão das mais valiosas para as menos.

    Exemplo: gemas vermelhas raras: `/gems?color=red&rarity=rare`
    """
    return listing("gems", [("name LIKE ?", like(q)), ("color = ?", color), ("rarity = ?", rarity),
                            ("value >= ?", min_value)], sort, order, limit, offset)


@app.get("/gems/{id}", tags=["Gemas"], summary="Buscar gema por id", responses=NOT_FOUND)
def get_gem(id: int):
    """Retorna uma gema pelo `id`."""
    return get_one("gems", id)


# --- biomes ---

@app.get("/biomes", tags=["Biomas"], summary="Listar biomas")
def list_biomes(savagery: str | None = Query(None, description="`calm`, `wild` ou `savage`."),
                alignment: str | None = Query(None, description="`good`, `neutral` ou `evil`.")):
    """Lista os biomas. Os nomes retornados servem de filtro `biome` em criaturas e animais."""
    return rows("SELECT * FROM biomes WHERE (? IS NULL OR savagery = ?) AND (? IS NULL OR alignment = ?) ORDER BY name",
                (savagery, savagery, alignment, alignment))


@app.get("/biomes/{name}/inhabitants", tags=["Biomas"], summary="Habitantes de um bioma", responses=NOT_FOUND)
def biome_inhabitants(name: str):
    """Dados do bioma junto com todas as criaturas e animais que vivem nele. Ex.: `/biomes/caverns/inhabitants`."""
    biome = rows("SELECT * FROM biomes WHERE name = ?", (name,))
    if not biome:
        raise HTTPException(404, f"biome {name} not found")
    return {**biome[0],
            "creatures": rows("SELECT * FROM creatures WHERE biome = ? ORDER BY name", (name,)),
            "animals": rows("SELECT * FROM animals WHERE biome = ? ORDER BY name", (name,))}


# --- misc ---

@app.get("/search", tags=["Geral"], summary="Busca global")
def search(q: str = Query(min_length=2, description="Trecho do nome (mínimo 2 letras).", examples=["gold"]),
           limit: int = Query(10, ge=1, le=50, description="Máximo de resultados por tipo.")):
    """Procura o termo pelo nome em criaturas, animais, minérios, gemas e biomas ao mesmo tempo."""
    return {t: rows(f"SELECT * FROM {t} WHERE name LIKE ? ORDER BY name LIMIT ?", (like(q), limit))
            for t in ("creatures", "animals", "ores", "gems", "biomes")}


@app.get("/stats", tags=["Geral"], summary="Estatísticas")
def stats():
    """Totais de cada recurso, maior criatura e gema mais valiosa."""
    count = lambda sql: rows(sql)[0]["n"]
    return {
        "creatures": count("SELECT COUNT(*) n FROM creatures"),
        "hostile_creatures": count("SELECT COUNT(*) n FROM creatures WHERE hostile = 1"),
        "animals": count("SELECT COUNT(*) n FROM animals"),
        "tameable_animals": count("SELECT COUNT(*) n FROM animals WHERE tameable = 1"),
        "ores": count("SELECT COUNT(*) n FROM ores"),
        "metals": count("SELECT COUNT(DISTINCT metal) n FROM ores"),
        "gems": count("SELECT COUNT(*) n FROM gems"),
        "biomes": count("SELECT COUNT(*) n FROM biomes"),
        "largest_creature": rows("SELECT name, size FROM creatures ORDER BY size DESC LIMIT 1")[0],
        "most_valuable_gem": rows("SELECT name, value FROM gems ORDER BY value DESC LIMIT 1")[0],
    }


FIRST = ["Urist", "Kogan", "Bomrek", "Ast", "Litast", "Dastot", "Mafol", "Zuglar", "Olon", "Rigoth", "Tosid", "Morul", "Likot", "Sodel"]
PREFIX = ["Iron", "Stone", "Beard", "Ale", "Gem", "Hammer", "Deep", "Copper", "Granite", "Fire", "Gold", "Axe"]
SUFFIX = ["hammer", "beard", "delver", "forge", "mug", "shield", "fist", "carver", "mason", "brew", "keeper"]
PROFESSIONS = ["Miner", "Mason", "Carpenter", "Brewer", "Farmer", "Fisherdwarf", "Woodcutter", "Metalsmith",
               "Gem Cutter", "Engraver", "Mechanic", "Doctor", "Hammerdwarf", "Axedwarf", "Legendary Cheesemaker"]


def dwarf_name(rng=random):
    return f"{rng.choice(FIRST)} {rng.choice(PREFIX)}{rng.choice(SUFFIX)}"


@app.get("/dwarves/random", tags=["Anões"], summary="Gerar anões aleatórios")
def random_dwarves(count: int = Query(1, ge=1, le=50, description="Quantos anões gerar (1 a 50)."),
                   profession: str | None = Query(None, description="Força a profissão de todos, ex.: `Miner`."),
                   seed: int | None = Query(None, description="Semente: o mesmo valor sempre gera os mesmos anões.")):
    """Gera anões com nome, idade, profissão e humor. Nada é salvo no banco."""
    rng = random.Random(seed)
    return [{"name": dwarf_name(rng),
             "age": rng.randint(12, 160),
             "profession": profession or rng.choice(PROFESSIONS),
             "happiness": rng.choice(["ecstatic", "happy", "content", "unhappy", "miserable", "tantrum-prone"])}
            for _ in range(count)]


# --- events ---

EVENTS = [
    ("siege", "A vile force of darkness has arrived! {creature}s lead the charge."),
    ("megabeast", "The {creature} has come! It has taken up residence near the fortress."),
    ("mood", "{dwarf} is taken by a fey mood!"),
    ("migrants", "{n} migrants have arrived at the fortress."),
    ("caravan", "A caravan from the mountainhomes has arrived."),
    ("discovery", "{dwarf} has struck {ore}! Strike the earth!"),
    ("tantrum", "{dwarf} is throwing a tantrum!"),
    ("artifact", "{dwarf} has created a masterwork {gem} amulet!"),
    ("flood", "Water is flooding the lower levels!"),
    ("birth", "{dwarf} has given birth to a healthy dwarf."),
]


def make_event():
    kind, template = random.choice(EVENTS)
    pick = lambda table: rows(f"SELECT name FROM {table} ORDER BY RANDOM() LIMIT 1")[0]["name"]
    return {"type": kind,
            "message": template.format(creature=pick("creatures"), ore=pick("ores"), gem=pick("gems"),
                                       dwarf=dwarf_name(), n=random.randint(2, 20)),
            "at": datetime.now(timezone.utc).isoformat()}


@app.get("/events/random", tags=["Eventos"], summary="Evento aleatório")
def random_event():
    """
    Gera um único evento, no mesmo formato do stream:

    ```json
    {"type": "siege", "message": "A vile force of darkness has arrived! Trolls lead the charge.", "at": "2026-10-30T15:02:16+00:00"}
    ```

    Tipos possíveis: `siege`, `megabeast`, `mood`, `migrants`, `caravan`, `discovery`, `tantrum`, `artifact`, `flood`, `birth`.
    """
    return make_event()


@app.get("/events/stream", tags=["Eventos"], summary="Stream de eventos (SSE)",
         response_class=StreamingResponse,
         responses={200: {"content": {"text/event-stream": {}}, "description": "Fluxo contínuo de eventos"}})
async def event_stream(interval: int = Query(15, ge=1, le=300, description="Segundos entre eventos (padrão 15).")):
    """
    Simula os eventos aleatórios do jogo via **Server-Sent Events**. A conexão fica aberta e um evento
    chega imediatamente e depois a cada `interval` segundos, neste formato:

    ```
    event: game
    data: {"type": "mood", "message": "Urist Ironbeard is taken by a fey mood!", "at": "..."}
    ```

    **Terminal:**
    ```bash
    curl -N http://localhost:8000/events/stream
    ```

    **Navegador:**
    ```js
    const es = new EventSource("http://localhost:8000/events/stream");
    es.addEventListener("game", (e) => console.log(JSON.parse(e.data)));
    ```

    **Python:**
    ```python
    import httpx
    with httpx.stream("GET", "http://localhost:8000/events/stream", timeout=None) as r:
        for line in r.iter_lines():
            if line.startswith("data: "):
                print(line[6:])
    ```

    Obs.: o *Try it out* do Swagger espera a resposta terminar, então não mostra o stream.
    """
    async def gen():
        while True:
            yield f"event: game\ndata: {json.dumps(make_event())}\n\n"
            await asyncio.sleep(interval)
    return StreamingResponse(gen(), media_type="text/event-stream")
