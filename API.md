# API

## Formatas

Jei ok, grąžina HTTP 200 ir JSON:

    {"ok": true, "value": ...}

Jei klaida, grąžina HTTP klaidą ir JSON:

    {"ok": false, "error": "priežastis"}

## Procedūros

Nustato naują reikšmę:

    PUT /rpc/<name>/?value=<value>


## Parametrai

### Skaitymui

Grąžina dabartinę parametro _<name>_ reikšmę:

    GET /rpc/<name>/

Parametro kitimas laike:

    GET /rpc/series/<name>/?start=<ts>&end=<ts>&resolution=<s>

_<ts>_ – UNIX timestampai. _resolution_ nurodyti nebūtina (default: 1).

Parametrų pavadinimai:

* _temp_ – oro temperatūra, laipsniais C.

* _humidity_ – dirvos drėgnumas, abstrakčiais vienetais.

* _wind_ – vėjo greitis, enkoderio tikais per sekundę (600 per apsisukimą)

### Rašymui ir skaitymui

* Dabartinė lango pozicija, steperio žingsniais:

    GET /rpc/window/

* Sukti lango motorą į poziciją _pos_:

    PUT /rpc/window/?value=<pos>

* Kiek sekundžių liko laistyti:

    GET /rpc/pump/

* Laistyti _<sec>_ sekundžių:

    PUT /rpc/pump/?value=<pos>

