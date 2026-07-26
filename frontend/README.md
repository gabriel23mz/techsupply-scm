# TechSupply SCM Outbound — Frontend

Interfaz web del módulo Outbound, desarrollada con React y Vite.

El frontend consume la API REST de TechSupply SCM, administra la sesión local, presenta mapas y permite ejecutar las operaciones comerciales y logísticas autorizadas por el backend.

> Estado actual: la base técnica está operativa, pero la interfaz todavía refleja parcialmente el MVP anterior. El backend ya incorporó seguridad RBAC, preparación en Bodega, carga, choferes y nuevas reglas temporales; la siguiente fase del proyecto será alinear completamente la navegación, los dashboards, las acciones y el diseño visual con esos contratos.

---

## Tecnologías

- React 19.
- Vite 8.
- React Router 7.
- Axios.
- Bootstrap 5.
- Bootstrap Icons.
- React Toastify.
- Leaflet.
- React Leaflet.
- OpenStreetMap.

---

## Estructura actual

```text
frontend/src/
├── app/
│   ├── App.jsx
│   ├── ProtectedRoute.jsx
│   ├── Router.jsx
│   └── providers.jsx
├── modules/
│   ├── auth/
│   ├── clientes/
│   ├── dashboard/
│   ├── despachos/
│   ├── logistica/
│   ├── pedidos/
│   ├── rutas/
│   └── ubicaciones/
├── shared/
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── services/
│   ├── styles/
│   └── utils/
├── index.css
└── main.jsx
```

La organización es modular por dominio. Cada módulo contiene páginas, componentes, servicios y estilos propios; los elementos transversales viven en `shared`.

---

## Instalación

Desde la raíz del repositorio:

```bash
npm --prefix frontend install
```

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

Ejecutar:

```bash
npm --prefix frontend run dev
```

URL local de Vite:

```text
http://localhost:5173
```

Build de producción:

```bash
npm --prefix frontend run build
```

Previsualizar el build:

```bash
npm --prefix frontend run preview
```

---

## Sesión y seguridad

### AuthContext

`AuthContext` conserva:

- `user`.
- `token`.
- `permissions`.
- Estado de autenticación.
- Funciones de login y logout.
- Helper `hasPermission`.

La sesión se guarda localmente y el token se adjunta mediante el cliente Axios.

### ProtectedRoute

`ProtectedRoute` diferencia:

- Usuario sin sesión: redirección a `/login`.
- Usuario autenticado sin permiso: pantalla de acceso denegado.

El frontend filtra navegación y acciones para mejorar la experiencia, pero el backend es la autoridad real de seguridad.

### Axios

`shared/services/api.js`:

- Usa `VITE_API_URL`.
- Agrega el token al header `Authorization`.
- Limpia la sesión ante `401`.
- Conserva la sesión ante `403`.
- Usa timeout ampliado para planificación logística.

---

## Rutas actuales

| Ruta | Módulo | Permiso actual |
|---|---|---|
| `/` | Dashboard | `PEDIDOS_LEER` |
| `/clientes` | Clientes | `CLIENTES_LEER` |
| `/pedidos` | Pedidos | `PEDIDOS_LEER` |
| `/ubicaciones` | Ubicaciones | `UBICACIONES_LEER` |
| `/rutas` | Rutas | `RUTAS_LEER` |
| `/centro-logistico` | Centro Logístico | `JORNADAS_LEER` |
| `/despachos` | Despachos | `DESPACHOS_LEER` |
| `/pedidos/nuevo` | Nuevo pedido | `PEDIDOS_CREAR` |
| `/pedidos/:id/workspace` | Workspace comercial | `PEDIDOS_LEER` |
| `/centro-logistico/jornadas/:id` | Detalle de jornada | `JORNADAS_LEER` |

La navegación se encuentra centralizada en `shared/constants/navigation.jsx`.

---

## Módulos actuales

### Autenticación

- Login.
- Persistencia de sesión.
- Consulta del usuario autenticado.
- Permisos recibidos desde el backend.

### Dashboard

Actualmente consulta de forma global:

- Pedidos.
- Clientes.
- Ubicaciones.
- Rutas.
- Despachos.
- Jornadas.
- Camiones.
- Productos.

