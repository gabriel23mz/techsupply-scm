# TechSupply SCM — Módulo Outbound

Sistema inteligente para la gestión comercial y logística de salida de una distribuidora de productos tecnológicos.

TechSupply SCM Outbound integra un backend Node.js, una base PostgreSQL, un motor de optimización logística en Python y una interfaz React. El flujo cubre la creación del pedido, preparación en bodega, planificación diaria de jornadas, carga de camiones, ejecución de entregas y cierre de la jornada.

> Estado actual: MVP Outbound funcional y cerrado para demostración. Backend, PostgreSQL, motor Python, frontend responsive por rol y automatizaciones n8n se encuentran integrados. La planificación multivehículo genera jornadas, Bodega confirma la carga, Chofer ejecuta las entregas y los eventos post-commit producen notificaciones HTML mediante un Webhook local publicado de n8n.

---

## Arquitectura general

```text
Frontend React + Vite
        │
        │ API REST + token
        ▼
Backend Node.js + Express
        │
        ├── Reglas de negocio
        ├── Seguridad RBAC
        ├── Transacciones y locks
        ├── Trazabilidad temporal
        ├── Migraciones y seeders
        │
        ├───────────────┐
        ▼               ▼
PostgreSQL         FastAPI / Python
                        │
                        ├── A*
                        ├── ACO-CVRP
                        └── OSRM

Backend ── eventos post-commit ──> Webhook n8n ──> correos HTML
```

### Responsabilidades

- **Frontend:** presenta datos, formularios, mapas y acciones permitidas.
- **Backend:** autentica, autoriza, valida, persiste y controla los estados del dominio.
- **PostgreSQL:** almacena el modelo relacional, JSONB, enums, índices parciales y restricciones.
- **Python:** calcula rutas y distribuye pedidos entre camiones; no accede a la base.
- **n8n:** recibe cinco eventos logísticos post-commit, genera correos HTML y opera en modo demostración con destinatarios de clientes trazables.

La documentación técnica detallada se encuentra en [`docs/`](docs/README.md).

---

## Flujo operativo principal

```text
VENTAS
PENDIENTE
  └── crea y edita el pedido
  └── envía a preparación
        ↓
BODEGA
PREPARANDO
  └── registra cantidades preparadas por detalle
  └── finaliza la preparación
        ↓
LISTO_PARA_DESPACHO
        ↓
LOGÍSTICA
  └── genera las jornadas operables del día
  └── asigna camión y chofer
        ↓
BODEGA
  └── carga las cajas en el camión
  └── confirma la carga
        ↓
CHOFER
  └── inicia la jornada
  └── registra entregado o no entregado
  └── confirma el retorno y finaliza
```

Reglas relevantes:

- El pedido permanece `LISTO_PARA_DESPACHO` al planificar.
- Pasa a `DESPACHADO` solamente cuando el chofer inicia físicamente la jornada.
- Solo se generan rutas para la fecha operativa actual.
- Solo participan camiones `EN_BODEGA` y choferes realmente disponibles.
- Una jornada puede durar más de un día.
- El cambio de fecha o el retorno estimado no liberan recursos.
- Camión y chofer quedan disponibles al finalizar realmente la jornada.
- Las fechas estimadas se conservan; no sustituyen las fechas reales.

---

## Roles y permisos

| Rol | Responsabilidad principal |
|---|---|
| `ADMIN` | Acceso completo al sistema y administración de usuarios |
| `VENTAS` | Clientes, pedidos propios y envío a preparación |
| `BODEGA` | Preparación de pedidos y carga de camiones |
| `LOGISTICA` | Jornadas, rutas, camiones, choferes y supervisión |
| `CHOFER` | Jornadas propias, entregas, no entregas y finalización |
| `COMPRAS` | Catálogo y dominio inbound existente |

El backend usa permisos centralizados y distingue:

- `401 Unauthorized`: sesión ausente, inválida, expirada o usuario inactivo.
- `403 Forbidden`: sesión válida, pero sin permiso o sin propiedad sobre el recurso.

---

## Tecnologías

### Backend

- Node.js
- Express 5
- Sequelize 6
- PostgreSQL
- Sequelize CLI
- bcrypt
- Axios

