# 03 - Backend y reglas de negocio

## Capas

El backend esta dividido en:

- `models`: definiciones Sequelize.
- `routes`: endpoints REST y montaje de validadores HTTP.
- `controllers`: lectura de entrada HTTP, llamada unica al servicio principal y `successResponse`.
- `services`: casos de uso, reglas de negocio, normalizacion, consultas Sequelize, transacciones y orquestacion.
- `middlewares`: validacion HTTP, autenticacion, 404 y errores.
- `utils`: respuestas, token de autenticacion y errores tipados.
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

## Convencion de asociaciones Sequelize

Todas las asociaciones declaradas en `src/models/index.js` usan alias explicito con `as`. Los servicios deben incluir modelos asociados indicando el mismo alias, y los consumidores deben leer relaciones con nombres camelCase contextuales:

| Relacion | Alias publico |
| -------- | ------------- |
| Categoria -> Producto | `productos` |
| Producto -> Categoria | `categoria` |
| Ubicacion -> Cliente | `clientes` |
| Cliente -> Ubicacion | `ubicacion` |
| Ubicacion -> Ruta | `rutasOrigen`, `rutasDestino` |
| Ruta -> Ubicacion | `origen`, `destino` |
| Cliente -> Pedido | `pedidos` |
| Pedido -> Cliente | `cliente` |
| Usuario -> Pedido | `pedidos` |
| Pedido -> Usuario | `usuario` |
| Pedido -> DetallePedido | `detalles` |
| DetallePedido -> Pedido | `pedido` |
| Producto -> DetallePedido | `detallesPedido` |
| DetallePedido -> Producto | `producto` |
| Pedido -> Despacho | `despachos` |
| Despacho -> Pedido | `pedido` |
| Camion -> JornadaReparto | `jornadas` |
| JornadaReparto -> Camion | `camion` |
| JornadaReparto -> Despacho | `despachos` |
| Despacho -> JornadaReparto | `jornada` |

Las asociaciones inbound usan la misma regla: `ordenesCompra`, `proveedor`, `detalles`, `ordenCompra`, `detallesOrdenCompra`, `ingresosInventario`, `usuario`, `detalles`, `ingresoInventario`, `detallesIngreso` y `producto`, segun la cardinalidad. La pluralizacion del alias refleja colecciones en `hasMany`; los `belongsTo` usan singular.

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

Las operaciones crear, actualizar y eliminar detalle usan una transaccion administrada. Dentro de la transaccion se bloquean pedido, producto y detalle cuando corresponde, se ajusta stock y se recalcula el total. Si falla la creacion, actualizacion, eliminacion o recalculo, Sequelize revierte todos los cambios de esa operacion.

## Reglas de jornadas

La generacion de jornadas:

- Toma pedidos `LISTO_PARA_DESPACHO`.
- Busca camiones `EN_BODEGA` con capacidad positiva.
- Excluye camiones con jornadas `PLANIFICADA` o `EN_RUTA`.
- Usa la bodega central `BODEGA_CENTRAL_ID = 1`.
- Envia pedidos, camiones, bodega y rutas activas a Python.
- Persiste jornadas y despachos en una transaccion administrada.
- Cambia pedidos asignados a `DESPACHADO`.
- Despues de la respuesta de Python, vuelve a bloquear y validar pedidos, camiones, jornadas activas y despachos activos antes de persistir.
- Python se invoca antes de abrir la transaccion. n8n se invoca despues del commit.

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
- Despacho, pedido y jornada se bloquean y actualizan dentro de una misma transaccion.
- Cuando todos los despachos del punto actual quedan cerrados, la jornada avanza al siguiente `orden_entrega` pendiente si existe.

Si falla la actualizacion del pedido o de la jornada, el despacho no queda entregado ni marcado como no entregado.

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

Los controladores activos delegan errores mediante `asyncHandler`. El middleware global `errorHandler` es el unico punto que convierte errores a HTTP y conserva la forma publica:

```json
{
  "success": false,
  "message": "Mensaje publico"
}
```

Errores tipados activos:

| Clase | HTTP | Uso |
| ----- | ---: | --- |
| `ValidationError` | 400 | Entrada HTTP invalida |
| `NotFoundError` | 404 | Registro o ruta inexistente |
| `ConflictError` | 400 | Duplicados y conflictos de unicidad |
| `BusinessRuleError` | 400 | Regla de negocio incumplida |
| `UnauthorizedError` | 401 | Login, token o autenticacion |
| `ForbiddenError` | 403 | Autorizacion futura |
| `ExternalServiceError` | 502 | Python, timeout o contrato externo invalido |

Tambien se normalizan `SequelizeValidationError`, `SequelizeUniqueConstraintError` y `SequelizeForeignKeyConstraintError`. En produccion, los errores internos inesperados responden `Error interno del servidor` sin exponer stack, SQL ni detalles de conexion.

Los codigos internos (`CATEGORIA_DUPLICADA`, `PEDIDO_NO_MODIFICABLE`, `PYTHON_TIMEOUT`, entre otros) quedan en los errores operacionales para trazabilidad interna. La respuesta HTTP publica no agrega campos nuevos para mantener compatibilidad con el frontend.

## Validaciones HTTP

Las validaciones de entrada estan en `src/middlewares/requestValidators.js` y cubren:

- Campos obligatorios.
- IDs positivos.
- Strings vacios.
- Correo, cedula y telefono.
- Cantidades, precios, stock y distancia.
- Coordenadas enviadas en pares.

Las reglas que requieren base de datos o estado del dominio permanecen en servicios: duplicados, relaciones, stock, estados de pedido, camiones ocupados, orden de entrega, transacciones e integraciones.

## Transacciones existentes

Se usan transacciones administradas y bloqueos de fila en:

- Crear, actualizar y eliminar detalles de pedido.
- Generacion de jornadas.
- Inicio de jornada con locks.
- Finalizacion de jornada con locks.
- Recalculo de jornada.
- Entrega y no entrega de despachos asociados a jornadas.

## Operaciones todavia no atomicas

- Cancelar pedido y reintegrar stock.
- Avanzar jornada.

Riesgo pendiente: no existen restricciones de base de datos que impidan de forma definitiva dos jornadas activas para un mismo camion o dos despachos activos para un mismo pedido. La fase transaccional agrega bloqueos y revalidaciones de servicio, pero una restriccion parcial futura en PostgreSQL seria la proteccion mas fuerte.

## Seguridad actual

Existe autenticacion con token HMAC y bcrypt para contrasenas. El frontend usa `ProtectedRoute` y guarda sesion local. En backend, `requireAuth` se aplica a `/api/auth/me`, pero las rutas operativas no estan protegidas todavia. Esto es una limitacion importante si el MVP se expone fuera de un entorno controlado.
