# TechSupply SCM Outbound — Motor Logístico Python

Servicio desacoplado de optimización de rutas desarrollado con FastAPI.

El backend Node.js envía todos los datos necesarios, Python construye el grafo en memoria, ejecuta los algoritmos y devuelve un contrato JSON. Este servicio no accede a PostgreSQL, no conoce usuarios o permisos y no persiste jornadas ni despachos.

---

## Responsabilidad

Python resuelve dos problemas:

1. **Ruta individual:** camino de menor costo entre dos ubicaciones.
2. **Planificación multivehículo:** distribución de pedidos entre camiones y ordenamiento de sus destinos.

```text
Node.js
  ├── obtiene pedidos, camiones, rutas y bodega
  ├── limita recursos según reglas operativas
  └── envía el contrato
        ↓
FastAPI
  ├── valida el payload
  ├── construye el grafo
  ├── calcula A* y ACO-CVRP
  ├── obtiene geometrías OSRM
  └── devuelve jornadas y no asignados
        ↓
Node.js
  ├── revalida recursos
  ├── abre la transacción
  ├── persiste jornadas y despachos
  └── aplica estados y trazabilidad
```

Python no administra:

- Autenticación o permisos.
- Pedidos comerciales.
- Preparación o carga.
- Choferes.
- Estados del dominio.
- Fechas reales de inicio, entrega o finalización.
- Persistencia o transacciones.

---

## Tecnologías

- Python 3.13 o compatible.
- FastAPI.
- Uvicorn.
- Pydantic 2.
- Requests.
- `unittest` para pruebas.

Dependencias exactas en [`requirements.txt`](requirements.txt).

---

## Estructura

```text
python/
├── algoritmo/
│   ├── astar.py
│   ├── colonia_hormigas_cvrp.py
│   ├── grafo.py
│   ├── heuristica.py
│   ├── metaheuristica_jornada.py
│   └── osrm_service.py
├── benchmarks/
│   └── benchmark_jornadas.py
├── modelos/
│   ├── contratos.py
│   ├── nodo.py
│   └── tipos.py
├── tests/
│   └── test_*.py
├── utils/
│   ├── reconstruccion.py
│   └── tiempo.py
├── app.py
├── errores.py
├── requirements.txt
└── README.md
```

---

## Instalación

En Windows PowerShell:

