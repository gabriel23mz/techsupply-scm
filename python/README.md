# TechSupply SCM Outbound — Servicio de Optimización Logística

Servicio Python del módulo **Outbound** de **TechSupply SCM**, desarrollado con **FastAPI** para resolver cálculos de rutas y planificación logística solicitados por el backend Node.js.

El módulo conserva el cálculo de rutas individuales mediante **A\*** y añade la generación de múltiples jornadas de reparto mediante una **metaheurística de colonia de hormigas aplicada a un problema CVRP**.

---

## Capacidades principales

El servicio expone dos funciones diferentes:

### Ruta individual

Calcula el camino de menor costo entre dos ubicaciones del grafo.

- Construcción del grafo en memoria.
- Ejecución de A\*.
- Reconstrucción del camino.
- Cálculo de distancia total.
- Estimación de tiempo.

### Generación de jornadas

Distribuye pedidos entre camiones y ordena los destinos de cada jornada.

- Agrupación de pedidos por destino.
- Validación de capacidad de camiones.
- Fragmentación de grupos cuando superan la capacidad máxima.
- Asignación de pedidos mediante colonia de hormigas.
- Optimización del orden de visita.
- Penalización de pedidos no asignados, destinos divididos y aristas repetidas.
- Construcción de rutas individuales por jornada.
- Regreso obligatorio a la bodega.
- Cálculo de distancias y tiempos acumulados.
- Generación de geometría vial mediante OSRM.
- Creación de tramos para visualización en Leaflet.

---

## Arquitectura de integración

```text
Frontend React
      │
      ▼
Backend Node.js + Express
      │
      ├── obtiene datos desde PostgreSQL / Supabase
      ├── construye el contrato de entrada
      └── invoca el servicio Python
              │
              ▼
        FastAPI
              │
              ├── A* para caminos mínimos
              ├── Colonia de hormigas CVRP
              └── OSRM para geometrías viales
              │
              ▼
        Respuesta JSON
              │
              ▼
Backend persiste jornadas, despachos y rutas
```

El servicio Python **no accede directamente a la base de datos** y no guarda información por sí mismo.

---

## Estructura del proyecto

```text
python/
├── algoritmo/
│   ├── __init__.py
│   ├── astar.py
│   ├── colonia_hormigas_cvrp.py
│   ├── grafo.py
│   ├── heuristica.py
│   ├── metaheuristica_jornada.py
│   └── osrm_service.py
├── modelos/
│   ├── __init__.py
│   ├── contratos.py
│   └── tipos.py
├── utils/
│   ├── __init__.py
│   ├── reconstruccion.py
│   └── tiempo.py
├── .gitignore
├── app.py
├── requirements.txt
└── README.md
```

---

## Algoritmos utilizados

### A\*

El endpoint de ruta individual utiliza A\* con heurística nula:

```text
h(n) = 0
```

En estas condiciones su comportamiento es equivalente a Dijkstra y garantiza el camino de menor costo dentro del grafo recibido.

A\* también se utiliza internamente para calcular la distancia entre ubicaciones durante la construcción de las jornadas.

### Colonia de hormigas CVRP

La planificación de jornadas utiliza una metaheurística inspirada en el comportamiento de las hormigas.

La solución considera:

- varios camiones;
- capacidad máxima por camión;
- múltiples pedidos;
- pedidos agrupados por destino;
- recorrido desde la bodega;
- retorno a la bodega;
- pedidos que no pueden asignarse.

El costo de cada solución incluye la distancia total y penalizaciones para desalentar configuraciones poco convenientes.

---

## Geometría vial

Después de determinar el orden de los destinos, el servicio consulta **OSRM** para obtener la geometría real de cada tramo.

OSRM devuelve coordenadas GeoJSON en el formato:

```text
[longitud, latitud]
```

El servicio las transforma al formato utilizado por Leaflet:

```text
[latitud, longitud]
```

Si OSRM no responde para un tramo, se utiliza como respaldo una línea directa entre origen y destino para no interrumpir la generación completa.

---

## Endpoints

### Calcular una ruta individual

```http
POST /api/rutas/calcular
```

#### Entrada

```json
{
  "origenId": 1,
  "destinoId": 4,
  "rutas": [
    {
      "origen": 1,
      "destino": 2,
      "distancia": 18.5
    },
    {
      "origen": 2,
      "destino": 4,
      "distancia": 27.3
    }
  ]
}
```

#### Salida

```json
{
  "ruta": [1, 2, 4],
  "distancia_total": 45.8,
  "tiempo_estimado": 55
}
```

---

### Generar jornadas de reparto

```http
POST /api/jornadas/generar
```

#### Entrada resumida

```json
{
  "bodega": {
    "id": 1,
    "nombre": "Bodega Central",
    "latitud": -0.845,
    "longitud": -80.16
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
      "cliente": "Cliente de prueba",
      "destino_id": 4,
      "ubicacion": "Chone",
      "latitud": -0.69819,
      "longitud": -80.09361,
      "fecha_entrega": "2026-07-15"
    }
  ],
  "grafo": [
    {
      "origen": 1,
      "destino": 4,
      "distancia": 64.2
    }
  ],
  "velocidad_kmh": 40
}
```

#### Salida resumida

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
      "distancia_total_km": 128.4,
      "tiempo_estimado_min": 193,
      "entregas": []
    }
  ],
  "pedidos_no_asignados": []
}
```

La respuesta completa contiene la información necesaria para que el backend cree las jornadas y los despachos asociados.

---

## Contratos

Los modelos Pydantic se encuentran en:

```text
modelos/contratos.py
```

Contratos principales:

- `SolicitudRuta`
- `SolicitudJornada`
- `RutaEntrada`
- `BodegaEntrada`
- `CamionEntrada`
- `PedidoJornadaEntrada`

---

## Requisitos

- Python 3.12 o superior.
- FastAPI.
- Uvicorn.
- Pydantic.
- Requests.

---

## Instalación

Crear el entorno virtual:

```bash
python -m venv .venv
```

Activarlo en Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Activarlo en Linux o macOS:

```bash
source .venv/bin/activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

---

## Ejecución

Desde la carpeta del servicio:

```bash
python -m uvicorn app:app --reload
```

El servicio quedará disponible en:

```text
http://127.0.0.1:8000
```

---

## Documentación automática

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

---

## Responsabilidades del backend Node.js

El backend es responsable de:

- consultar PostgreSQL mediante Sequelize;
- obtener pedidos, camiones, rutas y ubicaciones;
- construir el contrato de entrada;
- invocar FastAPI;
- validar la respuesta;
- persistir jornadas y despachos;
- actualizar estados;
- disparar automatizaciones mediante n8n.

---

## Manejo de errores

El servicio puede rechazar una solicitud cuando:

- no existen camiones con capacidad válida;
- la velocidad es menor o igual a cero;
- no existe conexión entre dos ubicaciones;
- no puede construirse una solución válida;
- el contrato recibido no cumple los modelos Pydantic.

FastAPI devuelve automáticamente errores de validación para contratos inválidos.

---

## Estado actual

**Versión del servicio:** 2.0.0

El módulo se encuentra funcional para el MVP e implementa:

- ruta individual con A\*;
- generación de múltiples jornadas;
- asignación de pedidos a camiones;
- optimización mediante colonia de hormigas CVRP;
- cálculo de tiempos y distancias;
- geometría vial con OSRM;
- retorno a bodega;
- contratos HTTP con FastAPI.

Las siguientes mejoras estarán orientadas a pruebas automatizadas, configuración externa de parámetros y observabilidad del servicio.
