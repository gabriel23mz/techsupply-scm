# 05 - Motor logistico Python

## Rol del servicio

El servicio Python es un microservicio FastAPI desacoplado. No accede a la base de datos; recibe desde Node.js todos los pedidos, camiones, rutas y datos de bodega necesarios para calcular rutas o jornadas.

## Endpoints reales

| Metodo | Endpoint | Uso |
| ------ | -------- | --- |
| POST | `/api/rutas/calcular` | Calcula una ruta individual entre origen y destino |
| POST | `/api/jornadas/generar` | Genera una o varias jornadas optimizadas |

## Grafo

El grafo se construye en memoria a partir de rutas enviadas por Node.js. Cada ruta se trata como bidireccional:

```json
{
  "origen": 1,
  "destino": 2,
  "distancia": 10.5
}
```

El constructor tambien tolera `distancia_km`, pero el contrato actual enviado por Node usa `distancia`. Los nodos deben ser enteros positivos y las distancias deben ser finitas y mayores que cero.

## A*

`python/algoritmo/astar.py` implementa A*. La heuristica real en `heuristica.py` retorna `0.0`, por lo que el comportamiento efectivo es equivalente a Dijkstra. Esta decision es suficiente para un MVP con grafo pequeno y pesos positivos.

Uso real:

- Calcular ruta individual en `/api/rutas/calcular`.
- Poblar una matriz de distancias entre bodega y destinos unicos dentro de la generacion de jornadas.

A* ya no se ejecuta dentro del ciclo interno de ACO. Si el grafo esta vacio, un nodo no existe o una arista es invalida, el servicio produce errores controlados.

## ACO-CVRP

La generacion de jornadas usa una metaheuristica de colonia de hormigas para un problema tipo CVRP:

- Agrupa pedidos por destino.
- Valida camiones con capacidad positiva.
- Fragmenta grupos si una ubicacion tiene mas pedidos que la capacidad maxima.
- Asigna grupos a camiones.
- Ordena destinos por camion.
- Penaliza pedidos no asignados, destinos divididos y aristas repetidas.
- Retorna pedidos no asignados cuando no hay capacidad o factibilidad.

Parametros por defecto:

- Hormigas adaptativas entre 8 y 25 segun destinos.
- Iteraciones adaptativas entre 18 y 70 segun destinos.
- Parada temprana por iteraciones sin mejora.
- `alfa = 1.0`.
- `beta = 3.0`.
- evaporacion `0.35`.
- semilla opcional por contrato (`semilla` o `aco.semilla`).

La metaheuristica usa una instancia local `random.Random`, no el estado global de `random`. Misma entrada, misma configuracion y misma semilla producen el mismo resultado estable.

## Matriz de distancias y cache

Por solicitud se construye una matriz solo para:

- Bodega.
- Destinos unicos de pedidos.

La matriz conserva distancia y camino de nodos por par. ACO consulta distancias en O(1), y la expansion final de entregas reutiliza los caminos guardados. Esto evita recalcular A* para cada hormiga, iteracion o evaluacion de costo.

## Capacidad y agrupacion

La capacidad de cada camion se interpreta como cantidad maxima de pedidos. Los pedidos con el mismo destino se agrupan para evitar visitas duplicadas cuando es posible. Si un grupo supera la capacidad maxima, se fragmenta.

## Retorno a bodega

Cada jornada termina regresando a la bodega. La distancia total incluye el retorno. La geometria general agrega un tramo `RETORNO_BODEGA`.

## OSRM

El servicio usa OSRM para obtener geometria real de carretera. OSRM devuelve coordenadas GeoJSON como `[longitud, latitud]`; el codigo las invierte a `[latitud, longitud]` para Leaflet.

OSRM no participa en ACO. Se llama solamente para las jornadas finales y usa cache por tramo dentro de la solicitud. Si OSRM falla, excede timeout, devuelve error HTTP, no JSON o geometria vacia, la construccion de geometria cae a una linea directa entre origen y destino. Ese fallback es visual y no representa distancia vial exacta.

El frontend tambien usa OSRM para calculo vial auxiliar al crear/previsualizar rutas. Esa duplicacion sigue existiendo y pertenece a un flujo distinto al dibujo de jornadas, que consume la geometria entregada por backend/Python.

## Contrato de errores

