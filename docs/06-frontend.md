# 06 - Frontend

## Estado y tecnologia

La capa frontend Outbound se encuentra cerrada para demostracion. Usa React, Vite, React Router, Axios, Bootstrap Icons, React Toastify, Leaflet y React Leaflet. La interfaz aplica una identidad visual comun, navegacion responsive, tema claro/oscuro, permisos por rol y experiencias especificas de escritorio y movil.

## Arquitectura modular

```text
frontend/src/
├── app/
│   ├── App.jsx
│   ├── Router.jsx
│   ├── ProtectedRoute.jsx
│   └── providers.jsx
├── modules/
│   ├── auth/
│   ├── bodega/
│   ├── camiones/
│   ├── chofer/
│   ├── choferes/
│   ├── clientes/
│   ├── dashboard/
│   ├── despachos/
│   ├── help/
│   ├── logistica/
│   ├── pedidos/
│   ├── rutas/
│   ├── ubicaciones/
│   └── usuarios/
└── shared/
    ├── components/
    ├── constants/
    ├── contexts/
    ├── hooks/
    ├── layouts/
    ├── maps/
    ├── routing/
    ├── services/
    ├── styles/
    ├── ui/
    └── utils/
```

Los componentes compartidos concentran layouts, tablas, modales, drawers, formularios, metricas, paginacion, permisos y mapas. Los modulos de dominio no duplican reglas visuales cerradas.

## Autenticacion y acceso por rol

`ProtectedRoute` exige sesion y permiso. El frontend oculta rutas y acciones no autorizadas como medida de experiencia de usuario; el backend conserva la autoridad real de seguridad.

Experiencias implementadas:

| Rol | Acceso principal |
| --- | --- |
| `ADMIN` | Vision transversal y administracion de usuarios |
| `VENTAS` | Clientes, pedidos, nuevo pedido y workspace comercial |
| `BODEGA` | Preparacion y carga de jornadas |
| `LOGISTICA` | Jornadas, despachos, camiones, choferes, rutas y mapas |
| `CHOFER` | Dashboard mobile-first y Mi Jornada |
| `COMPRAS` | Dashboard y ayuda informativos porque Inbound queda fuera del alcance |

## Modulos cerrados

- Dashboard adaptado a cada rol.
- Centro de ayuda.
- Clientes.
- Pedidos y workspace comercial.
- Ubicaciones.
- Preparacion de Bodega.
- Carga de Bodega.
- Jornadas y mapa operativo.
- Despachos.
- Camiones.
- Choferes.
- Rutas.
- Mi Jornada.
- Usuarios, exclusivo de `ADMIN`.

## Jornadas y operacion del chofer

La planificacion muestra pedidos listos, jornadas registradas y posicionamiento de camiones. La vista general del mapa muestra los camiones; al seleccionar una jornada presenta su recorrido individual.

La jornada solo muestra **Iniciar jornada** cuando Bodega confirmo la carga. Mientras la carga sigue pendiente aparece un bloque informativo de solo consulta.

En una parada pueden existir varios despachos con el mismo `orden_entrega`. El chofer puede resolverlos en cualquier secuencia. El avance al siguiente punto es automatico cuando todos los despachos de la parada actual quedan en estado terminal; no se presenta un boton manual redundante de avance. La finalizacion solo se habilita al cerrar todos los puntos.

## Mapas

Los mapas compartidos usan Leaflet y OpenStreetMap. Las geometrías se consumen como `[latitud, longitud]` y representan:

- Bodega central.
- Camion actual.
- Puntos de entrega.
- Recorrido completado y pendiente.
- Varias jornadas en el mapa operativo.

El frontend usa OSRM como apoyo para el catalogo de rutas. La planificacion principal y las geometrías persistidas de jornadas provienen del motor Python y del backend.

## Servicios Axios

`shared/services/api.js` configura:

- `VITE_API_URL` o `http://localhost:3000/api`.
- Token de sesion.
- Limpieza de sesion en `401`.
- Acceso denegado sin cierre de sesion en `403`.
- Timeout ampliado para operaciones de planificacion.

Las relaciones se consumen mediante aliases camelCase explicitos de Sequelize, por ejemplo `pedido.cliente`, `cliente.ubicacion`, `despacho.jornada`, `jornada.camion` y `jornada.despachos`.

## Responsive y accesibilidad

- Tablas convertidas en tarjetas cuando corresponde.
- Sidebars y topbars adaptados a movil.
- Modales con altura basada en `100dvh`.
- Bloqueo de scroll y retorno de foco.
- Navegacion por teclado.
- Estados loading, empty y error.
- Respeto por `prefers-reduced-motion`.
- Acciones ocultas o deshabilitadas segun permiso y estado.

## Alcance no implementado

No existen CRUD frontend independientes para Productos y Categorias ni interfaces operativas de los procesos Inbound: Proveedores, Ordenes de compra e Ingresos de inventario. Tampoco existe seguimiento GPS satelital ni un panel de administracion de n8n dentro de React; n8n opera como servicio externo local.