### Motor logístico

- Python
- FastAPI
- Pydantic
- A*
- Colonia de hormigas aplicada a CVRP
- OSRM

### Frontend

- React 19
- Vite 8
- React Router
- Axios
- Bootstrap y Bootstrap Icons
- React Toastify
- Leaflet y React Leaflet

### Persistencia e infraestructura

- PostgreSQL local verificado con PostgreSQL 18
- Compatibilidad con Supabase mediante `DATABASE_URL` y SSL configurable
- Columnas JSONB para rutas y geometrías
- Migraciones reproducibles desde una base vacía
- Dataset demo verificable

---

## Estructura principal

```text
techsupply-outbound/
├── database/
│   ├── config/
│   ├── migrations/
│   ├── scripts/
│   ├── seeders/
│   └── support/
├── docs/
├── frontend/
├── python/
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/
├── .env.example
├── .sequelizerc
├── package.json
└── server.js
```

---

## Requisitos

- Node.js y npm.
- Python 3.13 o compatible.
- PostgreSQL 18 o compatible.
- Un entorno virtual Python.
- Acceso a internet para OSRM cuando se requiera geometría vial real.
- n8n local para ejecutar el workflow publicado de notificaciones.

Versiones verificadas durante la estabilización:

- Node.js `24.15.0`.
- Sequelize CLI `6.6.5`.
- Sequelize ORM `6.37.8`.
- PostgreSQL `18` en Windows.

---

## Instalación

### 1. Instalar dependencias raíz

```bash
npm install
```

### 2. Instalar dependencias del frontend

```bash
npm --prefix frontend install
```

### 3. Preparar Python

En Windows PowerShell:

```powershell
cd python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

### 4. Configurar variables del backend

Copia `.env.example` como `.env` y completa los valores privados.

```env
PORT=3000

DATABASE_URL=postgres://postgres:TU_PASSWORD@127.0.0.1:5432/techsupply_outbound_demo
DB_SSL=false

PYTHON_API=http://127.0.0.1:8000
AUTH_SECRET=replace_with_a_long_random_secret

APP_TIMEZONE=America/Guayaquil
HORA_INICIO_OPERACION=08:00
TIEMPO_SERVICIO_POR_ENTREGA_MIN=10
MARGEN_OPERATIVO_PORCENTAJE=15
MINUTOS_MAXIMOS_OPERACION_DIA=600

N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook/techsupply-notificaciones
N8N_TIMEOUT_MS=3000
N8N_BATCH_WINDOW_MS=150
N8N_DEMO_MODE=true
```

Configuración de conexión:

```text
DATABASE_URL → determina a qué base se conecta el sistema
DB_SSL       → determina si esa conexión usa SSL
```

- PostgreSQL local: `DB_SSL=false`.
- Supabase: `DB_SSL=true` y la cadena suministrada por Supabase.

No deben existir dos variables `DATABASE_URL` activas en el mismo archivo.

### 5. Configurar el frontend

Copia `frontend/.env.example` como `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Base de datos

### Consultar el estado de las migraciones

```bash
npm run db:migrate:status
```

### Ejecutar migraciones

```bash
npm run db:migrate
```

El historial actual incluye:

1. Esquema inicial.
2. Conversión de rutas a JSONB.
3. Rol y entidad `Chofer`.
4. Propiedad y trazabilidad de pedidos.
5. Preparación por detalle.
6. Carga y asignación de chofer.
7. Integridad logística e índices parciales.
8. Estimaciones temporales.
9. Paradas compartidas por destino dentro de una jornada.

La reconstrucción completa fue validada desde una base vacía en PostgreSQL 18.

### Dataset demo

Validar estáticamente los datos antes de insertarlos:

```bash
npm run db:demo:validate-static
```

Ejecutar los seeders:

```bash
npm run db:seed
```

Verificar conteos e invariantes del dataset cargado:

```bash
npm run db:demo:verify
```

Restaurar completamente la base demo:

```bash
npm run db:demo:reset
```

El reset se encuentra protegido y solamente se habilita cuando:

