
# 📦 07. Arquitectura de Negocio del Módulo de Despacho (Versión MVP Final)



# 🎯 Objetivo

Definir la arquitectura funcional del módulo de **Despachos** como capa exclusivamente logística del sistema.

Este módulo NO automatiza el flujo de pedidos.

Su propósito es permitir que un operador logístico:

```text
Seleccione un pedido listo
↓
Genere un despacho manualmente
↓
Calcule la ruta óptima (A*)
↓
Confirme la operación
↓
Genere el despacho
````

---

# 🧠 Filosofía del Módulo

El sistema se divide en tres dominios completamente separados:

```text
VENTAS (Módulo 06)
├── Pedido
├── DetallePedido
└── Inventario

↓

LOGÍSTICA (Módulo 07)
├── Despacho
├── Servicio de rutas
├── Integración A*

↓

AUTOMATIZACIÓN
├── n8n
├── Notificaciones
├── Tracking
```

---

# 🚚 Principio clave del módulo de Despacho

El módulo de despacho:

```text
NO crea despachos automáticamente
NO modifica pedidos
NO toma decisiones de negocio
```

Solo ejecuta acciones cuando el operador lo solicita explícitamente.

---

# 📌 Flujo general del módulo

```text
Pedidos en LISTO_PARA_DESPACHO
↓
Operador consulta pedidos disponibles
↓
Selecciona pedido
↓
Solicita generar despacho
↓
Sistema calcula ruta (A*)
↓
Se muestra resumen al operador
↓
Operador confirma
↓
Se crea despacho
↓
Pedido pasa a DESPACHADO
```

---

# 🧾 Modelo de Despacho (MVP)

```text
id
pedido_id
estado
fecha_salida
fecha_entrega

ruta_json
distancia_total
tiempo_estimado
```

---

# 🧠 Estados del Despacho

```text
PENDIENTE
EN_TRANSITO
ENTREGADO
CANCELADO
```

---

# 📦 Regla fundamental

Un despacho solo puede crearse si:

```text
Pedido está en LISTO_PARA_DESPACHO
```

Y además:

```text
Tiene DetallePedido registrado
```

---

# 🚫 Restricciones del módulo

No se permite:

```text
Crear despacho automáticamente
Modificar pedidos desde logística
Editar productos o precios
Generar rutas manuales por el operador
Saltarse el cálculo de ruta
```

---

# 🧭 Flujo operativo del despacho (MVP)

---

## 1. Consulta de pedidos disponibles

```http
GET /despachos/pedidos-disponibles
```

Retorna:

```text
Pedidos en LISTO_PARA_DESPACHO
```

---

## 2. Generar despacho (acción del operador)

```http
POST /despachos/generar
```

```json
{
  "pedido_id": 15
}
```

---

## 3. Proceso interno del backend

```text
Validar pedido
↓
Validar estado (LISTO_PARA_DESPACHO)
↓
Validar detalles
↓
Buscar cliente
↓
Obtener ubicación destino
↓
Consultar tabla rutas (BD)
↓
Construir grafo
↓
Enviar a python.service (A*)
↓
Recibir ruta óptima
↓
Calcular distancia y tiempo
↓
Mostrar resumen al operador
```

---

## 4. Confirmación del operador

Antes de crear el despacho el sistema muestra:

```text
Pedido #15

Origen:
Calceta (Bodega Central)

Destino:
Cliente

Ruta:
Calceta → Chone → Portoviejo

Distancia:
52 km