Usa `Promise.allSettled`, por lo que puede mostrar una alerta de carga parcial cuando un rol no tiene acceso a alguno de esos endpoints.

Este comportamiento será reemplazado por dashboards y consultas adaptadas a cada rol.

### Clientes

- Listado.
- Búsqueda y filtros.
- Métricas.
- Formulario de creación y edición.
- Vista de detalle.

Actualmente las acciones internas todavía necesitan alinearse completamente con los permisos de gestión, no solo con el permiso de lectura de la página.

### Pedidos

- Listado y filtros.
- Creación.
- Edición en estados permitidos.
- Cancelación.
- Envío a preparación.
- Workspace para productos y resumen.

El workspace de Ventas:

- Permite editar únicamente en `PENDIENTE`.
- Usa la acción `Enviar a preparación`.
- Muestra `PREPARANDO` y estados posteriores en modo lectura.
- No finaliza físicamente la preparación.

### Ubicaciones

- Listado.
- Formularios.
- Coordenadas y mapa.
- Vista de detalle.

Debe diferenciarse la lectura de la gestión. Ventas puede requerir consulta, mientras que la edición pertenece principalmente a Logística y Admin.

### Rutas

Actualmente combina:

- Catálogo de rutas.
- Mapa general de jornadas.
- Camiones.

Camiones y Choferes deberán convertirse en módulos independientes. Las pestañas deben reservarse para vistas internas del mismo contexto, no para controlar permisos entre dominios distintos.

### Centro Logístico

- Pedidos disponibles.
- Generación de jornadas.
- Tabla de jornadas.
- Recalculo.
- Resultado de planificación.
- Mapa y detalle de jornada.

El backend ya asigna automáticamente camión y chofer, exige carga confirmada y limita la operación física al chofer o Admin.

### Despachos

- Listado histórico.
- Métricas.
- Filtros.
- Detalle.

El chofer no debe utilizar el listado global. Necesita una interfaz propia de jornada y entregas asignadas.

---

## Contratos backend vigentes que el frontend debe representar

### Ventas

- Ve pedidos propios.
- Crea y edita pedidos `PENDIENTE`.
- Cancela pedidos `PENDIENTE`.
- Envía pedidos a preparación.
- Consulta ubicaciones sin administrarlas.

### Bodega

- Ve pedidos `PREPARANDO`.
- Registra cantidades preparadas.
- Finaliza la preparación.
- Ve jornadas planificadas para carga.
- Marca cajas cargadas.
- Confirma la carga completa.

### Logística

- Ve pedidos `LISTO_PARA_DESPACHO`.
- Genera y recalcula jornadas.
- Administra rutas, ubicaciones, camiones y choferes según permisos.
- Supervisa jornadas y despachos.
- Consulta clientes sin modificarlos.

### Chofer

- Ve solamente sus jornadas.
- Ve su camión y entregas asignadas.
- Inicia la jornada cuando la carga está confirmada.
- Marca entregado o no entregado.
- Finaliza al retornar.

### Compras

- Accede al catálogo.
- El flujo inbound completo no forma parte de la interfaz Outbound actual.

### Admin

- Acceso total.

---

## Problemas conocidos confirmados

La revisión inicial del código y las pruebas manuales detectaron:

- Dashboard global que consulta endpoints prohibidos para algunos roles.
- Alertas de carga parcial causadas por respuestas `403` esperables.
- Accesos rápidos visibles aunque el usuario no tenga permiso.
- Menú lateral plano y poco alineado con prioridades operativas.
- Permiso de página sin control uniforme de botones y acciones internas.
- Módulos faltantes de Preparación, Carga, Camiones, Choferes y operación del Chofer.
- Clientes y Ubicaciones muestran acciones de gestión a roles que deberían tener solo lectura.
- Filtros de listados guardados únicamente en estado local y perdidos al regresar.
- Camiones incluidos como pestaña dentro de Rutas.
- Choferes sin módulo visual propio.
- Centro Logístico demasiado amplio para el rol Chofer.
- CSS extensos por módulo y componentes sin aislamiento suficiente.
- Diferencias visuales entre controles de mapas.
- Problemas de ancho al compactar el sidebar.
- Superposición incorrecta de Topbar, overlays y diálogos.
- Falta de componentes visuales base uniformes.
- Solo existe un smoke test estático; no hay pruebas de renderizado o E2E.

