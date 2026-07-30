# 03 - Backend y reglas de negocio

## Capas

El backend esta dividido en:

- `models`: definiciones Sequelize.
- `routes`: endpoints REST y montaje de validadores HTTP.
- `controllers`: lectura de entrada HTTP, llamada unica al servicio principal y `successResponse`.
- `services`: casos de uso, reglas de negocio, normalizacion, consultas Sequelize, transacciones y orquestacion.
- `middlewares`: validacion HTTP, autenticacion, 404 y errores.
- `utils`: respuestas, token de autenticacion y errores tipados.
- `constants`: constantes logisticas y matriz central de permisos.

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
| `Chofer` | `choferes` | Perfil operativo vinculado a un usuario `CHOFER` |
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
| Usuario -> Chofer | `chofer` |
| Chofer -> Usuario | `usuario` |
| Chofer -> JornadaReparto | `jornadas` |
| JornadaReparto -> Chofer | `chofer` |
| Pedido -> Usuario creador | `creadoPor` |
| Pedido -> Usuario que envio a preparacion | `enviadoPreparacionPor` |
| Pedido -> Usuario que finalizo preparacion | `preparacionFinalizadaPor` |
| DetallePedido -> Usuario preparador | `preparadoPor` |
| Despacho -> Usuario cargador | `cargadoPor` |
| JornadaReparto -> Usuario que confirmo carga | `cargaConfirmadaPor` |

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
- Ventas solo puede operar pedidos propios.
- Ventas solo puede editar o cancelar pedidos `PENDIENTE`.
- `ADMIN` puede cancelar excepcionalmente si el pedido no esta despachado, entregado ni vinculado a un despacho activo.
- Al cancelar un pedido se reintegra stock de sus detalles.
- Cuando una jornada crea despachos, el pedido permanece `LISTO_PARA_DESPACHO`.
- Al iniciar la jornada con chofer y carga confirmada, el pedido pasa a `DESPACHADO`.
- Al entregar un despacho, el pedido pasa a `ENTREGADO`.
- Al marcar no entregado, el pedido pasa a `REPROGRAMADO`.

## Reglas de detalles de pedido

- Solo se pueden agregar, modificar o eliminar detalles comerciales si el pedido esta `PENDIENTE`.
- El producto debe existir y estar activo.
- La cantidad debe ser positiva y no superar el stock disponible.
- El stock se descuenta al crear o aumentar cantidad.
- El stock se reintegra al reducir cantidad o eliminar detalle.
- El total del pedido se recalcula a partir de los subtotales.

Las operaciones crear, actualizar y eliminar detalle usan una transaccion administrada. Dentro de la transaccion se bloquean pedido, producto y detalle cuando corresponde, se ajusta stock y se recalcula el total. Si falla la creacion, actualizacion, eliminacion o recalculo, Sequelize revierte todos los cambios de esa operacion.

## Reglas de jornadas

La generacion de jornadas:

- Toma pedidos `LISTO_PARA_DESPACHO`.
- Excluye pedidos con despacho activo.
- Usa la fecha operativa actual calculada con `APP_TIMEZONE`.
- Rechaza fechas pasadas o futuras con `GENERACION_FUERA_DE_FECHA_OPERATIVA`.
- Busca camiones `EN_BODEGA` con capacidad positiva.
- Excluye camiones con jornada `PLANIFICADA` o `EN_RUTA` en la fecha operativa y cualquier camion con jornada `EN_RUTA` global.
- Busca choferes activos, con usuario `CHOFER`, usuario activo y licencia vigente.
- Excluye choferes con jornada `PLANIFICADA` o `EN_RUTA` en la fecha operativa y cualquier chofer con jornada `EN_RUTA` global.
- Limita los camiones enviados a Python a la cantidad de choferes disponibles.
- Asigna un chofer deterministico por jornada creada.
- Usa la bodega central `BODEGA_CENTRAL_ID = 1`.
- Envia pedidos, camiones, bodega y rutas activas a Python.
- Persiste jornadas y despachos en una transaccion administrada.
- No cambia pedidos asignados a `DESPACHADO` durante la planificacion.
- Despues de la respuesta de Python, vuelve a bloquear y validar pedidos, camiones, choferes, jornadas activas de la misma fecha, jornadas `EN_RUTA` globales y despachos activos antes de persistir.
- Python se invoca antes de abrir la transaccion. n8n se invoca despues del commit.
- Registra `inicio_estimado_en`, `retorno_estimado_en` y `fecha_estimada_entrega` por despacho cuando los tiempos acumulados de Python lo permiten.

El inicio de jornada:

- Requiere jornada `PLANIFICADA`.
- Requiere camion `EN_BODEGA`.
- Requiere chofer asignado, activo, usuario con rol `CHOFER` y licencia vigente.
- Requiere carga confirmada por Bodega y todos los despachos cargados.
- Solo puede iniciarla el chofer asignado o `ADMIN`.
- Requiere despachos `PENDIENTE`.
- Cambia jornada y camion a `EN_RUTA`.
- Registra `fecha_salida` como inicio real con un unico timestamp.
- Reestima retorno y entregas pendientes desde el inicio real sin cambiar fechas reales.
- Cambia despachos a `EN_TRANSITO`.
- Cambia pedidos asociados a `DESPACHADO`.
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
- Registra `fecha_finalizacion` como retorno real y conserva `retorno_estimado_en`.
- Reprograma pedidos `NO_ENTREGADO` cuando corresponde.

