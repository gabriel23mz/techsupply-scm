# 07. Contrato de Arquitectura Interna de los Servicios

## 1. Objetivo

Este documento define el contrato de arquitectura interna del módulo de logística del proyecto **TechSupply Outbound**.

Su propósito es establecer una separación clara de responsabilidades entre los servicios del backend antes de implementar la integración con el algoritmo A* desarrollado en Python y las futuras automatizaciones mediante n8n.

Este contrato debe considerarse **inmutable** durante el desarrollo del MVP, ya que servirá como referencia para la implementación de todos los servicios relacionados con la logística y el despacho de pedidos.

---

# 2. Principios de Diseño

La arquitectura del sistema se basa en el principio de **Responsabilidad Única (Single Responsibility Principle - SRP)**.

Cada servicio deberá responder únicamente a una responsabilidad específica dentro del flujo logístico.

Ningún servicio deberá asumir responsabilidades pertenecientes a otro módulo.

Esta separación permitirá mantener un sistema desacoplado, escalable y fácilmente mantenible.

---

# 3. Arquitectura General

La arquitectura del flujo logístico queda definida de la siguiente manera.

```text
POST /despachos
        │
        ▼
Controller
        │
        ▼
logistica.service.js
        │
        ├───────────────┐
        ▼               ▼
python.service.js   despacho.service.js
        │               │
        └───────┬───────┘
                ▼
          n8n.service.js
                │
                ▼
            Response
```

El controlador únicamente delegará la solicitud.

Toda la lógica del negocio será responsabilidad de `logistica.service.js`.

---

# 4. Responsabilidades de cada Servicio

## 4.1 despacho.service.js

### Responsabilidad

Gestionar exclusivamente la persistencia de la entidad **Despacho**.

Este servicio no debe contener reglas de negocio relacionadas con la logística ni conocer detalles sobre el cálculo de rutas.

### No debe conocer

- Algoritmo A*
- Construcción del grafo
- Integración con Python
- Integración con n8n
- Reglas de negocio del proceso logístico

### Operaciones permitidas

```text
crear(datos)

obtenerTodos()

obtenerPorId()

iniciar(id)

entregar(id)

cancelar(id)

existeDespachoActivo(pedidoId)
```

Este servicio únicamente interactúa con la base de datos.

---

## 4.2 logistica.service.js

### Responsabilidad

Implementar toda la lógica de negocio correspondiente al proceso logístico.

Este servicio actuará como orquestador entre los diferentes servicios especializados.

Toda decisión relacionada con el flujo del despacho deberá implementarse aquí.

---

### Flujo de creación del despacho

La función principal será:

```javascript
crearDespacho(pedidoId)
```

Su flujo será el siguiente:

```text
Buscar pedido

↓

Validar estado LISTO_PARA_DESPACHO

↓

Validar existencia de detalles

↓

Verificar que no exista un despacho activo

↓

Obtener cliente

↓

Obtener ubicación destino

↓

Obtener todas las rutas registradas

↓

python.service.calcularRuta()

↓

despacho.service.crear()

↓

Actualizar pedido → DESPACHADO

↓

n8n.service.despachoCreado()

↓

Retornar despacho
```

---

### Flujo de inicio del despacho

```javascript
iniciarDespacho(id)
```

```text
Validar despacho

↓

despacho.service.iniciar()

↓

n8n.service.despachoIniciado()
```

---

### Flujo de entrega

```javascript
entregarDespacho(id)
```

```text
despacho.service.entregar()

↓

Actualizar pedido → ENTREGADO

↓

n8n.service.despachoEntregado()
```

---

### Flujo de cancelación

```javascript
cancelarDespacho(id)
```

```text
despacho.service.cancelar()

↓

Actualizar pedido → LISTO_PARA_DESPACHO

↓

n8n.service.despachoCancelado()
```

---

# 5. python.service.js

## Responsabilidad

Calcular la mejor ruta entre dos ubicaciones utilizando el algoritmo A*.

Este servicio no debe conocer información relacionada con:

- Pedidos
- Clientes
- Despachos
- Sequelize
- Express
- Base de datos

Su única responsabilidad será ejecutar el algoritmo y devolver el resultado.

---

## Contrato de Entrada

La función principal será:

```javascript
calcularRuta({
    origenId,
    destinoId,
    rutas,
})
```

