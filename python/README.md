# TechSupply Outbound - Servicio de Cálculo de Rutas

## Descripción

Este módulo implementa el servicio de cálculo de rutas utilizado por **TechSupply Outbound**.

Su única responsabilidad es calcular la ruta óptima entre dos ubicaciones utilizando el algoritmo **A\*** y devolver el resultado al backend desarrollado en Node.js.

El servicio expone una API HTTP mediante **FastAPI** y no posee dependencias con la lógica de negocio del sistema.

---

# Responsabilidades

El servicio es responsable de:

- Construir el grafo en memoria.
- Ejecutar el algoritmo A*.
- Reconstruir la ruta óptima.
- Calcular la distancia total.
- Estimar el tiempo de recorrido.
- Devolver el resultado mediante JSON.

---

# No es responsabilidad del servicio

Este módulo **no**:

- Accede a MySQL.
- Utiliza Sequelize.
- Consulta pedidos.
- Consulta clientes.
- Guarda despachos.
- Implementa reglas de negocio.

Toda la información necesaria es proporcionada por el backend Node.js.

---

# Arquitectura

```text
Node.js

↓

python.service.js

↓

HTTP (JSON)

↓

FastAPI

↓

Construcción del grafo

↓

Algoritmo A*

↓

Reconstrucción del camino

↓

Tiempo estimado

↓

Respuesta JSON
```

---

# Estructura del proyecto

```text
python/

│
├── .venv/
│
├── algoritmo/
│   ├── astar.py
│   ├── grafo.py
│   └── heuristica.py
│
├── modelos/
│   ├── contratos.py
│   ├── nodo.py
│   └── tipos.py
│
├── utils/
│   ├── reconstruccion.py
│   └── tiempo.py
│
├── .gitignore
├── app.py
├── requirements.txt
└── README.md
```

---

# Requisitos

- Python 3.12 o superior
- FastAPI
- Uvicorn

---

# Instalación

Crear un entorno virtual:

```bash
python -m venv .venv
```

Activar el entorno virtual.

Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

---

# Ejecutar el servicio

Desde la carpeta `python`:

```bash
python -m uvicorn app:app --reload
```

El servicio quedará disponible en:

```text
http://127.0.0.1:8000
```

---

# Documentación automática

FastAPI genera automáticamente la documentación de la API.

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

---

# Contrato de entrada

```json
{
  "origenId": 1,
  "destinoId": 10,
  "rutas": [
    {
      "origen": 1,
      "destino": 2,
      "distancia": 14
    }
  ]
}
```

---

# Contrato de salida

```json
{
  "ruta": [
    1,
    3,
    7,
    10
  ],
  "distancia_total": 84.3,
  "tiempo_estimado": 97
}
```

---

# Algoritmo

Durante el MVP el servicio utiliza el algoritmo **A\*** con una heurística nula:

```text
h(n) = 0
```

En estas condiciones el comportamiento es equivalente al algoritmo de Dijkstra, garantizando la obtención de la ruta óptima.

La arquitectura permite reemplazar esta heurística por una basada en coordenadas geográficas sin modificar el resto del algoritmo.

---

# Integración

Este servicio es consumido exclusivamente por `python.service.js`.

El backend Node.js es responsable de:

- Obtener la información desde la base de datos.
- Construir el contrato de entrada.
- Invocar este servicio.
- Persistir el resultado.
- Continuar el flujo logístico.

---

# Estado del módulo

✅ Construcción del grafo implementada.

✅ Algoritmo A* implementado.

✅ Reconstrucción del camino implementada.

✅ Estimación del tiempo implementada.

✅ API HTTP implementada mediante FastAPI.

✅ Documentación automática disponible.

---

# Futuras mejoras

La arquitectura permite incorporar nuevas funcionalidades sin modificar el contrato con Node.js, por ejemplo:

- Heurística basada en coordenadas GPS.
- Distancias calculadas mediante Haversine.
- Calles unidireccionales.
- Restricciones de tráfico.
- Cálculo de múltiples rutas.
- Optimización para múltiples despachos simultáneos.

