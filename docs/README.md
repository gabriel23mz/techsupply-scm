# Documentacion oficial de TechSupply SCM - Modulo Outbound

Esta carpeta contiene la documentacion canonica del MVP academico **TechSupply SCM - Modulo Outbound**. Describe el sistema tal como esta implementado actualmente en el repositorio: backend Node.js, base PostgreSQL/Supabase, motor logistico Python/FastAPI, frontend React/Vite, mapas con Leaflet/OpenStreetMap y preparacion de automatizaciones con n8n.

La fuente principal de verdad para mantener estos documentos es el codigo operativo actual. Si existe una contradiccion entre documentacion antigua y codigo, prevalecen servicios, modelos, rutas, controladores, frontend, Python, migraciones y configuraciones activas.

## Estado actual

El proyecto es un MVP funcional para gestionar operaciones outbound de una distribuidora tecnologica. Permite registrar datos maestros, administrar pedidos, preparar detalles, generar jornadas de reparto con camiones automaticos, optimizar recorridos mediante Python, visualizar rutas en mapas y operar entregas por jornada.

La integracion con n8n existe como servicio preparado, pero actualmente no ejecuta webhooks reales. Las rutas operativas del backend existen, pero no aplican autenticacion obligatoria salvo endpoints puntuales de autenticacion.

## Orden recomendado de lectura

1. [01 - Alcance y estado del MVP](./01-alcance-y-estado-del-mvp.md)
2. [02 - Arquitectura general](./02-arquitectura-general.md)
3. [03 - Backend y reglas de negocio](./03-backend-y-reglas-de-negocio.md)
4. [04 - Base de datos](./04-base-de-datos.md)
5. [05 - Motor logistico Python](./05-motor-logistico-python.md)
6. [06 - Frontend](./06-frontend.md)
7. [07 - Flujos, contratos e integraciones](./07-flujos-contratos-e-integraciones.md)
8. [08 - Instalacion, configuracion y ejecucion](./08-instalacion-configuracion-y-ejecucion.md)
9. [09 - Calidad, riesgos y trabajo pendiente](./09-calidad-riesgos-y-trabajo-pendiente.md)

## Donde encontrar cada tema

| Tema | Documento |
| ---- | --------- |
| Alcance real, limites y estado del MVP | `01-alcance-y-estado-del-mvp.md` |
| Componentes, responsabilidades y diagrama general | `02-arquitectura-general.md` |
| Modelos, servicios, rutas, estados y reglas | `03-backend-y-reglas-de-negocio.md` |
| Entidades, relaciones, JSONB, indices y restricciones | `04-base-de-datos.md` |
| FastAPI, A*, ACO-CVRP, OSRM y contratos Python | `05-motor-logistico-python.md` |
| React, Vite, rutas, pantallas, Axios y Leaflet | `06-frontend.md` |
| Flujos operativos, contratos JSON y eventos n8n | `07-flujos-contratos-e-integraciones.md` |
| Requisitos, variables, puertos y arranque | `08-instalacion-configuracion-y-ejecucion.md` |
| Riesgos, deuda tecnica, pruebas y plan de mejora | `09-calidad-riesgos-y-trabajo-pendiente.md` |

## Reglas de mantenimiento documental

- Mantener esta carpeta compacta: no crear documentos nuevos salvo necesidad real.
- Actualizar la documentacion cuando cambien modelos, rutas, contratos, estados o flujos.
- No documentar funcionalidad pendiente como si ya estuviera implementada.
- No presentar n8n como completado mientras `src/services/n8n.service.js` siga siendo un stub.
- No presentar A* como unico algoritmo de jornadas: la generacion actual utiliza una metaheuristica ACO-CVRP y A* como camino minimo interno.
- No presentar MySQL como base activa: el codigo actual usa PostgreSQL/Supabase.
- No conservar documentos obsoletos por precaucion. Los documentos eliminados pueden consultarse mediante el historial de Git.

## Fuentes verificadas

La reconstruccion se baso en:

- `server.js`
- `src/models`
- `src/services`
- `src/controllers`
- `src/routes`
- `src/config/database.js`
- `database/migrations`
- `python/app.py`
- `python/modelos/contratos.py`
- `python/algoritmo`
- `frontend/src/app`
- `frontend/src/shared`
- `frontend/src/modules`
- archivos de dependencias y variables de entorno de ejemplo

