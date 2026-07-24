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

El constructor tambien tolera `distancia_km`, pero el contrato actual enviado por Node usa `distancia`.

## A*

`python/algoritmo/astar.py` implementa A*. La heuristica real en `heuristica.py` retorna `0.0`, por lo que el comportamiento efectivo es equivalente a Dijkstra. Esta decision es suficiente para un MVP con grafo pequeno y pesos positivos.

Uso real:

- Calcular ruta individual en `/api/rutas/calcular`.
- Calcular distancias entre bodega, destinos y retorno dentro de la generacion de jornadas.

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

- 25 hormigas.
- 70 iteraciones.
- `alfa = 1.0`.
- `beta = 3.0`.
- evaporacion `0.35`.

## Capacidad y agrupacion

La capacidad de cada camion se interpreta como cantidad maxima de pedidos. Los pedidos con el mismo destino se agrupan para evitar visitas duplicadas cuando es posible. Si un grupo supera la capacidad maxima, se fragmenta.

## Retorno a bodega

Cada jornada termina regresando a la bodega. La distancia total incluye el retorno. La geometria general agrega un tramo `RETORNO_BODEGA`.

## OSRM

El servicio usa OSRM para obtener geometria real de carretera. OSRM devuelve coordenadas GeoJSON como `[longitud, latitud]`; el codigo las invierte a `[latitud, longitud]` para Leaflet.

Si OSRM falla, la construccion de geometria puede caer a una linea directa entre origen y destino.

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
  "velocidad_kmh": 40
}
```

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
  "pedidos_no_asignados": []
}
```

## Casos limite y limitaciones

- Si no hay pedidos, retorna jornadas vacias.
- Si no hay camiones, retorna todos los pedidos como no asignados.
- Si no hay ruta entre puntos, la distancia se trata como infinita o se lanza error segun el punto del flujo.
- No hay semilla configurable para reproducibilidad.
- No hay validadores personalizados para distancias negativas; se confia en las restricciones del backend/base.
- OSRM es una dependencia externa de red.

