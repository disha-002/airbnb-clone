"""Curated Unsplash photo IDs (free to use under the Unsplash License), grouped by what they show."""

VILLA = [
    "1416331108676-a22ccb276e35", "1499793983690-e29da59ef1c2", "1512917774080-9991f1c4c750",
    "1520250497591-112f2f40a3f4", "1564013799919-ab600027ffc6", "1566073771259-6a8506099945",
    "1571003123894-1f0594d2b5d9", "1571896349842-33c89424de2d", "1575517111478-7f6afd0973db",
    "1580587771525-78b9dba3b914", "1582268611958-ebfd161ef9cf", "1584132967334-10e028bd69f7",
    "1599809275671-b5942cabc7a2", "1600596542815-ffad4c1539a9", "1602343168117-bb8ffe3e2e9f",
    "1613490493576-7fde63acd811", "1613977257363-707ba9348227", "1615571022219-eb45cf7faa9d",
]
CABIN = [
    "1449158743715-0a90ebb6d2d8", "1510798831971-661eb04b3739", "1518780664697-55e3ad937233",
    "1542718610-a1d656d1884c", "1587061949409-02df41d5e562", "1595521624992-48a59aef95e3",
    "1596394516093-501ba68a0ba6", "1568605114967-8130f3a36994",
]
HOUSE = [
    "1464146072230-91cabc968266", "1475855581690-80accde3ae2b", "1494526585095-c41746248156",
    "1523217582562-09d0def993a6", "1570129477492-45c003edd2be", "1576941089067-2de3c901e126",
    "1583608205776-bfd35f0d9f83", "1588880331179-bc9b93a8cb5e", "1592595896551-12b371d546d5",
    "1598228723793-52759bba239c", "1605276374104-dee2a0ed3cd6",
]
MODERN = [
    "1600047509807-ba8f99d2cdde", "1600563438938-a9a27216b4f5", "1600566753190-17f0baa2a6c3",
    "1600573472592-401b489a3cdc", "1600585154340-be6161a56a0c", "1600585154526-990dced4db0d",
]
LIVING = [
    "1493809842364-78817add7ffb", "1501183638710-841dd1904471", "1502672260266-1c1ef2d93688",
    "1505691938895-1758d7feb511", "1522708323590-d24dbb6b0267", "1536376072261-38c75010e6c9",
    "1554995207-c18c203602cb", "1560448204-e02f11c3d0e2", "1564078516393-cf04bd966897",
    "1586023492125-27b2c045efd7", "1600121848594-d8644e57abab", "1600210492486-724fe5c67fb0",
    "1600566753086-00f18fb6b3ea", "1600607687939-ce8a6c25118c", "1613545325278-f24b0cae1224",
    "1616486338812-3dadae4b4ace", "1618221195710-dd6b41faaea6",
]
BEDROOM = [
    "1505693416388-ac5ce068fe85", "1522771739844-6a9f6d5f14af", "1540518614846-7eded433c457",
    "1590490360182-c33d57733427", "1595526114035-0d45ed16cfbf", "1600607687644-c7171b42498f",
    "1611892440504-42a792e24d32", "1615874959474-d609969a20ed", "1616594039964-ae9021a400a0",
    "1631049307264-da0ec9d70304",
]
KITCHEN = [
    "1484154218962-a197022b5858", "1507089947368-19c1da9775ae", "1602872030219-ad2b9a54315c",
    "1617806118233-18e1de247200", "1513694203232-719a280e022f", "1600494603989-9650cf6ddd3d",
]
BATH = ["1552321554-5fefe8c9ef14", "1600566752355-35792bedcfea"]

# What the first (cover) photo shows for each property type, like real listings.
COVER_BY_TYPE = {
    "Villa": VILLA, "Cabin": CABIN, "Home": HOUSE,
    "Apartment": MODERN + LIVING, "Flat": LIVING, "Room": BEDROOM,
}


def url(photo_id: str, width: int = 1200) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={width}&q=80"


def gallery(property_type: str, rnd, n: int) -> list[str]:
    """Cover + living room + bedroom + kitchen + bathroom/second bedroom: 5 photos, no repeats.
    `n` is how many listings of this type came before, so covers cycle before they repeat."""
    covers = COVER_BY_TYPE[property_type]
    cover = covers[n % len(covers)]
    pools = [LIVING, BEDROOM, KITCHEN, rnd.choice([BATH, BEDROOM])]
    picks = [cover]
    for pool in pools:
        picks.append(rnd.choice([p for p in pool if p not in picks]))
    return [url(p) for p in picks]