- `ALLOW_DEMO_RESET=true`.
- La base está en `localhost`, `127.0.0.1` o `::1`.
- El nombre termina en `_demo` o `_test`.
- `DB_SSL=false`.
- `NODE_ENV` no es `production`.

Después de usarlo, vuelve a establecer:

```env
ALLOW_DEMO_RESET=false
```

### Dataset validado

| Entidad | Registros mínimos verificados |
|---|---:|
| Usuarios | 18 |
| Categorías | 12 |
| Ubicaciones | 30 |
| Proveedores | 10 |
| Camiones | 10 |
| Choferes | 8 |
| Productos | 72 |
| Clientes | 48 |
| Rutas dirigidas | 164 |
| Pedidos | 72 |
| Detalles de pedido | 214 |
| Jornadas históricas | 3 |
| Despachos históricos | 13 |
| Órdenes de compra | 10 |
| Detalles de orden | 29 |
| Ingresos de inventario | 4 |
| Detalles de ingreso | 12 |

La ubicación con ID `1` es la **Bodega Central ESPAM MFL**, utilizada como origen y retorno del flujo logístico demo. La base inicia sin jornadas activas y con al menos 30 pedidos `LISTO_PARA_DESPACHO` para probar la planificación automática.

### Usuarios demo

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@demo.techsupply.ec` | `Admin123*` |
| VENTAS | `ventas1@demo.techsupply.ec` | `Ventas123*` |
| BODEGA | `bodega1@demo.techsupply.ec` | `Bodega123*` |
| LOGISTICA | `logistica1@demo.techsupply.ec` | `Logistica123*` |
| COMPRAS | `compras1@demo.techsupply.ec` | `Compras123*` |
| CHOFER | `chofer1@demo.techsupply.ec` | `Chofer123*` |

Estas credenciales son exclusivamente de demostración.

---

## Ejecución

### Levantar todos los servicios en Windows

```bash
npm run dev
```

Este comando ejecuta en paralelo:

- Backend: `http://localhost:3000`.
- Python: `http://127.0.0.1:8000`.
- Frontend: `http://localhost:5173`.

n8n se levanta en una terminal separada:

```powershell
npx n8n
```

El workflow **TechSupply SCM - Notificaciones Logísticas** debe estar publicado. El backend usa la URL de producción `/webhook/techsupply-notificaciones`; la URL `/webhook-test/` solo funciona mientras el nodo Webhook se encuentra escuchando manualmente.

### Ejecutar servicios por separado

```bash
npm run dev:node
npm run dev:python
npm run dev:frontend
```

El script `dev:python` utiliza la ruta de entorno virtual de Windows. En otro sistema operativo, ejecuta Uvicorn manualmente desde `python/`.

---

## API

Todos los módulos operativos, excepto el login, requieren autenticación.

| Prefijo | Responsabilidad |
|---|---|
| `/api/auth` | Login y sesión |
| `/api/usuarios` | Usuarios |
| `/api/clientes` | Clientes |
| `/api/categorias` | Categorías |
| `/api/productos` | Productos |
| `/api/ubicaciones` | Ubicaciones |
| `/api/rutas` | Catálogo de rutas |
| `/api/pedidos` | Pedidos |
| `/api/detalles-pedido` | Detalles comerciales |
| `/api/bodega` | Preparación y carga |
| `/api/camiones` | Camiones |
| `/api/choferes` | Choferes |
| `/api/jornadas-reparto` | Jornadas |
| `/api/despachos` | Entregas y no entregas asociadas a jornadas |

Los endpoints heredados para crear, iniciar o cancelar un despacho individual fueron retirados. `JornadaReparto` es el flujo operativo central.

---

## Pruebas y benchmark

Ejecutar toda la suite:

```bash
npm test
```

Scripts específicos:

```bash
npm run test:backend
npm run test:python
npm run test:frontend
npm run benchmark:python
```

La suite actual cubre backend, contratos Node-Python, planificación, integridad logística, seguridad, frontend por módulos y el cliente n8n. El build de Vite y ESLint forman parte de la validación de cierre.

Las pruebas backend usan dobles y mocks para evitar conexiones accidentales a PostgreSQL, Python, OSRM o n8n reales. La integración n8n se verifica interceptando la petición HTTP y validando los cinco contratos de evento.

