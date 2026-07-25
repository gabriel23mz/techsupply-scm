# 02 - Arquitectura general

## Vision general

TechSupply SCM - Modulo Outbound esta organizado como una aplicacion web con backend Node.js, base de datos PostgreSQL/Supabase, motor logistico Python y frontend React. El backend orquesta reglas de negocio, Python calcula rutas y jornadas, y el frontend presenta la operacion administrativa y geografica.

```mermaid
flowchart LR
  U[Usuario administrativo] --> FE[React + Vite]
  FE -->|HTTP JSON /api| BE[Node.js + Express]
  BE --> ORM[Sequelize]
  ORM --> DB[(PostgreSQL / Supabase)]
  BE -->|HTTP JSON| PY[FastAPI Python]
  PY --> ACO[ACO-CVRP]
  PY --> ASTAR[A* con heuristica nula]
  PY --> OSRM[OSRM publico o configurado]
  FE --> MAP[Leaflet + OpenStreetMap]
  BE -. eventos preparados .-> N8N[n8n stub]
```

## Componentes y responsabilidades

| Componente | Responsabilidad |
| ---------- | --------------- |
| Backend Node.js | API REST, reglas de negocio, persistencia, transiciones de estado, integracion con Python y n8n |
| PostgreSQL/Supabase | Almacenamiento relacional, enums, restricciones, indices y JSONB |
| Python FastAPI | Construccion de grafo, calculo de ruta individual, generacion de jornadas y geometria |
| Frontend React | Interfaz administrativa, consumo de API, mapas, formularios, tablas y seguimiento |
| Leaflet/OpenStreetMap | Visualizacion geografica |
| OSRM | Calculo de geometria vial y distancia vial auxiliar |
| n8n | Integracion preparada para notificaciones/eventos; no activa aun |

## Backend

El backend usa:

- Node.js.
- Express.
- ES Modules.
- Sequelize.
- PostgreSQL.
- Migraciones Sequelize CLI.

Estructura principal:

```text
src/
├── config/
├── constants/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
└── utils/
```

El archivo `server.js` registra rutas bajo `/api`, configura CORS para el frontend local y autentica la conexion Sequelize. `POST /api/auth/login` permanece publico; las rutas operativas declaran `authMiddleware.requireAuth` dentro de cada router y luego aplican `authorizationMiddleware.requirePermission` con permisos centralizados.

## Flujo interno backend

Los modulos activos del backend siguen este flujo:

```text
Ruta Express
  -> Middleware de autenticacion
  -> Middleware de autorizacion por permiso
  -> Middleware de validacion HTTP
  -> Controlador HTTP delgado
  -> Servicio de caso de uso
  -> Modelos Sequelize y servicios auxiliares
```

Responsabilidades:

- `routes`: conservan URLs y metodos HTTP, autentican, autorizan y conectan validadores por endpoint.
- `middlewares/requestValidators.js`: valida estructura de entrada, campos obligatorios, IDs, formatos y rangos basicos.
- `controllers`: leen `params`, `body` o sesion autenticada, llaman una vez al servicio principal y devuelven `successResponse`.
- `services`: concentran normalizacion, reglas de negocio, consultas Sequelize, transacciones, locks, calculos e integraciones.
- `middlewares/errorHandler.js`: traduce errores tipados, errores Sequelize y fallos inesperados a la respuesta HTTP publica.

Los controladores activos no importan modelos Sequelize, no cifran contrasenas, no gestionan transacciones y no invocan Python ni n8n directamente.

Las asociaciones Sequelize activas declaran alias explicito con `as`. Los servicios usan esos alias en cada `include` y las respuestas consumidas por frontend exponen relaciones en camelCase contextual, por ejemplo `pedido.cliente`, `pedido.detalles`, `detalle.producto`, `cliente.ubicacion`, `despacho.jornada` y `jornada.despachos`. No se usa el nombre PascalCase autogenerado por Sequelize como contrato de lectura.

## Base de datos

