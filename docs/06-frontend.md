# 06 - Frontend

## Tecnologia

El frontend usa React, Vite, React Router, Axios, Bootstrap, Bootstrap Icons, React Toastify, Leaflet y React Leaflet.

## Arquitectura modular

```text
frontend/src/
├── app/
│   ├── App.jsx
│   ├── Router.jsx
│   ├── ProtectedRoute.jsx
│   └── providers.jsx
├── shared/
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── services/
│   ├── styles/
│   └── utils/
└── modules/
    ├── auth/
    ├── clientes/
    ├── dashboard/
    ├── despachos/
    ├── logistica/
    ├── pedidos/
    ├── rutas/
    └── ubicaciones/
```

## Enrutamiento

`Router.jsx` define `/login` y una zona protegida por `ProtectedRoute`. Las rutas visibles y ocultas se centralizan en `shared/constants/navigation.jsx`:

- `/`
- `/clientes`
- `/pedidos`
- `/ubicaciones`
- `/rutas`
- `/centro-logistico`
- `/despachos`
- `/pedidos/nuevo`
- `/pedidos/:id/workspace`
- `/centro-logistico/jornadas/:id`

La proteccion es del lado frontend. El backend aun no aplica `requireAuth` a todas las rutas operativas.

## Layout

El layout principal usa `MainLayout`, `Sidebar` y `Topbar`. Incluye navegacion, paneles de preferencias, notificaciones calculadas desde datos reales y confirmaciones para navegacion sensible.

## Servicios Axios

`shared/services/api.js` crea un cliente Axios con:

- `baseURL`: `VITE_API_URL` o `http://localhost:3000/api`.
- timeout de 90 segundos.
- header `Content-Type: application/json`.
- interceptor para agregar token desde `techsupply_session`.
- interceptor para limpiar sesion en 401.

Las respuestas con relaciones incluidas se consumen mediante aliases camelCase canonicos definidos en Sequelize: `cliente`, `ubicacion`, `categoria`, `producto`, `pedido`, `detalles`, `usuario`, `jornada`, `camion` y `despachos`. El frontend activo no depende de claves PascalCase autogeneradas por Sequelize.

## Autenticacion frontend

El modulo `auth` permite login, guarda sesion local y consulta `/auth/me`. La UI bloquea rutas privadas si no hay sesion valida.

## Dashboard

El dashboard consulta pedidos, clientes, ubicaciones, rutas, despachos, jornadas, camiones y productos. Calcula metricas y alertas en cliente. Usa `Promise.allSettled`, por lo que puede cargar parcialmente si algun endpoint falla.

## Pedidos

El modulo de pedidos permite:

- Listar pedidos.
- Crear pedido.
- Editar pedido en estados permitidos.
- Iniciar preparacion.
- Finalizar preparacion.
- Cancelar pedido.
- Navegar al workspace de detalles.

## Workspace de pedido

El workspace gestiona productos asociados al pedido:

- Agregar detalle.
- Editar cantidad.
- Eliminar detalle.
- Ver resumen.
- Disparar transiciones de preparacion.

Las reglas finales las valida el backend.

## Centro de Operaciones Logisticas

El centro logistico muestra pedidos disponibles, jornadas existentes y acciones para generar jornadas. Consume:

- `/despachos/pedidos-disponibles`
- `/jornadas-reparto`
- `/jornadas-reparto/generar`
- `/jornadas-reparto/:id/recalcular`

Incluye modales de carga y resultado para la generacion.

## Despachos

El modulo de despachos lista entregas registradas, muestra metricas y permite consultar detalle. Las operaciones de entrega y no entrega se realizan principalmente desde vistas logisticas asociadas a jornadas.

## Jornadas y mapas

La pantalla de detalle de jornada permite:

- Iniciar jornada.
- Avanzar al siguiente punto.
- Entregar despacho.
- Marcar no entregado.
- Finalizar jornada.
- Visualizar mapa de la ruta.

`JornadaMap.jsx` usa `MapContainer`, `TileLayer`, `Marker`, `Polyline`, `Popup` y `Tooltip`. Normaliza geometria como `[latitud, longitud]`, agrupa marcadores por orden y representa bodega, camion y puntos de entrega.

## Rutas y mapa general

El modulo `rutas` combina:

- Catalogo de rutas.
- Calculo vial auxiliar desde OSRM en frontend.
- Lista de camiones.
- Mapa general de jornadas activas.

`MapaGeneralJornadas.jsx` representa varias jornadas y maneja errores de tiles de OpenStreetMap.

## Ubicaciones

Ubicaciones incluye formularios y mapas para coordenadas. Las coordenadas son relevantes para OSRM, Leaflet y la generacion de geometria de jornadas.

## Componentes compartidos

Existen componentes compartidos para:

- Layout.
- Sidebar.
- Topbar.
- ConfirmDialog.
- Paneles de configuracion.
- Notificaciones.
- Toast utilities.

Tambien hay tablas, toolbars, metricas, paginacion y modales especificos por modulo.

## Estados de carga y errores

El frontend usa spinners, estados vacios, mensajes toast y confirmaciones. Las operaciones lentas de planificacion usan timeout ampliado y modales de progreso.

## Pantallas pendientes o parciales

- No existe modulo frontend dedicado a categorias/productos como CRUD completo independiente, aunque se consumen productos y categorias en backend.
- No existe administracion de roles.
- No existe seguimiento GPS real.
- No existe panel de n8n.
