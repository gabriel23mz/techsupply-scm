# 06. Lógica de Negocio — Pedidos y DetallePedido (Versión Definitiva v2)

---

# Objetivo

Definir y consolidar la arquitectura funcional y las reglas de negocio del módulo comercial antes de iniciar el proceso logístico.

Este documento establece las reglas definitivas para:

* Pedido
* DetallePedido
* Inventario
* Estados de negocio
* Cálculo automático de totales
* Flujo comercial previo a logística

La finalidad es garantizar que los módulos posteriores:

```text
Despacho
↓
Rutas
↓
Algoritmo A*
↓
n8n
```

trabajen sobre información consistente y separando claramente las responsabilidades entre el área comercial y el área logística.

---

# Filosofía de la Arquitectura

El sistema queda dividido en dominios independientes.

```text
VENTAS

├── Pedido
├── DetallePedido
└── Inventario

↓

LOGÍSTICA

├── Despacho
├── Ruta
└── Algoritmo A*

↓

AUTOMATIZACIÓN

├── n8n
├── WhatsApp
├── Email
└── Tracking
```

Cada dominio controla únicamente su propio proceso.

El módulo comercial nunca administra rutas ni entregas.

El módulo logístico nunca modifica productos, cantidades ni precios del pedido.

---

# Modelo de Negocio

## Pedido

Representa la cabecera de una venta.

Ejemplo:

```text
Pedido #15

Cliente: Carlos Pérez
Vendedor: Juan López
Fecha: 20/06/2026

Estado: PENDIENTE
Total: 1200
```

El pedido almacena únicamente la información general de la venta.

Los productos vendidos pertenecen a los registros asociados de **DetallePedido**.

---

## DetallePedido

Representa cada línea de productos perteneciente a un pedido.

Ejemplo:

```text
Pedido #15

Laptop Lenovo      2    500
Mouse Logitech     1     50
Teclado Mecánico   1    150
```

Cada detalle contiene:

```text
producto
cantidad
precio_unitario
subtotal
```

Cada detalle representa un snapshot del producto al momento de la venta.

---

# Totales Automáticos

## Subtotal

Cada detalle calcula automáticamente:

```text
subtotal = cantidad × precio_unitario
```

---

## Total del Pedido

El total del pedido se calcula automáticamente mediante:

```text
total = SUM(subtotales)
```

de todos los detalles asociados.

Por esta razón:

```text
DetallePedido.subtotal
```

y

```text
Pedido.total
```

no son campos redundantes.

---

# Regla Fundamental

El frontend nunca enviará:

```json
{
  "total": 1200
}
```

El backend será el único responsable de calcular:

* subtotales
* total del pedido
* validaciones monetarias

---

# Flujo de Creación de Pedido

## Crear Pedido

Solicitud:

```json
{
  "cliente_id": 1,
  "usuario_id": 1
}
```

Resultado:

```text
Estado = PENDIENTE
Total = 0
```

En este momento el pedido únicamente representa una venta abierta.

---

## Agregar Detalles

Solicitud:

```json
{
  "pedido_id": 1,
  "producto_id": 2,
  "cantidad": 3
}
```

Proceso:

```text
Buscar producto
↓
Obtener precio_venta actual
↓
precio_unitario = precio_venta
↓
subtotal = cantidad × precio_unitario
↓
Guardar detalle
↓
Recalcular total del pedido
```

---

# Snapshot de Precio

Al crear un detalle se almacena el precio vigente del producto.

```text
precio_unitario = producto.precio_venta
```

Esto evita que modificaciones futuras del precio afecten pedidos históricos.

Cada detalle conserva exactamente el precio utilizado durante la venta.

---

# Gestión de Inventario

## Crear Detalle

```text
Crear detalle
↓
Descontar stock
↓
Recalcular total
```

---

## Actualizar Detalle

```text
Modificar cantidad
↓
Calcular diferencia
↓
Ajustar stock
↓
Recalcular subtotal
↓
Recalcular total
```

---

## Eliminar Detalle

```text
Eliminar detalle
↓
Devolver stock
↓
Recalcular total
```

---

# Estados del Pedido

Estados válidos:

```text
PENDIENTE
PREPARANDO
LISTO_PARA_DESPACHO
DESPACHADO
ENTREGADO
CANCELADO
```

Cada estado representa una etapa específica del ciclo de vida comercial.

---

# Interpretación de Estados

## PENDIENTE

El pedido acaba de ser creado.

En este estado se permite:

```text
Agregar detalles
Modificar detalles
Eliminar detalles
Cancelar pedido
```

