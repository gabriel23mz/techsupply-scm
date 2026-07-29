# TechSupply SCM Outbound — Frontend

Interfaz web de **TechSupply SCM — Módulo Outbound**, desarrollada con React y Vite.

Esta capa presenta una experiencia única y responsive para los roles de Administración, Ventas, Bodega, Logística, Chofer y Compras. El frontend consume exclusivamente los contratos vigentes del backend, aplica navegación y acciones por permisos y mantiene al servidor como autoridad final para autenticación, autorización y reglas de negocio.

> **Estado:** capa frontend Outbound cerrada para el alcance actual. Los módulos comerciales, de bodega, logística, operación del chofer, dashboards por rol y Centro de ayuda se consideran implementados. Productos, Categorías, Usuarios y los flujos Inbound de Compras quedan fuera de este cierre.

---

## Tecnologías

- React 19.
- Vite 8.
- React Router 7.
- Axios.
- Bootstrap Icons.
- React Toastify.
- Leaflet.
- React Leaflet.
- OpenStreetMap.
- OSRM para cálculo vial de rutas.

Bootstrap permanece instalado por compatibilidad histórica, pero los módulos cerrados utilizan principalmente la biblioteca visual compartida del proyecto.

---

## Alcance implementado

### Base de aplicación

- Login y persistencia de sesión.
- Validación de sesión mediante el backend.
- Protección de rutas.
- Navegación por rol y permiso.
- Sidebar expandido, compacto y móvil.
- Topbar con acciones dinámicas.
- Tema claro, oscuro y del sistema.
- Notificaciones y preferencias de interfaz.
- Pantallas de acceso denegado y ruta inexistente.
- Carga diferida por ruta.

### Sistema visual compartido

```text
Button
IconButton
FormField
TextField
SearchField
Combobox
SelectField
Checkbox
StatusBadge
StatCard
Modal
Drawer
ConfirmDialog
LoadingState
EmptyState
ErrorState
Tabs
Pagination
DataTable
TableActions
ToastViewport
WorkspaceShell
```

### Sistema compartido de mapas

```text
MapShell
MapControls
MapLegend
MapViewportController
MapLoadingState
MapErrorState
MapMarkerFactory
```

### Módulos cerrados

```text
Dashboard por rol
Centro de ayuda
Clientes
Pedidos
Nuevo pedido
Workspace comercial
Ubicaciones
Preparación de Bodega
Carga de Bodega
Jornadas
Despachos
Camiones
Choferes
Rutas
Mi Jornada
```

---

## Experiencia por rol

| Rol | Dashboard y acceso principal |
|---|---|
| `ADMIN` | Visión transversal de Ventas, Bodega y Logística; acceso a todos los módulos Outbound implementados. |
| `VENTAS` | Clientes, pedidos propios, nuevo pedido, workspace comercial y consulta de ubicaciones. |
| `BODEGA` | Preparación física de pedidos y carga de jornadas planificadas. |
| `LOGISTICA` | Jornadas, despachos, camiones, choferes, rutas, ubicaciones y consulta de clientes. |
| `CHOFER` | Dashboard mobile-first y módulo **Mi Jornada** para ejecutar el recorrido asignado. |
| `COMPRAS` | Dashboard y ayuda informativos; los procesos Inbound no forman parte de este frontend Outbound. |

El frontend oculta rutas y acciones no autorizadas para evitar flujos inválidos. El backend continúa validando permisos, propiedad, estados y reglas operativas.

---

## Rutas principales

| Ruta | Propósito |
|---|---|
| `/` | Dashboard adaptado al rol autenticado. |
| `/ayuda` | Información general y orientación específica del rol. |
| `/clientes` | Directorio comercial y gestión autorizada. |
| `/pedidos` | Listado y seguimiento de pedidos. |
| `/pedidos/nuevo` | Registro de un pedido. |
| `/pedidos/:id/workspace` | Gestión comercial del pedido. |
| `/ubicaciones` | Lista y mapa de puntos geográficos. |
| `/bodega/preparacion` | Pedidos pendientes de preparación. |
| `/bodega/preparacion/:id` | Workspace de preparación física. |
| `/bodega/cargas` | Jornadas pendientes o procesadas por Bodega. |
| `/bodega/cargas/:id` | Workspace de carga. |
| `/jornadas` | Planificación, jornadas registradas y mapa operativo. |
| `/jornadas/:id` | Seguimiento administrativo de una jornada. |
| `/despachos` | Consulta global de entregas y novedades. |
| `/camiones` | Gestión de flota. |
| `/choferes` | Gestión de perfiles y licencias. |
| `/rutas` | Catálogo de conexiones viales. |
| `/mi-jornada` | Operación mobile-first del chofer. |

También se conservan redirecciones ocultas para URLs antiguas de Centro Logístico y Mis entregas.

---

## Estructura