## Reglas de despachos

El despacho representa una entrega individual. En el flujo actual fuerte, se crea dentro de una jornada.

Para entregar o marcar como no entregado:

- El despacho debe estar asociado a una jornada.
- La jornada debe estar `EN_RUTA`.
- El usuario debe ser el chofer asignado o `ADMIN`.
- El despacho debe estar `EN_TRANSITO`.
- El `orden_entrega` debe coincidir con `posicion_actual_orden`.
- Despacho, pedido y jornada se bloquean y actualizan dentro de una misma transaccion.
- Cuando todos los despachos del punto actual quedan cerrados, la jornada avanza al siguiente `orden_entrega` pendiente si existe.
- Al entregar, `Despacho.fecha_entrega` y `Pedido.fecha_entrega` reciben el mismo instante real.
- Al marcar no entregado, no se asigna fecha real de entrega y se conserva la estimacion historica del intento.

Si falla la actualizacion del pedido o de la jornada, el despacho no queda entregado ni marcado como no entregado.

## Servicios principales

| Servicio | Responsabilidad |
| -------- | --------------- |
| `pedido.service.js` | Ciclo comercial del pedido |
| `detallePedido.service.js` | Detalles, stock y total |
| `bodega.service.js` | Preparacion por detalle, carga de despachos y confirmacion de carga |
| `chofer.service.js` | CRUD de choferes, disponibilidad y jornadas propias |
| `jornadaReparto.service.js` | Generacion, inicio, avance, recalculo, finalizacion y mapas de jornadas |
| `despacho.service.js` | Consulta, enriquecimiento y operacion de despachos |
| `logistica.service.js` | Adaptador tecnico de planificacion: payload Python y notificaciones post-commit |
| `python.service.js` | Cliente HTTP hacia FastAPI |
| `n8n.service.js` | Cliente HTTP de eventos logisticos hacia el Webhook publicado de n8n |

## Notificaciones post-commit

Los servicios de jornadas y despachos invocan n8n unicamente despues de confirmar la transaccion. `n8n.service.js` transforma los modelos en objetos planos y envia un contrato comun al Webhook configurado por `N8N_WEBHOOK_URL`.

La generacion llama una vez por cada jornada persistida; el cliente n8n agrupa esa rafaga durante una ventana corta para emitir un solo resumen administrativo de planificacion. Inicio, entrega, no entrega y finalizacion se notifican de forma inmediata.

La integracion tiene timeout configurable y puede deshabilitarse mediante `N8N_ENABLED=false`. Los errores se propagan al adaptador que los registra, pero no revierten pedidos, despachos ni jornadas porque el dominio ya fue confirmado.

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
| `/api/bodega` | Preparacion y carga |
| `/api/choferes` | Choferes |

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
| `ForbiddenError` | 403 | Acceso denegado por permiso o propiedad |
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

## Operaciones todavia no atomicas o con riesgo residual

- Avanzar jornada.
- Restricciones parciales de base para jornadas/despachos activos.

## Integridad PostgreSQL

La fase de cierre agrega una migracion no ejecutada con indices unicos parciales para reforzar invariantes que ya validan los servicios:

- Un despacho activo por pedido: `despachos_pedido_activo_unique` para estados `PENDIENTE` y `EN_TRANSITO`.
- Una jornada activa por camion y fecha: `jornadas_reparto_camion_activo_unique` para `PLANIFICADA` y `EN_RUTA`.
- Una jornada activa por chofer y fecha: `jornadas_reparto_chofer_activo_unique` para `PLANIFICADA` y `EN_RUTA`.
- Un camion globalmente en ruta: `jornadas_reparto_camion_en_ruta_unique` para `EN_RUTA`.
- Un chofer globalmente en ruta: `jornadas_reparto_chofer_en_ruta_unique` para `EN_RUTA`.
- Orden unico dentro de jornada: `despachos_jornada_orden_unique`.
- Pedido unico dentro de jornada: `despachos_jornada_pedido_unique`.

La unicidad de camion y chofer se evalua por `fecha` para jornadas activas del dia. Ademas, una jornada `EN_RUTA` bloquea fisicamente el recurso sin importar la fecha, porque cambiar de dia no libera camion ni chofer.

Las restricciones e indices fueron verificados en la base demo local. Antes de aplicarlos a una base remota deben revisarse los diagnosticos y realizarse un respaldo.

## Seguridad actual

Existe autenticacion con token HMAC y bcrypt para contrasenas. `requireAuth` valida el token, consulta el usuario vigente en base, exige `estado = true`, excluye `password_hash` y adjunta `req.user`. Un token ausente, invalido, expirado o con usuario inexistente/inactivo responde `401`.

La autorizacion usa `authorization.middleware.js` y la matriz central de `permissions.js`. Un usuario autenticado sin permiso recibe `403`. `ADMIN` tiene permiso total; las reglas de propiedad y visibilidad permanecen en servicios.
`/api/despachos` conserva consulta, pedidos disponibles, entrega y no entrega asociados a jornadas. Ya no expone creacion, inicio ni cancelacion de despachos individuales.