---

## PREPARANDO

El área comercial cerró la venta y el pedido pasó a preparación en bodega.

Durante este estado todavía es posible realizar ajustes en caso de ser necesarios.

Se permite:

```text
Agregar detalles
Modificar detalles
Eliminar detalles
Cancelar pedido
```

---

## LISTO_PARA_DESPACHO

La bodega confirmó que el pedido está completamente preparado.

El pedido queda liberado para ser atendido por el área logística.

A partir de este momento el pedido queda completamente bloqueado para modificaciones.

No se permite:

```text
Agregar detalles
Modificar detalles
Eliminar detalles
Modificar cantidades
Modificar productos
```


Ademas, no se permite modificar:

```
• Cliente
• Usuario responsable
• Fecha del pedido
• Productos
• Cantidades
• Precios
```

Este estado representa la frontera entre el dominio Comercial y el dominio Logístico.


Mini flujo definido:

```text
PENDIENTE
        │
        ▼
PREPARANDO
        │
        ▼
LISTO_PARA_DESPACHO
        │
        ├── Cancelar Pedido ✔
        │
        └── Generar Despacho
                │
                ▼
        DESPACHADO
```

Mientras no exista un despacho, el pedido sigue siendo completamente un asunto comercial.


> **LISTO_PARA_DESPACHO**
>
> El pedido ha sido completamente preparado y validado por bodega.
>
> Se encuentra disponible para ser tomado por el módulo de Logística, pero aún no existe un despacho asociado.
>
> Mientras permanezca en este estado:
>
> * No pueden modificarse los detalles del pedido.
> * Sí puede cancelarse la venta.
> * Puede generarse un nuevo despacho.
> * Solo podrá existir un despacho activo por pedido.



---


| Estado              | Editar detalles | Cancelar | Generar despacho | Responsable                     |
| ------------------- | --------------- | -------- | ---------------- | ------------------------------- |
| PENDIENTE           | ✅               | ✅        | ❌                | Comercial                       |
| PREPARANDO          | ✅               | ✅        | ❌                | Comercial                       |
| LISTO_PARA_DESPACHO | ❌               | ✅        | ✅                | Comercial (esperando logística) |
| DESPACHADO          | ❌               | ❌        | ❌                | Logística                       |
| ENTREGADO           | ❌               | ❌        | ❌                | Logística                       |
| CANCELADO           | ❌               | ❌        | ❌                | Comercial                       |

---


`LISTO_PARA_DESPACHO` se convierte en un **estado de transición entre Ventas y Logística**: el contenido del pedido ya está congelado, pero la decisión comercial aún puede cambiar antes de que exista un despacho. Una vez que el despacho se crea y el pedido pasa a `DESPACHADO`, la responsabilidad deja de ser de Ventas y pasa completamente al proceso logístico. Esa separación hace que las reglas del dominio sean consistentes y fáciles de entender.


---

## DESPACHADO

El pedido ya fue tomado por logística y posee un despacho asociado.

Toda la responsabilidad pasa al módulo de Despachos.

---

## ENTREGADO

El proceso comercial y logístico finalizó exitosamente.

---

## CANCELADO

El pedido fue anulado antes de ingresar al proceso logístico.

La cancelación devuelve el inventario pero conserva el historial completo.

---

# Flujo Oficial del Pedido

```text
PENDIENTE
│
├── Agregar detalles
├── Modificar detalles
├── Eliminar detalles
├── Preparar
├── Cancelar
│
▼

PREPARANDO
│
├── Agregar detalles
├── Modificar detalles
├── Eliminar detalles
├── Finalizar preparación
├── Cancelar
│
▼

LISTO_PARA_DESPACHO
│
├── Esperar asignación logística
├── Cancelar
│
▼

DESPACHADO
│
▼

ENTREGADO
```

---

# Restricción de Estados

No se permite modificar el estado mediante:

```http
PUT /api/pedidos/:id
```

Si se intenta enviar:

```json
{
  "estado": "DESPACHADO"
}
```

o cualquier otro estado manualmente, la solicitud deberá rechazarse.

Respuesta:

```text
Utilice los endpoints de flujo para modificar los estados del pedido.
```

---

# Endpoint de Preparación

## Preparar Pedido

```http
PATCH /api/pedidos/:id/preparar
```

Transición permitida:

```text
PENDIENTE
↓
PREPARANDO
```

Este endpoint indica que el pedido entra oficialmente en proceso de preparación por parte de bodega.

Todavía puede modificarse el contenido del pedido.

---

# Endpoint de Finalización de Preparación