```text
frontend/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── PublicOnlyRoute.jsx
│   │   ├── Router.jsx
│   │   └── providers.jsx
│   ├── modules/
│   │   ├── auth/
│   │   ├── bodega/
│   │   ├── camiones/
│   │   ├── chofer/
│   │   ├── choferes/
│   │   ├── clientes/
│   │   ├── dashboard/
│   │   ├── despachos/
│   │   ├── help/
│   │   ├── logistica/
│   │   ├── pedidos/
│   │   ├── rutas/
│   │   └── ubicaciones/
│   ├── shared/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── maps/
│   │   ├── pages/
│   │   ├── routing/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── ui/
│   │   └── utils/
│   ├── index.css
│   └── main.jsx
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

La organización es modular por dominio. Los componentes genéricos, mapas, layouts, permisos y utilidades viven en `shared`.

---

## Instalación

Desde la raíz del repositorio:

```bash
npm --prefix frontend install
```

Crear `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_ROUTING_API_URL=https://router.project-osrm.org
```

`VITE_ROUTING_API_URL` es opcional. Cuando no se define, el frontend utiliza el servicio OSRM público configurado como valor predeterminado.

---

## Ejecución

Modo de desarrollo:

```bash
npm --prefix frontend run dev
```

URL local:

```text
http://localhost:5173
```

Build de producción:

```bash
npm --prefix frontend run build
```

Previsualización:

```bash
npm --prefix frontend run preview
```

Lint:

```bash
npm --prefix frontend run lint
```

---

## Validación antes de un commit

Desde la raíz del repositorio:

```powershell
npm test
npm --prefix frontend run build
npm --prefix frontend run lint
git -c core.whitespace=cr-at-eol diff --check
git status
```

Revisión visual mínima:

```text
360 px
768 px
1024 px
1440 px
Tema claro
Tema oscuro
Sidebar expandido
Sidebar compacto
Navegación móvil
Cada rol autorizado
```

---

## Arquitectura de sesión y permisos

### Sesión

El contexto de autenticación conserva:

- Usuario autenticado.
- Token.
- Permisos.
- Estado de validación.
- Login y logout.
- Helpers de acceso.

El cliente Axios agrega el token al encabezado `Authorization`.

### Errores HTTP

- `401`: limpia la sesión y conduce al login.
- `403`: conserva la sesión y muestra acceso denegado cuando corresponde.
- Errores de operación: se normalizan para formularios, estados persistentes o toasts.

### Rutas y navegación

La configuración se centraliza en:

```text
src/shared/routing/routeRegistry.jsx
src/shared/routing/routeComponents.jsx
src/shared/constants/navigation.jsx
```

Las rutas se registran una sola vez y se cargan de forma diferida. El Sidebar deriva sus entradas de la misma configuración y del rol actual.

---

## Comportamientos relevantes

### Dashboard y Centro de ayuda

- Composición específica para cada rol.
- Métricas, alertas y accesos entregados por el backend.
- Dashboard del Chofer adaptado a móvil.
- Dashboard informativo para Compras.
- Centro de ayuda con información general y orientación por rol.

### Ventas

- Clientes con gestión o lectura según permiso.
- Pedidos filtrados por el alcance del usuario.
- Formulario de nuevo pedido.
- Workspace comercial para productos y envío a preparación.
- Filtros relevantes persistidos en URL.

### Bodega

- Preparación por cantidades físicas.
- Progreso y confirmación.
- Carga de despachos por jornada.
- Confirmación de carga completa.

### Logística

- Generación de jornadas mediante el backend y Python.
- Resultado de generación sin espera artificial.
- Listado, filtros, mapa general y detalle de jornadas.
- Asignación o reasignación de chofer.
- Gestión de camiones y choferes.
- Consulta de despachos.
- Catálogo de rutas.

### Rutas y distancia

El formulario intenta calcular la distancia vial automáticamente mediante OSRM.

```text
origen y destino
→ validación de coordenadas
→ cálculo vial
→ conversión a kilómetros
→ envío al backend
```

Cuando el servicio vial no responde, el usuario autorizado puede desactivar el cálculo automático e introducir una distancia válida manualmente. El contrato enviado al backend no cambia.

### Chofer

Mi Jornada permite:

- Consultar el recorrido.
- Iniciar la jornada.
- Registrar entrega o no entrega.
- Avanzar de punto.
- Finalizar cuando se cumplen las condiciones operativas.
- Consultar progreso y mapa.

El rol Chofer no utiliza listados administrativos globales.

---

## Responsive y accesibilidad

Los módulos cerrados contemplan:

- Escritorio, tableta y móvil.
- Tablas transformadas en tarjetas cuando corresponde.
- Modales con margen exterior y altura basada en `100dvh`.
- Navegación por teclado en controles compartidos.
- Diálogos con portal, bloqueo de scroll, Escape y retorno de foco.
- Contraste para temas claro y oscuro.
- Acciones ocultas o deshabilitadas según permiso y estado.
- Respeto por `prefers-reduced-motion` en animaciones compatibles.

---

## Alcance no implementado

Este cierre no incorpora interfaces operativas para:

```text
Productos
Categorías
Usuarios
Órdenes de compra
Proveedores
Ingresos de inventario
Otros procesos Inbound
```

El rol Compras recibe una experiencia informativa en lugar de enlaces incompletos. Estos módulos requieren una fase separada si el alcance del proyecto se amplía.

---

## Principio de seguridad

Ocultar una ruta o un botón no reemplaza la autorización del servidor.

```text
Frontend → presenta únicamente opciones válidas para la sesión
Backend  → valida permisos, propiedad, estados y reglas de negocio
```

El frontend no modifica contratos ni reproduce reglas críticas que pertenecen al backend.