Los errores controlados de FastAPI usan:

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "No existe una ruta entre el origen y el destino",
    "details": {}
  }
}
```

Codigos usados o reservados:

- `INVALID_INPUT`
- `NODE_NOT_FOUND`
- `ROUTE_NOT_FOUND`
- `DISCONNECTED_GRAPH`
- `INVALID_DISTANCE`
- `INVALID_COORDINATES`
- `INVALID_CAPACITY`
- `DUPLICATE_ORDER`
- `DUPLICATE_TRUCK`
- `OSRM_TIMEOUT`
- `OSRM_UNAVAILABLE`
- `INVALID_RESULT`

## Contrato de ruta individual

Entrada:

```json
{
  "origenId": 1,
  "destinoId": 2,
  "rutas": [
    {
      "origen": 1,
      "destino": 2,
      "distancia": 10
    }
  ]
}
```

Salida:

```json
{
  "ruta": [1, 2],
  "distancia_total": 10,
  "tiempo_estimado": 15
}
```

## Contrato de jornadas

Entrada resumida:

```json
{
  "bodega": {
    "id": 1,
    "nombre": "Bodega Central",
    "latitud": -1.05458,
    "longitud": -80.45445
  },
  "camiones": [
    {
      "id": 1,
      "codigo": "CAM-001",
      "placa": "ABC-123",
      "capacidad": 4
    }
  ],
  "pedidos": [
    {
      "pedido_id": 10,
      "cliente_id": 3,
      "cliente": "Cliente",
      "destino_id": 2,
      "ubicacion": "Destino",
      "latitud": -0.78601,
      "longitud": -80.23473,
      "fecha_entrega": "2026-07-23"
    }
  ],
  "grafo": [
    {
      "origen": 1,
      "destino": 2,
      "distancia": 10
    }
  ],
  "velocidad_kmh": 40,
  "semilla": 42,
  "benchmark": false,
  "aco": {
    "num_hormigas": 12,
    "iteraciones": 30,
    "iteraciones_sin_mejora": 12,
    "semilla": 42
  }
}
```

Los campos `semilla`, `benchmark` y `aco` son opcionales y mantienen compatibilidad con las solicitudes anteriores.

Salida resumida:

```json
{
  "jornadas": [
    {
      "camion_id": 1,
      "capacidad_camion": 4,
      "capacidad_utilizada": 1,
      "ruta_general": {},
      "distancia_total_km": 20,
      "tiempo_estimado_min": 30,
      "entregas": [
        {
          "pedido_id": 10,
          "orden_entrega": 1,
          "ruta_parcial": {},
          "distancia_acumulada_km": 10,
          "tiempo_acumulado_min": 15,
          "fecha_estimada_entrega": "2026-07-23T10:15:00"
        }
      ]
    }
  ],
  "pedidos_no_asignados": [],
  "pedidos_no_asignados_detalle": []
}
```

## Casos limite y limitaciones

- Si no hay pedidos, retorna jornadas vacias.
- Si no hay camiones, retorna todos los pedidos como no asignados.
- Si un destino no es alcanzable pero otros si lo son, el pedido queda en `pedidos_no_asignados` y se agrega razon en `pedidos_no_asignados_detalle`.
- Si la ruta individual no existe, se devuelve error controlado.
- Distancias, coordenadas, IDs, capacidades, velocidad y duplicados se validan antes del algoritmo.
- OSRM es una dependencia externa de red.

## Benchmark Fase 3

Benchmarks con OSRM simulado, misma entrada, calentamiento y tres mediciones:

| Escenario | Antes mediana | Despues mediana | Mejora | A* antes 3 runs | A* despues/run | Distancia antes | Distancia despues |
| --------- | ------------: | ---------------: | -----: | --------------: | ------------: | --------------: | ----------------: |
| 5 pedidos / 1 camion | 2.0253s | 0.0183s | 99.1% | 110268 | 15 | 16.00 | 16.00 |
| 14 pedidos / 3 camiones | 21.7033s | 0.2184s | 99.0% | 640551 | 105 | 75.00 | 73.00 |
| 30 pedidos / 5 camiones | >180s timeout | 1.0879s | no comparable exacto | no completado | 465 | no completado | 221.00 |
| destinos repetidos | 1.3917s | 0.0113s | 99.2% | 78768 | 10 | 18.00 | 18.00 |

El cuello de botella era el recalculo de A* dentro del ciclo de ACO. La geometria OSRM no domina estos benchmarks porque se simulo sin red; con OSRM real el tiempo dependera de red, pero las llamadas quedan acotadas a tramos finales.