La base activa es PostgreSQL, conectada mediante `DATABASE_URL`. Las migraciones crean tablas, claves foraneas, indices, enums y checks. La columna `ruta_json` de jornadas y despachos fue migrada a JSONB. Las migraciones nuevas agregan `CHOFER`, `choferes`, trazabilidad de pedidos, preparacion por detalle, carga y asignacion de chofer; estan creadas para revision y no deben ejecutarse contra Supabase real sin aprobacion.

## Python

El servicio Python usa FastAPI y expone:

- `POST /api/rutas/calcular`
- `POST /api/jornadas/generar`

Internamente construye un grafo bidireccional desde rutas activas, valida entradas con Pydantic, calcula una matriz de distancias entre bodega y destinos unicos, usa A* para poblar esa matriz y ACO-CVRP para asignar pedidos a camiones y ordenar destinos. OSRM se usa solo despues de elegir la solucion final para obtener geometria real; si falla, el sistema puede caer a lineas directas para visualizacion.

## Frontend

El frontend usa:

- React.
- Vite.
- React Router.
- Axios.
- Bootstrap y Bootstrap Icons.
- React Toastify.
- Leaflet y React Leaflet.

La estructura esta organizada por `app`, `shared` y `modules`. El layout principal incluye sidebar, topbar y rutas protegidas en cliente. La sesion local conserva permisos y la navegacion se filtra como mejora de UX; la autoridad real permanece en backend.

## Flujo de comunicacion

```mermaid
sequenceDiagram
  participant FE as Frontend React
  participant BE as Backend Express
  participant DB as PostgreSQL/Supabase
  participant PY as FastAPI Python
  participant OS as OSRM

  FE->>BE: POST /api/jornadas-reparto/generar
  BE->>DB: Lee pedidos listos, camiones, bodega y rutas
  BE->>PY: POST /api/jornadas/generar
  PY->>PY: Validacion + matriz A*
  PY->>PY: ACO-CVRP con matriz y semilla opcional
  PY->>OS: Solicita geometria vial final
  OS-->>PY: GeoJSON de ruta
  PY-->>BE: Jornadas, entregas, distancias, tiempos, ruta_json
  BE->>DB: Transaccion: crea jornadas y despachos
  BE-->>FE: Resultado de planificacion
```

El pedido permanece `LISTO_PARA_DESPACHO` al planificar. Solo pasa a `DESPACHADO` cuando el chofer asignado inicia fisicamente la jornada con carga confirmada. La generacion representa rutas operables del dia en `APP_TIMEZONE`: usa pedidos listos, camiones `EN_BODEGA`, choferes disponibles y la fecha operativa actual. El flujo de despacho individual heredado fue retirado: no existen endpoints para crear, iniciar o cancelar despachos fuera de una jornada.

Una jornada puede durar mas de un dia. `fecha` es el dia planificado de salida, `inicio_estimado_en` y `retorno_estimado_en` son previsiones, `fecha_salida` y `fecha_finalizacion` son eventos reales. El cambio de dia o el retorno estimado no liberan recursos; el camion vuelve a estar disponible cuando la jornada finaliza y retorna a `EN_BODEGA`.

## Separacion de responsabilidades

- Frontend no calcula reglas logisticas; presenta datos y dispara acciones.
- Backend no implementa la metaheuristica; prepara datos, valida reglas y persiste resultados.
- Python no accede a la base de datos; recibe todo por JSON.
- `logistica.service.js` queda limitado a construir payloads, llamar Python y emitir eventos tecnicos post-commit.
- `jornadaReparto.service.js` conserva reglas, persistencia, asignacion automatica de chofer, disponibilidad fisica, estimaciones, estados y transacciones de jornadas.
- `despacho.service.js` conserva consulta, entrega y no entrega de despachos asociados a jornadas.
- n8n no debe bloquear la operacion principal cuando se active.
- La bodega central se identifica por `BODEGA_CENTRAL_ID = 1`.
- Los errores operacionales del backend se representan con clases tipadas y se responden desde un unico middleware central.