### Parámetros

**origenId**

Identificador de la ubicación de origen.

---

**destinoId**

Identificador de la ubicación destino.

---

**rutas**

Colección completa de conexiones obtenidas desde la tabla **Ruta**.

Formato esperado:

```json
[
    {
        "origen": 1,
        "destino": 2,
        "distancia": 14
    },
    {
        "origen": 2,
        "destino": 5,
        "distancia": 8
    }
]
```

Este conjunto de datos permitirá que Python construya el grafo completamente en memoria sin depender de la base de datos.

---

## Construcción del Grafo

Se adopta la siguiente estrategia arquitectónica.

1. Node.js obtiene todas las rutas desde la base de datos.

2. Node.js transforma las rutas a un formato JSON simple.

3. Node.js envía el conjunto de conexiones a Python.

4. Python construye el grafo en memoria.

5. Python ejecuta el algoritmo A*.

6. Python devuelve únicamente el resultado del cálculo.

Esta estrategia desacopla completamente el algoritmo de la capa de persistencia.

---

## Contrato de Salida

El servicio deberá devolver siempre el siguiente formato:

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

### Descripción

**ruta**

Secuencia ordenada de identificadores de las ubicaciones que conforman la ruta óptima.

---

**distancia_total**

Distancia acumulada del recorrido.

---

**tiempo_estimado**

Tiempo estimado de recorrido expresado en minutos.

---

# 6. Persistencia de la Ruta

El modelo **Despacho** almacenará la información devuelta por Python utilizando los siguientes campos.

```javascript
ruta_json

distancia_total

tiempo_estimado
```

La ruta será almacenada mediante:

```javascript
JSON.stringify(resultado.ruta)
```

Al recuperar la información se utilizará:

```javascript
JSON.parse(despacho.ruta_json)
```

La columna `ruta_json` se almacena como tipo `TEXT`, permitiendo guardar la representación serializada del recorrido.

---

# 7. n8n.service.js

## Responsabilidad

Gestionar las futuras automatizaciones del sistema mediante eventos.

Actualmente este servicio actuará únicamente como punto de extensión de la arquitectura.

No contendrá lógica de negocio.

---

## Eventos definidos

```javascript
despachoCreado(despacho)

despachoIniciado(despacho)

despachoEntregado(despacho)

despachoCancelado(despacho)
```

Durante el desarrollo del MVP estas funciones podrán permanecer como implementaciones vacías (`TODO`).

Cuando se integre n8n, cada evento enviará la información correspondiente mediante Webhooks sin modificar el resto de la arquitectura.

---

# 8. Decisiones Arquitectónicas

Se establecen las siguientes decisiones como parte del contrato del sistema.

- Node.js es responsable de obtener la información desde la base de datos.

- Python es responsable exclusivamente del cálculo de la ruta óptima.

- Python no tendrá acceso directo a MySQL ni a Sequelize.

- Node.js no implementará ninguna lógica del algoritmo A*.

- El cálculo del grafo será responsabilidad exclusiva de Python.

- La comunicación entre Node.js y Python se realizará mediante estructuras JSON.

- Todos los servicios deberán respetar el principio de responsabilidad única.

- `logistica.service.js` será el único servicio autorizado para orquestar el flujo completo del proceso logístico.

---

# 9. Consideraciones Finales

El presente documento establece el contrato definitivo de interacción entre los servicios internos del módulo de logística.

Cualquier modificación futura deberá preservar la separación de responsabilidades aquí definida.

La implementación del algoritmo A*, la integración con Python y las futuras automatizaciones mediante n8n deberán desarrollarse respetando este contrato, evitando el acoplamiento entre capas y garantizando la mantenibilidad del sistema.


```javascript
POST /despachos
        │
        ▼
despacho.controller.js
        │
        ▼
logistica.service.js
        │
        ├──────────────┬───────────────┬───────────────┐
        ▼              ▼               ▼               ▼
pedido.service   ruta.service   python.service   despacho.service
                                                │
                                                ▼
                                         Base de datos
        │
        ▼
n8n.service.js

```


```javascript
Controller
      │
      ▼
logistica.service.js
      │
      ├──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼
pedido.service   ruta.service   despacho.service   python.service
                                                     │
                                                     ▼
                                                  Python
      │
      ▼
n8n.service.js
      │
      ▼
 Webhooks

 ```


