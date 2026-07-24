# 08 - Instalacion, configuracion y ejecucion

## Requisitos

- Node.js.
- npm.
- Python.
- Entorno virtual Python recomendado.
- PostgreSQL/Supabase accesible mediante `DATABASE_URL`.
- Servicio OSRM publico o URL compatible si se usa calculo vial.

Versiones observadas durante la auditoria:

- Node.js `v24.15.0`.
- Python `3.13.13`.

## Variables de entorno backend

Variables activas esperadas:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@host:puerto/base
PYTHON_API=http://127.0.0.1:8000
PYTHON_TIMEOUT_MS=90000
PYTHON_ROUTE_TIMEOUT_MS=15000
PYTHON_JOURNEY_TIMEOUT_MS=90000
AUTH_SECRET=valor-secreto
```

No se deben documentar ni copiar secretos reales. El archivo `.env` local no debe compartirse.

Limitacion conocida: `.env.example` conserva variables heredadas de MySQL (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) y no representa por completo la configuracion PostgreSQL/Supabase activa.

## Variables de entorno frontend

```env
VITE_API_URL=http://localhost:3000/api
VITE_ROUTING_API_URL=https://router.project-osrm.org
```

Si `VITE_ROUTING_API_URL` apunta a una instancia privada o placeholder, el calculo vial del formulario de rutas puede fallar.

## Backend

Instalar dependencias, si no existen:

```bash
npm install
```

Ejecutar backend:

```bash
npm run dev:node
```

O:

```bash
npm start
```

URL local:

```text
http://localhost:3000
```

Prefijo API:

```text
http://localhost:3000/api
```

## Python

Crear y activar entorno virtual segun el sistema operativo. Instalar dependencias desde `python/requirements.txt`.

Ejecutar:

```bash
cd python
python -m uvicorn app:app --reload
```

URL local esperada:

```text
http://127.0.0.1:8000
```

Endpoints:

```text
POST /api/rutas/calcular
POST /api/jornadas/generar
```

## Frontend

Ejecutar:

```bash
npm --prefix frontend run dev
```

URL local por defecto de Vite:

```text
http://localhost:5173
```

El backend CORS esta configurado para ese origen local.

## Migraciones y seeders

Scripts disponibles en `package.json`:

```bash
npm run db:migrate
npm run db:migrate:status
npm run db:seed
npm run db:seed:undo
```

Tambien existen scripts de reset demo. Deben usarse con cuidado porque modifican la base de datos.

## Orden recomendado de arranque

1. Verificar `DATABASE_URL` y conexion a PostgreSQL/Supabase.
2. Levantar Python/FastAPI en `127.0.0.1:8000`.
3. Levantar backend en `localhost:3000`.
4. Levantar frontend en `localhost:5173`.
5. Iniciar sesion desde `/login`.
6. Verificar dashboard y modulos.

Tambien existe script coordinado:

```bash
npm run dev
```

Este levanta Node, Python y frontend en paralelo. Debe usarse cuando dependencias y entorno Python ya esten preparados.

## Verificaciones

- Backend: revisar que `sequelize.authenticate()` confirme conexion.
- Python: abrir documentacion FastAPI si el servidor esta activo.
- Frontend: confirmar que `VITE_API_URL` apunte al backend.
- Jornadas: debe existir bodega central con ID `1` y coordenadas.
- Rutas: debe haber rutas activas suficientes para conectar bodega y destinos.
- Camiones: debe haber camiones `EN_BODEGA` con capacidad positiva.

## Pruebas automatizadas

La linea base de pruebas usa herramientas ya disponibles o nativas:

- Backend: `node:test` y `node:assert/strict`.
- Python: `unittest` de la libreria estandar.
- Frontend: smoke test con `node:test`, sin levantar Vite ni navegador.

Scripts disponibles:

```bash
npm test
npm run test:backend
npm run test:python
npm run test:frontend
npm run benchmark:python
```

Estructura:

```text
tests/
  backend/
    fixtures/
    helpers/
    *.test.js
  frontend/
    *.test.js
python/
  tests/
    test_*.py
```

Las pruebas backend fijan una `DATABASE_URL` ficticia dentro del proceso de test cuando hace falta importar modelos Sequelize. No ejecutan `sequelize.authenticate()`, no abren conexion a Supabase y no dependen del servicio Python real.

Componentes simulados o aislados:

- Modelos Sequelize mediante dobles de metodos (`findAll`, `findOne`, `findByPk`, `create`, `update`, `destroy`).
- Servicio Python desde Node mediante mock del cliente Axios.
- OSRM en Python mediante `unittest.mock.patch`.
- n8n como stub local, sin webhooks reales.
- Frontend mediante lectura estatica de configuracion y rutas principales.
- Arquitectura Fase 4 mediante pruebas de `errorHandler` y busquedas estructurales de controladores.

Limitaciones:

- La suite no usa una base PostgreSQL efimera en esta fase.
- No hay pruebas E2E con navegador.
- No se prueba frontend con renderizado React.
- Algunos riesgos se caracterizan con mocks para demostrar efectos parciales actuales sin corregirlos todavia.
- Las pruebas de Node importan modulos que cargan `dotenv`; esto no implica conexion a la base ni envio de datos.
- La linea base posterior a Fase 4 es 35 pruebas backend, 24 pruebas Python y 1 prueba frontend.

## Benchmark logistico Python

Ejecutar desde la raiz:

```bash
npm run benchmark:python
```

El benchmark usa fixtures reproducibles con semilla fija, calentamiento y tres mediciones por escenario. OSRM se simula para separar tiempo de algoritmo y geometria local del tiempo de red publica.

Escenarios incluidos:

- 5 pedidos / 1 camion.
- 14 pedidos / 3 camiones.
- 30 pedidos / 5 camiones.
- 14 pedidos / 3 camiones con destinos repetidos.

## Problemas frecuentes

| Problema | Causa probable |
| -------- | -------------- |
| Backend no inicia | `DATABASE_URL` ausente o invalida |
| Frontend no carga datos | `VITE_API_URL` incorrecta o backend apagado |
| Generar jornada falla | Python apagado, sin rutas activas, sin camiones o sin bodega valida |
| Mapa sin geometria real | OSRM no disponible o coordenadas invalidas |
| Login funciona pero API queda abierta | Limitacion actual: backend no protege rutas operativas |
| `npm run test:python` falla | Falta `python/.venv` o sus dependencias |