## Finalizar Preparación

```http
PATCH /api/pedidos/:id/finalizar-preparacion
```

o

```
PATCH /api/pedidos/:id/listo-para-despacho
```

Transición permitida:

```text
PREPARANDO
↓
LISTO_PARA_DESPACHO
```

Validaciones:

```text
El pedido existe

El pedido está en PREPARANDO

Posee al menos un DetallePedido

No está cancelado
```

Acción:

```text
Cambiar estado

↓

LISTO_PARA_DESPACHO
```

A partir de este momento el pedido deja de pertenecer al proceso comercial y queda disponible para el módulo de Despachos.

---

# Endpoint de Cancelación

## Cancelar Pedido

```http
PATCH /api/pedidos/:id/cancelar
```

Estados permitidos:

```text
PENDIENTE
PREPARANDO
LISTO_PARA_DESPACHO
```

Estados no permitidos:

```text
DESPACHADO
ENTREGADO
CANCELADO
```

Proceso:

```text
Buscar detalles
↓
Recorrer productos
↓
Devolver stock
↓
Cambiar estado a CANCELADO
```

---

## Ejemplo de Cancelación

Pedido:

```text
Laptop x2
Mouse x3
```

Stock actual:

```text
Laptop = 7
Mouse = 18
```

Cancelar pedido:

```text
Laptop = 9
Mouse = 21
```

Pedido:

```text
Estado = CANCELADO
```

---

# Conservación de Historial

Al cancelar un pedido:

* NO se eliminan los detalles.
* NO se modifican las cantidades.
* NO se modifican los subtotales.
* NO se modifica el total.

Los registros permanecen para:

```text
Auditoría
Reportes
Historial
Trazabilidad
```

Ejemplo:

```text
Pedido #15

Laptop x2
Mouse x3

Estado = CANCELADO
```

---

# Restricciones sobre DetallePedido

Los detalles del pedido únicamente podrán administrarse mientras el pedido se encuentre en alguno de los siguientes estados:

```text
PENDIENTE

PREPARANDO
```

Durante estos estados se permite:

```text
Agregar detalles

Modificar detalles

Eliminar detalles

Modificar cantidades
```

Cuando el pedido cambia a:

```text
LISTO_PARA_DESPACHO
```

queda completamente bloqueado.

No se permite:

```text
Agregar detalles

Modificar detalles

Eliminar detalles

Modificar cantidades
```

Esta restricción garantiza que el contenido del pedido no cambie una vez que ha sido validado por bodega y liberado para logística.

---

# Relaciones Incluidas en Consultas

Las consultas de pedidos deberán incluir como mínimo:

```text
Cliente

Usuario
```

Ejemplo:

```json
{
  "id": 1,
  "cliente": {
    "id": 2,
    "nombre": "Carlos Perez"
  },
  "usuario": {
    "id": 1,
    "nombre": "Juan"
  },
  "fecha": "2026-06-20",
  "estado": "PREPARANDO",
  "total": 1200
}
```

Esto simplifica el consumo desde el frontend.

---

# Relación con el Módulo de Despachos

El módulo comercial no administra los despachos.

Su única responsabilidad consiste en dejar los pedidos preparados para ser atendidos por logística.

La relación entre ambas entidades queda definida como:

```text
Pedido 1 ─── N Despachos
```

```javascript
Pedido.hasMany(Despacho)

Despacho.belongsTo(Pedido)
```

---

## Regla de Negocio

Un pedido puede tener múltiples despachos registrados a lo largo de su ciclo de vida.

Ejemplo:

```text
Pedido #15

Despacho #1 → CANCELADO

Despacho #2 → CANCELADO

Despacho #3 → ENTREGADO
```

Solo un despacho podrá finalizar exitosamente con estado:

```text
ENTREGADO
```

Los despachos cancelados representan intentos logísticos fallidos y no afectan la validez comercial del pedido.

---

# Integración con el Módulo de Despachos

Una vez finalizado el proceso comercial, el pedido queda disponible para el área logística.

Flujo:

```text
Pedido
↓

DetallePedido
↓

Inventario
↓

Preparación

↓

LISTO_PARA_DESPACHO
```

A partir de este punto el pedido deja de modificarse y pasa a estar disponible para el módulo de Despachos.

---

# Flujo del Área de Logística (MVP)

El módulo de Despachos consultará automáticamente todos los pedidos cuyo estado sea:

```text
LISTO_PARA_DESPACHO
```

Ejemplo:

```text
GET /despachos/pedidos-disponibles
```

El operador logístico visualizará la lista de pedidos pendientes de despacho.

