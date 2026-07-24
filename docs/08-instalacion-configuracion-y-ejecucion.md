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

## Problemas frecuentes

| Problema | Causa probable |
| -------- | -------------- |
| Backend no inicia | `DATABASE_URL` ausente o invalida |
| Frontend no carga datos | `VITE_API_URL` incorrecta o backend apagado |
| Generar jornada falla | Python apagado, sin rutas activas, sin camiones o sin bodega valida |
| Mapa sin geometria real | OSRM no disponible o coordenadas invalidas |
| Login funciona pero API queda abierta | Limitacion actual: backend no protege rutas operativas |

