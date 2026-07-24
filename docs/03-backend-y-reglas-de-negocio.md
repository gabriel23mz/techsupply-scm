# 03 - Backend y reglas de negocio

## Capas

El backend esta dividido en:

- `models`: definiciones Sequelize.
- `routes`: endpoints REST.
- `controllers`: validacion de entrada basica y respuestas HTTP.
- `services`: reglas de negocio y orquestacion.
- `middlewares`: autenticacion, 404 y errores.
- `utils`: respuestas y token de autenticacion.
- `constants`: constantes logisticas.

## Modelos principales

| Modelo | Tabla | Uso |
| ------ | ----- | --- |
| `Usuario` | `usuarios` | Usuarios administrativos y login |
| `Categoria` | `categorias` | Catalogo de productos |
| `Producto` | `productos` | Inventario, precios y stock |
| `Ubicacion` | `ubicaciones` | Nodos geograficos con coordenadas |
| `Ruta` | `rutas` | Aristas del grafo logistico |
| `Cliente` | `clientes` | Clientes y ubicacion destino |
| `Pedido` | `pedidos` | Solicitud comercial |
| `DetallePedido` | `detalle_pedido` | Productos del pedido |
| `Camion` | `camiones` | Vehiculos disponibles |
| `JornadaReparto` | `jornadas_reparto` | Entidad principal de la operacion logistica |
| `Despacho` | `despachos` | Entrega individual asociada a un pedido dentro de una jornada |

Tambien existen modelos inbound (`Proveedor`, `OrdenCompra`, `DetalleOrdenCompra`, `IngresoInventario`, `DetalleIngreso`) definidos y asociados, pero no expuestos como modulos operativos outbound.

## Estados reales

### Pedido

- `PENDIENTE`
- `PREPARANDO`
- `LISTO_PARA_DESPACHO`
- `DESPACHADO`
- `ENTREGADO`
- `CANCELADO`
- `REPROGRAMADO`

### Despacho

- `PENDIENTE`
- `EN_TRANSITO`
- `ENTREGADO`
- `NO_ENTREGADO`
- `CANCELADO`

### JornadaReparto

- `PLANIFICADA`
- `EN_RUTA`
- `FINALIZADA`
- `CANCELADA`

### Camion

- `EN_BODEGA`
- `EN_RUTA`
- `INACTIVO`

## Reglas de pedidos

- Un pedido se crea en estado `PENDIENTE`.
- Solo pedidos `PENDIENTE` pueden pasar a `PREPARANDO`.
- Solo pedidos `PREPARANDO` pueden finalizar preparacion.
- Para quedar `LISTO_PARA_DESPACHO`, el pedido debe tener al menos un detalle.
- Los pedidos `PENDIENTE`, `PREPARANDO` o `LISTO_PARA_DESPACHO` pueden cancelarse.
- Al cancelar un pedido se reintegra stock de sus detalles.
- Cuando una jornada crea despachos, el pedido pasa a `DESPACHADO`.
- Al entregar un despacho, el pedido pasa a `ENTREGADO`.
- Al marcar no entregado, el pedido pasa a `REPROGRAMADO`.

## Reglas de detalles de pedido

- Solo se pueden agregar, modificar o eliminar detalles si el pedido esta `PENDIENTE` o `PREPARANDO`.
- El producto debe existir y estar activo.
- La cantidad debe ser positiva y no superar el stock disponible.
- El stock se descuenta al crear o aumentar cantidad.
- El stock se reintegra al reducir cantidad o eliminar detalle.
- El total del pedido se recalcula a partir de los subtotales.

Limitacion conocida: las operaciones stock-detalle-total no usan transaccion propia en el servicio actual.

## Reglas de jornadas

La generacion de jornadas:

- Toma pedidos `LISTO_PARA_DESPACHO`.
- Busca camiones `EN_BODEGA` con capacidad positiva.
- Excluye camiones con jornadas `PLANIFICADA` o `EN_RUTA`.
- Usa la bodega central `BODEGA_CENTRAL_ID = 1`.
- Envia pedidos, camiones, bodega y rutas activas a Python.
- Persiste jornadas y despachos en una transaccion.
- Cambia pedidos asignados a `DESPACHADO`.