---

## Estado actual por componente

### Backend

- Seguridad RBAC implementada.
- Controladores delgados y servicios de negocio.
- Errores tipados y middleware central.
- Transacciones y locks en operaciones críticas.
- Aliases Sequelize explícitos.
- Preparación, carga, choferes y temporalidad logística.
- Flujo heredado de despacho individual eliminado.
- Integridad reforzada mediante índices parciales.

### Base de datos

- Migraciones reproducibles.
- PostgreSQL local validado.
- Seeders completos y verificables.
- Reset demo protegido.
- Compatibilidad preparada con Supabase.

### Python

- A* para rutas individuales.
- ACO-CVRP para jornadas.
- Matriz de distancias y caché por solicitud.
- OSRM únicamente en geometrías finales.
- Errores estructurados.
- Benchmarks reproducibles.

### Frontend

- Autenticación, sesión validada y permisos por ruta y acción.
- Dashboards responsive adaptados a ADMIN, VENTAS, BODEGA, LOGISTICA, CHOFER y COMPRAS.
- Módulos cerrados de Clientes, Pedidos, Ubicaciones, Bodega, Jornadas, Despachos, Camiones, Choferes, Rutas y Mi Jornada.
- Centro de ayuda con orientación general y operativa por rol.
- Administración de usuarios exclusiva de ADMIN, con gestión de roles, restablecimiento administrativo de contraseña y desactivación lógica.
- Biblioteca visual, navegación responsive y mapas compartidos con Leaflet.

### n8n

- Webhook local real publicado en `http://localhost:5678/webhook/techsupply-notificaciones`.
- Eventos soportados: planificación creada, jornada iniciada, despacho entregado, despacho no entregado y jornada finalizada.
- Payloads normalizados sin enviar instancias Sequelize completas.
- Resumen único de planificación mediante agrupación breve de jornadas creadas.
- Correos HTML con identidad visual TechSupply.
- Modo demostración: el mensaje conserva el correo ficticio del cliente como destinatario previsto, pero se entrega al buzón real configurado en n8n.
- Timeout configurable y desacoplamiento post-commit: un fallo de n8n no revierte la operación logística.

---

## Trabajo pendiente fuera del cierre actual

1. Implementar Productos, Categorías y flujos Inbound únicamente si el alcance se amplía formalmente.
2. Añadir pruebas end-to-end con navegador y PostgreSQL efímero en una fase futura.
3. Definir despliegue permanente de n8n; la entrega actual utiliza una instancia local.
4. Incorporar idempotencia y trazabilidad persistida de notificaciones si el sistema evoluciona a producción.

Fuera del alcance actual del MVP:

- Planificación automática de fechas futuras.
- Uso de camiones próximos a regresar.
- Calendarios laborales y feriados.
- Tráfico en tiempo real.
- Rastreo GPS satelital.

---

## Documentación canónica

- [`docs/01-alcance-y-estado-del-mvp.md`](docs/01-alcance-y-estado-del-mvp.md)
- [`docs/02-arquitectura-general.md`](docs/02-arquitectura-general.md)
- [`docs/03-backend-y-reglas-de-negocio.md`](docs/03-backend-y-reglas-de-negocio.md)
- [`docs/04-base-de-datos.md`](docs/04-base-de-datos.md)
- [`docs/05-motor-logistico-python.md`](docs/05-motor-logistico-python.md)
- [`docs/06-frontend.md`](docs/06-frontend.md)
- [`docs/07-flujos-contratos-e-integraciones.md`](docs/07-flujos-contratos-e-integraciones.md)
- [`docs/08-instalacion-configuracion-y-ejecucion.md`](docs/08-instalacion-configuracion-y-ejecucion.md)
- [`docs/09-calidad-riesgos-y-trabajo-pendiente.md`](docs/09-calidad-riesgos-y-trabajo-pendiente.md)

---

## Avisos de seguridad

- No compartas `.env`.
- No incluyas credenciales reales en commits.
- No ejecutes el reset demo sobre Supabase.
- No uses las credenciales demo fuera de un entorno local.
- No ejecutes migraciones destructivas sobre una base remota sin respaldo y revisión previa.