```powershell
cd python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Ejecutar el servicio:

```powershell
python -m uvicorn app:app --reload
```

URL local:

```text
http://127.0.0.1:8000
```

Documentación interactiva de FastAPI:

```text
http://127.0.0.1:8000/docs
```

Desde la raíz del repositorio también puede ejecutarse:

```bash
npm run dev:python
```

Ese script utiliza la ruta del entorno virtual de Windows.

---

## Endpoints

| Método | Endpoint | Uso |
|---|---|---|
| `POST` | `/api/rutas/calcular` | Calcula una ruta individual |
| `POST` | `/api/jornadas/generar` | Genera una o varias jornadas optimizadas |

---

## Grafo

El grafo se construye por solicitud a partir de las rutas enviadas por Node.js.

```json
{
  "origen": 1,
  "destino": 2,
  "distancia": 10.5
}
```

Reglas:

- IDs enteros positivos.
- Distancias finitas y mayores que cero.
- Las rutas se incorporan como conexiones bidireccionales.
- El constructor tolera `distancia_km`, aunque el contrato vigente usa `distancia`.

---

## A*

`algoritmo/astar.py` calcula caminos mínimos.

La heurística actual retorna `0.0`, por lo que el comportamiento efectivo es equivalente a Dijkstra. Con pesos positivos, produce el camino de menor costo conocido en el grafo.

Usos:

- Endpoint de ruta individual.
- Construcción de la matriz de distancias para destinos únicos antes de ACO.

A* no se ejecuta dentro del ciclo interno de cada hormiga. Los resultados de distancia y camino se precalculan y reutilizan por solicitud.

---

## ACO-CVRP

La generación de jornadas usa una colonia de hormigas aplicada a un problema tipo CVRP.

El algoritmo:

- Agrupa pedidos por destino.
- Valida capacidades positivas.
- Fragmenta grupos que exceden la capacidad máxima.
- Asigna grupos a camiones.
- Ordena los destinos de cada camión.
- Penaliza pedidos no asignados.
- Penaliza destinos divididos y aristas repetidas.
- Regresa obligatoriamente a la bodega.

Parámetros predeterminados:

- Hormigas adaptativas entre 8 y 25.
- Iteraciones adaptativas entre 18 y 70.
- Parada temprana por falta de mejora.
- `alfa = 1.0`.
- `beta = 3.0`.
- Evaporación `0.35`.
- Semilla opcional.

La implementación usa `random.Random` local. Con la misma entrada, configuración y semilla se obtiene un resultado reproducible.

---

## Matriz de distancias y caché

Por solicitud se calcula una matriz entre:

- Bodega.
- Destinos únicos de los pedidos.

La matriz conserva:

- Distancia.
- Camino de nodos.

ACO consulta las distancias en O(1) y la expansión final reutiliza los caminos guardados. Esta optimización eliminó el recálculo masivo de A* dentro de la metaheurística.

---

## OSRM y geometría

Después de determinar las jornadas finales, Python consulta OSRM para obtener geometrías viales.

OSRM devuelve coordenadas GeoJSON:

```text
[longitud, latitud]
```

El servicio las transforma para Leaflet:

```text
[latitud, longitud]
```

OSRM:

- No participa en el costo interno de ACO.
- Se consulta solo para los tramos finales.
- Usa caché por tramo dentro de la solicitud.
- Tiene fallback a línea directa si falla la red, el timeout o la geometría.

El fallback permite completar la respuesta visual, pero no representa una distancia vial exacta.

---

## Contrato de ruta individual

### Entrada

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

### Salida

```json
{
  "ruta": [1, 2],
  "distancia_total": 10,
  "tiempo_estimado": 15
}
```

---

## Contrato de jornadas

### Entrada resumida

```json
{
  "bodega": {
    "id": 1,
    "nombre": "Bodega Central ESPAM MFL",
    "latitud": -0.82726,
    "longitud": -80.18695
  },
  "camiones": [
    {
      "id": 1,
      "codigo": "CAM-001",
      "placa": "ABC-1234",
      "capacidad": 5
    }
  ],
  "pedidos": [
    {
      "pedido_id": 10,
      "cliente_id": 3,
      "cliente": "Cliente demo",
      "destino_id": 4,
      "ubicacion": "Calceta Centro",
      "latitud": -0.84582,
      "longitud": -80.16389,
      "fecha_entrega": null
    }
  ],
  "grafo": [
    {
      "origen": 1,
      "destino": 4,
      "distancia": 5.4
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

`semilla`, `benchmark` y `aco` son opcionales.

Python no recibe choferes. Node limita previamente los camiones según los choferes disponibles y asigna cada chofer después de recibir la planificación.

### Salida resumida

```json
{
  "jornadas": [
    {
      "camion_id": 1,
      "capacidad_camion": 5,
      "capacidad_utilizada": 1,
      "ruta_general": {
        "bodega": {},
        "puntos": [],
        "geometria": [],
        "tramos": []
      },
      "distancia_total_km": 10.8,
      "tiempo_estimado_min": 17,
      "entregas": [
        {
          "pedido_id": 10,
          "orden_entrega": 1,
          "ruta_parcial": {},
          "distancia_acumulada_km": 5.4,
          "tiempo_acumulado_min": 9
        }
      ]
    }
  ],
  "pedidos_no_asignados": [],
  "pedidos_no_asignados_detalle": []
}
```

Node calcula después las fechas estimadas usando la fecha operativa, el inicio estimado, el tiempo de servicio, el margen y el límite de minutos operativos diarios.

---

## Errores

Los errores controlados mantienen este contrato:

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "No existe una ruta entre el origen y el destino",
    "details": {}
  }
}
```

Códigos contemplados:

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

Node traduce timeouts, indisponibilidad y contratos inválidos a errores operacionales del backend.

---

## Casos límite

- Sin pedidos: retorna jornadas vacías.
- Sin camiones: todos los pedidos quedan no asignados.
- Destino no alcanzable: el pedido queda no asignado con su razón.
- Ruta individual inexistente: error controlado.
- IDs, coordenadas, distancias, capacidades, velocidad y duplicados se validan antes del algoritmo.
- OSRM depende de una red externa y puede usar fallback.

---

## Pruebas

Desde la raíz:

```bash
npm run test:python
```

Desde `python/`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"
```

Línea base validada:

- 24 pruebas Python aprobadas.

Las pruebas cubren contratos, validaciones, A*, metaheurística, agrupación, geometría y fallos de OSRM mediante mocks.

---

## Benchmark

Desde la raíz:

```bash
npm run benchmark:python
```

El benchmark utiliza semilla fija, calentamiento y OSRM simulado para separar el tiempo algorítmico del tiempo de red.

Resultados de referencia:

| Escenario | Antes | Después |
|---|---:|---:|
| 5 pedidos / 1 camión | 2,0253 s | 0,0183 s |
| 14 pedidos / 3 camiones | 21,7033 s | 0,2184 s |
| 30 pedidos / 5 camiones | más de 180 s | 1,0879 s |
| Destinos repetidos | 1,3917 s | 0,0113 s |

El cuello de botella corregido era la ejecución repetida de A* dentro del ciclo de ACO.

---

## Decisiones que deben conservarse

- Python permanece desacoplado de PostgreSQL.
- Python no modifica estados del negocio.
- ACO usa una matriz de distancias precalculada.
- OSRM se consulta solo para las soluciones finales.
- El retorno a bodega forma parte de cada jornada.
- Node valida el contrato recibido antes de persistir.
- Python no recibe ni asigna choferes.
