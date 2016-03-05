# API

## Formatas

Jei ok, grąžina HTTP 200 ir JSON:

    {"ok": true, "value": ...}

Jei klaida, grąžina HTTP klaidą ir JSON:

    {"ok": false, "error": "priežastis"}

## Procedūros

## Sensoriai

Grąžina dabartinę sensoriaus _name_ reikšmę:

    GET /rpc/<name>/

Reikšmių kitimas laike:

    GET /rpc/series/<name>/?start=<ts>&end=<ts>&resolution=<s>

_ts_ – UNIX timestampai. _resolution_ – sekundėmis, nurodyti nebūtina (default: 1).

Sensorių pavadinimai:
* _temp_ – oro temperatūra, laipsniais C.
* _humidity_ – dirvos drėgnumas, abstrakčiais vienetais.
* _light_ – apšviestumas, abstrakčiais vienetais
* _wind_ – vėjo greitis, enkoderio tikais per sekundę (600 per apsisukimą)


## Valdymo parametrai

* Dabartinė lango/durų pozicija, steperio žingsniais:

        GET /rpc/window/
        GET /rpc/door/

* Sukti lango/durų motorą į poziciją _pos_:

        PUT /rpc/window/?value=<pos>
        PUT /rpc/door/?value=<pos>

* Kiek sekundžių liko laistyti:

        GET /rpc/pump/

* Laistyti _tiek_ sekundžių:

        PUT /rpc/pump/?value=<tiek>

