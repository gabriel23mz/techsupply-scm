# Estructura del Proyecto — Grupo 2 (Outbound)

## Nombre del Proyecto

**TechSupply SCM - Outbound**

## Responsabilidad

El proyecto implementa el módulo de logística de salida del sistema de gestión de suministros.

Sus principales responsabilidades son:

* Gestión de clientes.
* Gestión de pedidos.
* Gestión de despachos.
* Gestión del grafo de rutas.
* Gestión de ubicaciones.
* Optimización de rutas mediante el algoritmo A*.
* Integración con Python para algoritmos de IA.
* Automatización de procesos mediante n8n.

---

# Estado Actual del Proyecto

Actualmente el proyecto cuenta con una arquitectura basada en Node.js, Express y Sequelize siguiendo una organización por capas (Controllers, Services y Models).

La mayor parte de los módulos CRUD principales ya se encuentran implementados.

Algunas integraciones (Python y n8n) se incorporarán en las siguientes fases del desarrollo.

---

```text
techsupply-outbound/
│
├── README.md
├── package.json
├── package-lock.json
├── server.js
├── eslint.config.js
│
├── docs/
│
├── frontend/
│   └── (Aplicación React - En desarrollo)
│
├── python/                       ← Pendiente de integración
│   ├── algorithms/
│   │   ├── astar.py
│   │   ├── graph.py
│   │   ├── heuristic.py
│   │   └── priority_queue.py
│   │
│   ├── data/
│   │   └── graph.json
│   │
│   ├── main.py
│   └── requirements.txt
│
├── src/
│
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   ├── categoria.controller.js
│   │   ├── cliente.controller.js
│   │   ├── despacho.controller.js
│   │   ├── detallePedido.controller.js
│   │   ├── pedido.controller.js
│   │   ├── producto.controller.js
│   │   ├── ruta.controller.js
│   │   ├── ubicacion.controller.js
│   │   └── usuario.controller.js
│   │
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   │
│   ├── models/
│   │   ├── Categoria.js
│   │   ├── Cliente.js
│   │   ├── Despacho.js
│   │   ├── DetalleIngreso.js
│   │   ├── DetalleOrdenCompra.js
│   │   ├── DetallePedido.js
│   │   ├── IngresoInventario.js
│   │   ├── OrdenCompra.js
│   │   ├── Pedido.js
│   │   ├── Producto.js
│   │   ├── Proveedor.js
│   │   ├── Ruta.js
│   │   ├── Ubicacion.js
│   │   ├── Usuario.js
│   │   └── index.js
│   │
│   ├── routes/
│   │   ├── categoria.routes.js
│   │   ├── cliente.routes.js
│   │   ├── despacho.routes.js
│   │   ├── detallePedido.routes.js
│   │   ├── pedido.routes.js
│   │   ├── producto.routes.js
│   │   ├── ruta.routes.js
│   │   ├── ubicacion.routes.js
│   │   └── usuario.routes.js
│   │
│   ├── services/
│   │   ├── categoria.service.js
│   │   ├── cliente.service.js
│   │   ├── despacho.service.js
│   │   ├── detallePedido.service.js
│   │   ├── pedido.service.js
│   │   ├── producto.service.js
│   │   ├── ruta.service.js
│   │   ├── ubicacion.service.js
│   │   ├── usuario.service.js
│   │   │
│   │   ├── logistica.service.js      ← Planificado
│   │   ├── python.service.js         ← Planificado
│   │   └── n8n.service.js            ← Planificado
│   │
│   └── utils/
│       └── apiResponse.js
│
└── n8n/                              ← Pendiente de integración
    ├── despacho_creado.json
    ├── despacho_en_transito.json
    ├── despacho_entregado.json
    └── despacho_cancelado.json
```

---

# Componentes Implementados

Actualmente el proyecto dispone de:

* Configuración de conexión a MySQL mediante Sequelize.
* Definición de modelos de base de datos.
* Asociación entre entidades.
* Arquitectura basada en Controllers y Services.
* Endpoints REST para los módulos principales.
* Manejo centralizado de errores.
* Utilidad estandarizada para respuestas de la API.

---

# Componentes Planificados

En las siguientes fases del proyecto se incorporarán:

## Integración con Python

El módulo Python será responsable de ejecutar el algoritmo A* utilizando un grafo construido dinámicamente a partir de la información almacenada en la base de datos.

Se prevé separar la implementación en:

* Construcción del grafo.
* Función heurística.
* Cola de prioridad.
* Algoritmo A*.
* Punto de entrada (`main.py`).

---

## Integración con n8n

Los procesos automatizados estarán desacoplados del backend mediante un servicio dedicado.

Entre los flujos previstos se encuentran:

* Despacho creado.
* Despacho en tránsito.
* Despacho entregado.
* Despacho cancelado.

---

## Frontend

El frontend será desarrollado en React y consumirá la API REST implementada por el backend.

Entre los módulos previstos se encuentran:

* Inicio de sesión.
* Dashboard.
* Clientes.
* Pedidos.
* Despachos.
* Ubicaciones.
* Rutas.
* Optimización de rutas.
* Seguimiento logístico.

---

# Observaciones

La estructura presentada refleja el estado actual del proyecto y podrá ampliarse conforme avance el desarrollo, manteniendo la organización modular y la separación de responsabilidades entre backend, frontend, automatizaciones e integración con algoritmos de IA.