El inicio de jornada:

- Requiere jornada `PLANIFICADA`.
- Requiere camion `EN_BODEGA`.
- Requiere despachos `PENDIENTE`.
- Cambia jornada y camion a `EN_RUTA`.
- Cambia despachos a `EN_TRANSITO`.
- Define `posicion_actual_orden` con el primer orden.

El avance de jornada:

- Requiere jornada `EN_RUTA`.
- Exige que todos los despachos del punto actual esten `ENTREGADO` o `NO_ENTREGADO`.
- Mueve `posicion_actual_orden` al siguiente orden pendiente.

La finalizacion:

- Requiere jornada `EN_RUTA`.
- Requiere camion `EN_RUTA`.
- Requiere que todos los despachos esten en estado terminal.
- Cambia jornada a `FINALIZADA`.
- Libera camion a `EN_BODEGA`.
- Reprograma pedidos `NO_ENTREGADO` cuando corresponde.

## Reglas de despachos

El despacho representa una entrega individual. En el flujo actual fuerte, se crea dentro de una jornada.

Para entregar o marcar como no entregado:

- El despacho debe estar asociado a una jornada.
- La jornada debe estar `EN_RUTA`.
- El despacho debe estar `EN_TRANSITO`.
- El `orden_entrega` debe coincidir con `posicion_actual_orden`.

Limitacion conocida: `entregarDespacho` y `marcarNoEntregado` actualizan despacho y pedido sin transaccion.

## Servicios principales

| Servicio | Responsabilidad |
| -------- | --------------- |
| `pedido.service.js` | Ciclo comercial del pedido |
| `detallePedido.service.js` | Detalles, stock y total |
| `jornadaReparto.service.js` | Generacion, inicio, avance, recalculo, finalizacion y mapas de jornadas |
| `despacho.service.js` | Consulta, enriquecimiento y operacion de despachos |
| `logistica.service.js` | Adaptador de planificacion y notificaciones; conserva flujo heredado de despacho individual |
| `python.service.js` | Cliente HTTP hacia FastAPI |
| `n8n.service.js` | Stub de eventos logisticos |

## Rutas principales

| Prefijo | Modulo |
| ------- | ------ |
| `/api/auth` | Login y sesion |
| `/api/ubicaciones` | Ubicaciones |
| `/api/clientes` | Clientes |
| `/api/rutas` | Rutas |
| `/api/usuarios` | Usuarios |
| `/api/categorias` | Categorias |
| `/api/productos` | Productos |
| `/api/pedidos` | Pedidos |
| `/api/detalles-pedido` | Detalles de pedido |
| `/api/despachos` | Despachos |
| `/api/jornadas-reparto` | Jornadas |
| `/api/camiones` | Camiones |

## Manejo de errores

Los controladores usan `successResponse` y `errorResponse`. El middleware global devuelve `success: false` y el mensaje del error. Esto es util en desarrollo, pero puede exponer detalles internos si se publica sin ajustes.

## Transacciones existentes

Se usan transacciones en operaciones centrales de jornadas:

- Generacion de jornadas.
- Inicio de jornada con locks.
- Finalizacion de jornada con locks.
- Recalculo de jornada.

## Operaciones todavia no atomicas

- Crear detalle, descontar stock y recalcular total.
- Actualizar detalle, ajustar stock y recalcular total.
- Eliminar detalle, reintegrar stock y recalcular total.
- Cancelar pedido y reintegrar stock.
- Entregar despacho y actualizar pedido.
- Marcar no entregado y actualizar pedido.
- Avanzar jornada.

## Seguridad actual

Existe autenticacion con token HMAC y bcrypt para contrasenas. El frontend usa `ProtectedRoute` y guarda sesion local. En backend, `requireAuth` se aplica a `/api/auth/me`, pero las rutas operativas no estan protegidas todavia. Esto es una limitacion importante si el MVP se expone fuera de un entorno controlado.