Ejemplo:

```text
Pedido #12

Pedido #15

Pedido #21
```

---

## Generación del Despacho

Cuando el operador selecciona un pedido y presiona:

```text
Generar despacho
```

el backend ejecuta el siguiente proceso:

```text
Buscar pedido
↓

Buscar cliente
↓

Obtener ubicación del cliente
↓

Resolver ruta óptima

↓

Asignar ruta

↓

Mostrar información calculada

↓

Confirmación del operador

↓

Crear despacho

↓

Actualizar pedido
```

---

## Confirmación del Operador

Antes de crear el despacho, el sistema mostrará un resumen con la información calculada.

Ejemplo:

```text
Pedido: #15

Origen:
Calceta (Bodega Central)

Destino:
Cliente

Ruta propuesta:
Ruta 3

Distancia:
18 km

Tiempo estimado:
35 minutos
```

El operador podrá:

```text
Confirmar
```

o

```text
Cancelar
```

Solo al confirmar se creará el despacho.

---

## Resultado de la Confirmación

Si el operador confirma:

```text
Crear Despacho

Estado = PENDIENTE
```

y automáticamente:

```text
Pedido

LISTO_PARA_DESPACHO

↓

DESPACHADO
```

Desde este momento el pedido deja completamente de pertenecer al módulo comercial.

Toda la responsabilidad pasa al módulo de Despachos.

---

# Integración Futura con Algoritmo A*

La API pública no dependerá del algoritmo utilizado para calcular rutas.

Inicialmente el sistema podrá utilizar una asignación simple.

Posteriormente podrá reemplazarse por A* sin modificar el frontend.

El flujo quedará definido así:

```text
Pedido

↓

Cliente

↓

Ubicación

↓

Construcción del grafo

↓

Algoritmo A*

↓

Ruta óptima

↓

Despacho
```

La única responsabilidad del frontend será solicitar la generación del despacho.

Toda la lógica de cálculo permanecerá en el backend.

---

# Integración Futura con n8n

El sistema quedará preparado para emitir eventos de negocio.

Eventos previstos:

```text
pedido_preparado
```

```text
pedido_listo_para_despacho
```

```text
despacho_creado
```

```text
despacho_en_transito
```

```text
despacho_entregado
```

```text
despacho_cancelado
```

Estos eventos permitirán automatizar procesos como:

* Confirmaciones al cliente.
* Notificaciones por WhatsApp.
* Correos electrónicos.
* Seguimiento del despacho.
* Encuestas de postventa.

Sin modificar la API principal.

---

# Estado Actual del Módulo Comercial

Implementado:

```text
✓ CRUD Pedido

✓ CRUD DetallePedido

✓ Snapshot de precio

✓ Cálculo automático de subtotal

✓ Cálculo automático de total

✓ Descuento automático de stock

✓ Devolución de stock

✓ PATCH preparar

✓ PATCH finalizar-preparacion

✓ Restricción de edición por estado

✓ Estado LISTO_PARA_DESPACHO

✓ Conservación de historial

✓ Integración de Cliente y Usuario

✓ Preparación para múltiples despachos

✓ Integración con el módulo logístico
```

---

# Estado Final de la Arquitectura Comercial

El módulo comercial finaliza la preparación del pedido cuando este alcanza el estado **LISTO_PARA_DESPACHO**. A partir de ese momento, el pedido queda disponible para ser asumido por el módulo de Logística. La responsabilidad definitiva se transfiere cuando se genera el despacho y el pedido cambia a **DESPACHADO**.


A partir de ese momento:

* El pedido deja de ser editable.
* El inventario ya fue ajustado.
* Los importes permanecen inalterables.
* La información queda lista para logística.

El módulo de Despachos será el encargado de:

```text
Consultar pedidos listos

↓

Calcular ruta

↓

Crear despacho

↓

Gestionar la entrega

↓

Actualizar el estado final del pedido
```

---

# Conclusión

El módulo comercial queda definido como el responsable exclusivo del ciclo de vida de la venta, garantizando la consistencia de precios, inventario y estados antes de transferir el pedido al dominio logístico.

Con la incorporación del estado **LISTO_PARA_DESPACHO**, el sistema establece una separación clara entre las responsabilidades de Ventas y Logística, evitando modificaciones posteriores al contenido del pedido y permitiendo que el proceso de despacho evolucione de forma independiente.

Esta arquitectura deja preparado el sistema para incorporar el cálculo de rutas mediante A*, la automatización con n8n y futuras mejoras del proceso logístico sin afectar la lógica del módulo comercial.