Tiempo estimado:
35 min
```

Acciones:

```text
[ Confirmar ]
[ Cancelar ]
```

---

## 5. Creación del despacho

Si el operador confirma:

```text
Se crea despacho
estado = PENDIENTE
```

y:

```text
Pedido → DESPACHADO
```

---

# 🧠 Integración con A*

## 📌 Regla clave del MVP

El grafo NO es fijo ni cacheado.

Se construye en cada despacho:

```text
BD rutas
↓
SELECT * FROM rutas
↓
Transformación a JSON
↓
Python A*
↓
Respuesta
```

---

## 🧾 Grafo generado dinámicamente

```json
{
  "nodes": ["Calceta", "Chone", "Portoviejo"],
  "edges": [
    { "from": "Calceta", "to": "Chone", "distance": 18 },
    { "from": "Chone", "to": "Portoviejo", "distance": 34 }
  ]
}
```

👉 Este grafo es el “grafo vivo del sistema”.

---

# 🐍 Servicio Python (A* aislado)

Estructura:

```text
python/
├── algorithms/
│   ├── astar.py
│   ├── graph.py
│   ├── heuristic.py
│   └── priority_queue.py
├── data/
│   └── graph.json
├── main.py
└── requirements.txt
```

---

## Responsabilidad

```text
Recibir origen y destino
↓
Ejecutar A*
↓
Devolver ruta óptima
↓
Devolver distancia total
```

---

## ❌ No conoce:

```text
Pedidos
Base de datos
Node.js
Despachos
n8n
```

---

# 🔌 python.service.js

Responsabilidad:

```text
Comunicar Node.js ↔ Python
```

Ejemplo:

```javascript
calcularRuta(origen, destino)
```

Respuesta:

```json
{
  "ruta": ["Calceta", "Chone", "Portoviejo"],
  "distancia": 52
}
```

---

# 🚚 despacho.service.js

Responsabilidad:

```text
CRUD de despacho
Estados
Consultas
Persistencia del snapshot de ruta
```

---

# 🧠 logistica.service.js (orquestador manual)

Responsabilidad:

```text
Coordinar el flujo manual del despacho
```

Incluye:

```text
Validaciones
Consulta de rutas en BD
Construcción del grafo
Llamada a python.service
Cálculo final de ruta
Creación de despacho
Actualización de pedido
```

---

# 🔔 n8n.service.js

Responsabilidad:

```text
Disparar eventos de negocio
```

Eventos:

```text
despacho_creado
despacho_en_transito
despacho_entregado
despacho_cancelado
```

---

# 📡 Flujo real del sistema (MVP)

```text
Frontend operador
↓
logistica.service
↓
BD rutas (SELECT * rutas)
↓
Construcción de grafo JSON
↓
python.service (A*)
↓
Resultado ruta
↓
despacho.service
↓
n8n.service
```

---

# 📦 Almacenamiento del resultado (IMPORTANTE)

Cada despacho guarda un snapshot:

```json
{
  "ruta_json": [
    "Calceta",
    "Chone",
    "Portoviejo"
  ],
  "distancia_total": 52,
  "tiempo_estimado": 35
}
```

---

## ✔ Esto garantiza:

```text
Trazabilidad
Auditoría
Repetibilidad
Visualización en frontend
```

---

# 🧠 Relación con el Módulo 06

| Módulo | Responsabilidad                 |
| ------ | ------------------------------- |
| 06     | Ventas + preparación del pedido |
| 07     | Ejecución logística manual      |
| Python | Cálculo de rutas (A*)           |
| n8n    | Automatización externa          |

---

# 📊 Estados del sistema

## Pedido (Módulo 06)

```text
PENDIENTE
PREPARANDO
LISTO_PARA_DESPACHO
DESPACHADO
ENTREGADO
CANCELADO
```

---

## Despacho (Módulo 07)

```text
PENDIENTE
EN_TRANSITO
ENTREGADO
CANCELADO
```

---

# 🧭 Arquitectura final simplificada

```text
Pedido (06)
↓
LISTO_PARA_DESPACHO
↓
Operador logístico
↓
logistica.service
↓
BD rutas → grafo
↓
python.service (A*)
↓
despacho.service
↓
n8n.service
```

---

# 🧾 Conclusión

El módulo de despacho queda definido como:

```text
Un sistema de ejecución logística manual asistido por algoritmo de rutas (A*)
```

---

## ✔ Características finales

* No automático
* Controlado por operador
* Grafo construido desde BD en cada ejecución
* A* aislado en Python
* Snapshot de rutas en cada despacho
* Integración con n8n por eventos
* Arquitectura simple y demostrable (MVP real)

---

```

---

Si quieres, el siguiente paso lógico sería ayudarte a **dibujar el diagrama completo tipo arquitectura (nivel sistema)** o incluso dejarte esto listo como **README de repo profesional para entrega**.
```