---

## Arquitectura objetivo de la reestructuración

No se crearán cinco aplicaciones diferentes. Se conservará un único frontend y se compondrá según permisos.

### Dashboard único con widgets por rol

```text
DashboardPage
├── widgets Admin
├── widgets Ventas
├── widgets Bodega
├── widgets Logística
├── widgets Chofer
└── widgets Compras
```

Cada rol consultará únicamente los endpoints autorizados.

### Navegación por permisos

El menú se construirá desde una configuración central con:

- Secciones.
- Prioridad.
- Permiso de lectura.
- Ruta.
- Ícono.
- Visibilidad por rol o capacidad.

### Módulos objetivo

```text
Dashboard
Clientes
Pedidos
Preparación
Carga de camiones
Jornadas
Despachos
Camiones
Choferes
Rutas
Ubicaciones
Productos
Categorías
Usuarios
Mi jornada
Mis entregas
```

No todos serán visibles para todos los roles.

### Pestañas

Las pestañas se usarán únicamente dentro del mismo contexto, por ejemplo:

```text
Jornada: Resumen | Mapa | Entregas | Carga
```

Camiones, Choferes, Jornadas y Despachos serán módulos distintos.

---

## Sistema visual objetivo

Antes de refactorizar páginas se consolidarán tokens y componentes reutilizables.

### Tokens

- Colores.
- Tipografía.
- Espaciado.
- Bordes.
- Sombras.
- Transiciones.
- Anchuras del layout.
- Escala de `z-index`.

### Componentes base

- `Button`.
- `IconButton`.
- `Input`.
- `Select`.
- `Textarea`.
- `Checkbox`.
- `Badge` y `StatusBadge`.
- `Card` y `StatCard`.
- `DataTable`.
- `Pagination`.
- `FiltersBar`.
- `Modal`.
- `ConfirmDialog`.
- `Toast`.
- `PageHeader`.
- `EmptyState`.
- `ErrorState`.
- `LoadingState`.
- `MapPanel`.

Los estilos se colocarán progresivamente junto a sus componentes, evitando CSS monolítico sin contexto.

---

## Persistencia de filtros

Los filtros, búsqueda, página y ordenamiento deberán representarse en la URL.

Ejemplo:

```text
/pedidos?estado=DESPACHADO&page=1
```

Así, al abrir un detalle y regresar, el listado conserva su contexto. La implementación utilizará `useSearchParams` o un helper compartido equivalente.

---

## Orden congelado de la estabilización

1. Auditoría completa de rutas, servicios, componentes y estilos.
2. Arquitectura de permisos, navegación y acciones.
3. Design system y corrección del layout.
4. Dashboard por rol.
5. Flujo de Ventas.
6. Preparación y carga de Bodega.
7. Logística: jornadas, camiones y choferes.
8. Interfaz del Chofer.
9. Filtros, estados, errores y accesibilidad.
10. Limpieza CSS, responsive y pruebas.

No se añadirán módulos fuera de este alcance sin una necesidad funcional demostrada.

---

## Pruebas actuales

Desde la raíz:

```bash
npm run test:frontend
```

Build:

```bash
npm --prefix frontend run build
```

Estado actual:

- 1 smoke test estático aprobado.
- Build de Vite aprobado.
- Advertencia conocida por bundle mayor de 500 kB.

La reestructuración deberá añadir pruebas de:

- Renderizado.
- Rutas y permisos.
- Navegación por rol.
- Acciones visibles y ocultas.
- Filtros persistentes.
- Flujos de Ventas, Bodega, Logística y Chofer.

---

## Principio de seguridad

Ocultar un botón no reemplaza la autorización del backend.

```text
Frontend → evita mostrar acciones no permitidas
Backend  → valida siempre permisos, propiedad, estado y reglas
```

Un `403` debe aparecer principalmente cuando el usuario intenta acceder manualmente a una URL o acción prohibida, no como parte normal de la carga del dashboard.
