# 04 - Base de datos

## Tecnologia activa

La base de datos activa es PostgreSQL, normalmente mediante Supabase, conectada por `DATABASE_URL`. Sequelize opera como ORM y Sequelize CLI administra migraciones y seeders.

El proyecto tuvo referencias antiguas a MySQL durante etapas iniciales, pero no es la base activa del codigo actual.

## Migraciones

La migracion inicial crea el esquema principal con tablas, claves foraneas, enums, indices y restricciones. Una migracion posterior transforma `ruta_json` de `jornadas_reparto` y `despachos` a JSONB.

Las migraciones de seguridad/logistica agregadas en la fase integral estan creadas pero no ejecutadas contra una base real:

- `20260724000100-add-chofer-role-and-table.js`: agrega rol `CHOFER` al enum real `enum_usuarios_rol` y crea `choferes`.
- `20260724000200-add-pedido-ownership-traceability.js`: agrega propiedad y trazabilidad de preparacion en `pedidos`.
- `20260724000300-add-detalle-preparacion.js`: agrega cantidades preparadas, trazabilidad y check en `detalle_pedido`.
- `20260724000400-add-carga-and-chofer-to-jornadas.js`: agrega carga de despachos, confirmacion de carga y `chofer_id`.
- `20260724000500-add-logistic-integrity-constraints.js`: agrega indices unicos parciales para despacho activo por pedido, jornada activa por camion/chofer en la misma fecha, ocupacion global `EN_RUTA`, orden unico y pedido unico por jornada.
- `20260724000600-add-logistic-temporal-estimates.js`: agrega `inicio_estimado_en` y `retorno_estimado_en` a jornadas y cambia `pedidos.fecha_entrega` a `DATE` para representar el momento real de entrega.

No se usa `sequelize.sync` en el arranque del servidor; `server.js` autentica la conexion con `sequelize.authenticate()`.

## Entidades principales

| Entidad | Tabla | Observaciones |
| ------- | ----- | ------------- |
| Usuario | `usuarios` | Correo unico, rol enum, estado booleano |
| Categoria | `categorias` | Nombre unico |
| Producto | `productos` | Categoria, precios, stock y checks |
| Ubicacion | `ubicaciones` | Coordenadas opcionales pero completas si existen |
| Ruta | `rutas` | Origen, destino, distancia, estado |
| Cliente | `clientes` | Identificacion y correo unicos, ubicacion obligatoria |
| Pedido | `pedidos` | Cliente, usuario, estado, total, fecha entrega |
| DetallePedido | `detalle_pedido` | Pedido-producto unico |
| Camion | `camiones` | Codigo y placa unicos, capacidad, estado |
| Chofer | `choferes` | Usuario `CHOFER`, licencia, vigencia y activo |
| JornadaReparto | `jornadas_reparto` | Camion, estado, posicion, ruta JSONB |
| Despacho | `despachos` | Pedido, jornada, orden, ruta JSONB |

## Entidades inbound existentes

Existen tablas y modelos de compras e inventario:

- `proveedores`
- `ordenes_compra`
- `detalle_orden_compra`
- `ingresos_inventario`
- `detalle_ingreso`

Forman parte del esquema compartido, pero no son modulos expuestos por la API outbound actual.

## Relaciones principales

```mermaid
erDiagram
  USUARIO ||--o{ PEDIDO : registra
  CLIENTE ||--o{ PEDIDO : realiza
  UBICACION ||--o{ CLIENTE : ubica
  CATEGORIA ||--o{ PRODUCTO : clasifica
  PEDIDO ||--o{ DETALLE_PEDIDO : contiene
  PRODUCTO ||--o{ DETALLE_PEDIDO : incluido
  PEDIDO ||--o{ DESPACHO : genera
  CAMION ||--o{ JORNADA_REPARTO : asignado
  USUARIO ||--o| CHOFER : perfil
  CHOFER ||--o{ JORNADA_REPARTO : asignado
  JORNADA_REPARTO ||--o{ DESPACHO : agrupa
  UBICACION ||--o{ RUTA : origen
  UBICACION ||--o{ RUTA : destino
```

## Aliases Sequelize canonicos

Los aliases pertenecen al mapeo ORM y no cambian tablas, columnas ni claves foraneas. La matriz activa es:

| Asociacion | Alias |
| ---------- | ----- |
| `Categoria.hasMany(Producto)` | `productos` |
| `Producto.belongsTo(Categoria)` | `categoria` |
| `Ubicacion.hasMany(Cliente)` | `clientes` |
| `Cliente.belongsTo(Ubicacion)` | `ubicacion` |
| `Ubicacion.hasMany(Ruta)` por `origen_id` | `rutasOrigen` |
| `Ubicacion.hasMany(Ruta)` por `destino_id` | `rutasDestino` |
| `Ruta.belongsTo(Ubicacion)` por `origen_id` | `origen` |
| `Ruta.belongsTo(Ubicacion)` por `destino_id` | `destino` |
| `Cliente.hasMany(Pedido)` | `pedidos` |
| `Pedido.belongsTo(Cliente)` | `cliente` |
| `Usuario.hasMany(Pedido)` | `pedidos` |
| `Pedido.belongsTo(Usuario)` | `usuario` |
| `Pedido.hasMany(DetallePedido)` | `detalles` |
| `DetallePedido.belongsTo(Pedido)` | `pedido` |
| `Producto.hasMany(DetallePedido)` | `detallesPedido` |
| `DetallePedido.belongsTo(Producto)` | `producto` |
| `Pedido.hasMany(Despacho)` | `despachos` |
| `Despacho.belongsTo(Pedido)` | `pedido` |
| `Camion.hasMany(JornadaReparto)` | `jornadas` |
| `JornadaReparto.belongsTo(Camion)` | `camion` |
| `JornadaReparto.hasMany(Despacho)` | `despachos` |
| `Despacho.belongsTo(JornadaReparto)` | `jornada` |
| `Proveedor.hasMany(OrdenCompra)` | `ordenesCompra` |
| `OrdenCompra.belongsTo(Proveedor)` | `proveedor` |
| `Usuario.hasMany(OrdenCompra)` | `ordenesCompra` |
| `OrdenCompra.belongsTo(Usuario)` | `usuario` |
| `OrdenCompra.hasMany(DetalleOrdenCompra)` | `detalles` |
| `DetalleOrdenCompra.belongsTo(OrdenCompra)` | `ordenCompra` |
| `Producto.hasMany(DetalleOrdenCompra)` | `detallesOrdenCompra` |
| `DetalleOrdenCompra.belongsTo(Producto)` | `producto` |
| `OrdenCompra.hasMany(IngresoInventario)` | `ingresosInventario` |
| `IngresoInventario.belongsTo(OrdenCompra)` | `ordenCompra` |
| `Usuario.hasMany(IngresoInventario)` | `ingresosInventario` |
| `IngresoInventario.belongsTo(Usuario)` | `usuario` |
| `IngresoInventario.hasMany(DetalleIngreso)` | `detalles` |
| `DetalleIngreso.belongsTo(IngresoInventario)` | `ingresoInventario` |
| `Producto.hasMany(DetalleIngreso)` | `detallesIngreso` |
| `DetalleIngreso.belongsTo(Producto)` | `producto` |
| `Usuario.hasOne(Chofer)` | `chofer` |
| `Chofer.belongsTo(Usuario)` | `usuario` |
| `Chofer.hasMany(JornadaReparto)` | `jornadas` |
| `JornadaReparto.belongsTo(Chofer)` | `chofer` |
| `Pedido.belongsTo(Usuario)` por `creado_por_usuario_id` | `creadoPor` |
| `Pedido.belongsTo(Usuario)` por `enviado_preparacion_por_usuario_id` | `enviadoPreparacionPor` |
| `Pedido.belongsTo(Usuario)` por `preparacion_finalizada_por_usuario_id` | `preparacionFinalizadaPor` |
| `DetallePedido.belongsTo(Usuario)` por `preparado_por_usuario_id` | `preparadoPor` |
| `Despacho.belongsTo(Usuario)` por `cargado_por_usuario_id` | `cargadoPor` |
| `JornadaReparto.belongsTo(Usuario)` por `carga_confirmada_por_usuario_id` | `cargaConfirmadaPor` |

## Tipos importantes

- Coordenadas: `DECIMAL(10,8)` para latitud y `DECIMAL(11,8)` para longitud.
- Distancias: `DECIMAL(10,2)`.
- Tiempos: enteros en minutos.
- Fechas: `DATE` o `DATEONLY` segun el uso.
- `JornadaReparto.fecha`: `DATEONLY`, fecha operativa planificada de salida.
- `JornadaReparto.inicio_estimado_en` y `retorno_estimado_en`: `DATE`, estimaciones.
- `JornadaReparto.fecha_salida` y `fecha_finalizacion`: `DATE`, eventos reales.
- `Despacho.fecha_estimada_entrega`: `DATE`, estimacion del intento.
- `Despacho.fecha_entrega` y `Pedido.fecha_entrega`: `DATE`, entrega real.
- `ruta_json`: JSONB en jornadas y despachos.

## JSONB

`JornadaReparto.ruta_json` almacena la ruta general:

```json
{
  "bodega": {
    "id": 1,
    "nombre": "Bodega Central ESPAM MFL",
    "latitud": -0.826658,
    "longitud": -80.182109
  },
  "puntos": [
    {
      "orden": 1,
      "pedido_id": 10,
      "cliente_id": 3,
      "cliente": "Cliente",
      "destino_id": 2,
      "ubicacion": "Destino",
      "latitud": -0.78601,
      "longitud": -80.23473,
      "estado": "PENDIENTE"
    }
  ],
  "geometria": [[-0.826658, -80.182109], [-0.78601, -80.23473]],
  "tramos": [
    {
      "orden": 1,
      "tipo": "ENTREGA",
      "desde": { "id": 1, "nombre": "Bodega Central ESPAM MFL" },
      "hasta": { "id": 2, "nombre": "Destino" },
      "desde_indice": 0,
      "hasta_indice": 1
    }
  ]
}
```

`Despacho.ruta_json` almacena la ruta parcial hacia el punto de entrega:

```json
{
  "desde": {
    "id": 1,
    "nombre": "Bodega Central ESPAM MFL",
    "latitud": -0.826658,
    "longitud": -80.182109
  },
  "hasta": {
    "id": 2,
    "nombre": "Destino",
    "latitud": -0.78601,
    "longitud": -80.23473
  },
  "ruta_nodos": [1, 2],
  "geometria": [[-0.826658, -80.182109], [-0.78601, -80.23473]]
}
```

## Indices y restricciones relevantes

- `detalle_pedido`: indice unico por `pedido_id` y `producto_id`.
- `rutas`: indice unico por `origen_id` y `destino_id`.
- `pedidos`: indices por `estado`, `fecha_entrega` y `cliente_id`.
- `pedidos`: indice por `creado_por_usuario_id`.
- `jornadas_reparto`: indices por `camion_id`, `estado` y `fecha`.
- `jornadas_reparto`: indice por `chofer_id` y `estado`.
- `despachos`: indice por `jornada_reparto_id` y `orden_entrega`.
- `despachos`: indice compuesto por `jornada_reparto_id` y `cargado`.
- `choferes`: unique por `usuario_id` y `numero_licencia`.
- `detalle_pedido`: check `0 <= cantidad_preparada <= cantidad`.

Los indices parciales de integridad logistica no se ejecutaron contra una base real. La migracion valida duplicados antes de crear indices y falla con una consulta de diagnostico si detecta conflictos; no borra ni actualiza datos operativos automaticamente.

Consultas de diagnostico previas:

```sql
SELECT pedido_id
FROM despachos
WHERE estado IN ('PENDIENTE', 'EN_TRANSITO')
GROUP BY pedido_id
HAVING COUNT(*) > 1;

SELECT camion_id, fecha
FROM jornadas_reparto
WHERE estado IN ('PLANIFICADA', 'EN_RUTA')
  AND camion_id IS NOT NULL
GROUP BY camion_id, fecha
HAVING COUNT(*) > 1;

SELECT chofer_id, fecha
FROM jornadas_reparto
WHERE estado IN ('PLANIFICADA', 'EN_RUTA')
  AND chofer_id IS NOT NULL
GROUP BY chofer_id, fecha
HAVING COUNT(*) > 1;

SELECT camion_id
FROM jornadas_reparto
WHERE estado = 'EN_RUTA'
  AND camion_id IS NOT NULL
GROUP BY camion_id
HAVING COUNT(*) > 1;

SELECT chofer_id
FROM jornadas_reparto
WHERE estado = 'EN_RUTA'
  AND chofer_id IS NOT NULL
GROUP BY chofer_id
HAVING COUNT(*) > 1;

SELECT jornada_reparto_id, orden_entrega
FROM despachos
WHERE jornada_reparto_id IS NOT NULL
GROUP BY jornada_reparto_id, orden_entrega
HAVING COUNT(*) > 1;

SELECT jornada_reparto_id, pedido_id
FROM despachos
WHERE jornada_reparto_id IS NOT NULL
GROUP BY jornada_reparto_id, pedido_id
HAVING COUNT(*) > 1;
```

La correccion manual recomendada es revisar cada grupo, cerrar o cancelar operaciones activas inconsistentes segun evidencia operativa, y ejecutar la migracion solo cuando las consultas no devuelvan filas.
- Checks para capacidad positiva, distancias positivas/no negativas, stock no negativo, precios coherentes y coordenadas validas.

## Dependencia de la bodega central

El backend usa `BODEGA_CENTRAL_ID = 1`. No existe todavia un campo estable de tipo codigo, slug o tipo de ubicacion que permita reemplazarlo sin migracion adicional. La siguiente fase de base de datos deberia agregar un identificador estable para la bodega central y actualizar seeders sin romper el ID actual.

## Riesgos actuales

- La restriccion parcial propuesta impide dos jornadas activas del mismo camion o chofer en la misma fecha y dos jornadas `EN_RUTA` del mismo recurso aunque sean de fechas distintas.
- No existe restriccion parcial para impedir multiples despachos activos por pedido.
- Algunas reglas de consistencia viven solo en servicios.
- El `ruta_json` puede desactualizarse si se modifican ubicaciones despues de generar jornadas.
