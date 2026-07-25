# 09 - Calidad, riesgos y trabajo pendiente

## Fortalezas

- Arquitectura clara por capas en backend.
- `JornadaReparto` consolidada como entidad principal del flujo logistico.
- Python desacoplado de la base de datos.
- Uso de migraciones en lugar de sincronizacion automatica.
- PostgreSQL/Supabase con restricciones, indices y JSONB.
- Frontend modular y conectado a datos reales.
- Mapas con Leaflet ya integrados.
- Transacciones en operaciones logisticas centrales.
- n8n desacoplado de la operacion principal.
- Controladores backend activos adelgazados y errores centralizados.
- Errores operacionales tipados con normalizacion de errores Sequelize y externos.
- Asociaciones Sequelize normalizadas con aliases explicitos y consumidores activos alineados al contrato camelCase.
- Autenticacion y autorizacion por permisos en rutas operativas.
- Flujo de Bodega, carga, chofer asignado y momento correcto de `DESPACHADO`.
- Flujo heredado de despacho individual retirado de rutas, controladores, servicios y frontend.

## Deuda tecnica

- Estados repetidos como literales en modelos, servicios y frontend.
- Flujo heredado de despacho individual retirado; la operacion vigente usa jornadas y despachos asociados.
- `.env.example` no refleja la configuracion activa.
- n8n es stub.
- Dashboard carga multiples colecciones completas.
- OSRM se consume desde Python y tambien desde frontend.
- No hay definicion formal versionada de contratos.
- La validacion Python ya es estricta, pero `.env.example` todavia no expone todos los timeouts usados por Node.

## Riesgos de seguridad

- Las rutas operativas aplican `requireAuth` y autorizacion por permisos.
- El frontend filtra por permisos, pero no es autoridad de seguridad.
- Los errores internos inesperados ya no exponen mensajes en produccion.
- El servicio n8n imprime objetos completos en consola.
- Los secretos reales deben mantenerse fuera de Git y de la documentacion.

## Riesgos de integridad

- Las restricciones parciales de integridad logistica estan creadas como migracion, pero aun no ejecutadas contra una base real.
- Puede haber datos historicos incompatibles; la migracion falla con diagnostico en lugar de corregir silenciosamente.
- `ruta_json` puede quedar desactualizado si se modifican ubicaciones despues de generar jornadas.

## Riesgos de concurrencia pendientes

- Generar jornadas en paralelo ahora revalida y bloquea pedidos, camiones y choferes antes de persistir; la proteccion definitiva queda reforzada por migraciones parciales pendientes de ejecucion real.
- Doble clic o reintento HTTP podria repetir operaciones sensibles.
- Avanzar jornada no usa transaccion.
- El tiempo de red de OSRM real sigue dependiendo del servicio externo aunque las llamadas ahora estan acotadas a la solucion final.

## Linea base automatizada de pruebas

Existe una primera red de seguridad automatizada para Fase 1:

| Suite | Herramienta | Alcance actual |
| ----- | ----------- | -------------- |
| Backend | `node:test` | Rutas, aliases Sequelize, CRUDs operativos, autenticacion, contratos Node-Python, n8n stub y flujos logisticos criticos |
| Python | `unittest` | Grafo, A*, ACO-CVRP, contratos Pydantic y endpoints FastAPI invocados de forma directa |
| Frontend | `node:test` | Smoke test de infraestructura y rutas principales consumidas por la navegacion |

Comandos:

```bash
npm test
npm run test:backend
npm run test:python
npm run test:frontend
```

Resultado de linea base:

- Backend: 67 pruebas aprobadas.
- Python: 24 pruebas aprobadas.
- Frontend: 1 prueba aprobada.
- Fallos omitidos intencionalmente: ninguno.
- Servicios reales utilizados: ninguno.

## Riesgos confirmados por pruebas

- `detallePedido.service.js` quedo protegido con rollback para creacion, actualizacion, eliminacion y recalculo de total.
- `despacho.service.js` quedo protegido con rollback para entrega, no entrega y avance de jornada asociado.
- `jornadaReparto.service.js` revalida recursos despues de Python, asigna choferes disponibles, calcula estimaciones y no marca pedidos como `DESPACHADO` hasta el inicio fisico de la jornada.
- Las rutas operativas activas declaran autenticacion antes de autorizacion.
- El flujo heredado de despacho individual queda fuera de backend y frontend.
- La migracion de integridad logistica es reversible y contiene diagnosticos de duplicados.
- `jornadaCreada` ahora usa jornada y despachos reales despues del commit.
- Las asociaciones Sequelize activas declaran `as`, los includes de servicios usan alias y los consumidores activos no leen relaciones PascalCase.
- A* ya no filtra `KeyError` por nodo inexistente; devuelve errores de dominio.
- El grafo y A* rechazan distancias no positivas o no finitas.
- Los contratos Pydantic rechazan coordenadas fuera de rango, duplicados, capacidades invalidas y velocidad no positiva.
- ACO-CVRP usa semilla opcional local y matriz de distancias; A* no se ejecuta dentro del ciclo interno.
- n8n sigue siendo stub local con salida por consola.

## Cobertura por modulo

| Modulo | Nivel | Cobertura actual | Pendiente |
| ------ | ----- | ---------------- | --------- |
| Autenticacion | A | Login valido, credenciales invalidas, token, exclusion de `password_hash` y rutas operativas protegidas estructuralmente | Pruebas HTTP completas de `/api/auth/me` |
| Usuarios | B | Listado sin `password_hash`, eliminacion logica | Validaciones completas de controlador |
| Clientes | B | Listado activo e include de ubicacion | Duplicados, relaciones y errores HTTP |
| Categorias | B | CRUD de servicio, duplicado indirecto y eliminacion logica | Relaciones con productos |
| Productos | B | Listado activo e include de categoria | Stock/precio y controlador |
| Ubicaciones | B | Listado activo | Rangos de coordenadas en backend |
| Rutas | B | Listado activo, aliases `origen` y `destino` | Duplicados y distancias invalidas |
| Pedidos | A | Transicion de preparacion y rechazo sin detalles | Matriz completa de estados HTTP |
| Detalles de pedido | A | Rollback de creacion, actualizacion, eliminacion, stock y total | Cancelacion de pedido con reintegro |
| Camiones | A | Resumen, capacidad y jornada vigente | Restricciones con jornadas activas |
| Despachos | A | Entrega, no entrega, doble entrega, avance y rollback | Cancelacion heredada con efectos cruzados si aparecen |
| Jornadas de reparto | A | Rechazo sin pedidos/camiones, inicio, avance, revalidacion post-Python, rollback y payload n8n | Restricciones de DB contra duplicados activos |
| Node-Python | A | Ruta valida, timeout, errores estructurados, respuesta invalida y validacion estricta de jornadas | Validacion HTTP end-to-end con servidor real aislado |
| n8n | C | Stub local sin webhook real | Cliente real con timeout, reintentos e idempotencia |
| Dashboard | C | No hay endpoints backend propios detectados | Caracterizar si se agrega controlador dedicado |
| Frontend | C | Smoke test de rutas principales y build Vite | Renderizado React y flujos de usuario |
| Modelos inbound | C | Inventariados por asociaciones, sin rutas activas outbound | No requieren CRUD artificial en esta fase |

## Automatizaciones recomendadas

| Automatizacion | Beneficio | Prioridad |
| -------------- | --------- | --------- |
| Lint backend y frontend | Detectar errores de estilo/imports | Alta |
| Ampliar tests de servicios backend | Proteger reglas de negocio restantes | Alta |
| Ampliar tests de contratos Node-Python HTTP | Evitar divergencias JSON con FastAPI real aislado | Alta |
| Benchmarks en CI manual | Detectar regresiones de rendimiento sin assertions fragiles | Media |
| Detector de secretos | Evitar filtraciones | Alta |
| Validacion de variables de entorno | Mejorar onboarding | Media |
| CI basico | Ejecutar verificaciones antes de integrar | Media |
| Auditoria de eventos n8n | Preparar webhooks reales | Media |

## n8n pendiente

Antes de activar webhooks reales:

- Definir URL por variable de entorno.
- Definir payload por evento.
- Agregar timeout.
- Manejar reintentos.
- Agregar idempotencia.
- Evitar logs con datos personales completos.
- Mantener versionado y auditado el payload de `jornadaCreada`.
- Registrar eventos enviados o fallidos.

## Flujos heredados

El flujo heredado de despacho individual fue retirado. `logistica.service.js` queda como adaptador tecnico de planificacion y notificaciones; `jornadaReparto.service.js` gobierna jornadas y `despacho.service.js` gobierna entrega/no entrega asociada a jornadas.

## Archivos candidatos a revision futura

| Archivo | Motivo |
| ------- | ------ |
| `src/routes/*.js` | Aplicar autenticacion y autorizacion |
| `src/services/detallePedido.service.js` | Mantener pruebas de rollback al ajustar reglas |
| `src/services/despacho.service.js` | Evaluar transaccion para cancelaciones si pasan a afectar pedido/jornada |
| `src/services/jornadaReparto.service.js` | Complementar proteccion con restricciones PostgreSQL futuras |
| `src/services/n8n.service.js` | Reemplazar stub por cliente real seguro |
| `src/constants/logistica.js` | Centralizar estados y parametros logisticos |
| `python/algoritmo/colonia_hormigas_cvrp.py` | Ajustar parametros si cambian escalas reales |
| `python/algoritmo/metaheuristica_jornada.py` | Revisar cache OSRM si se consolida con frontend |
| `.env.example` | Actualizar a PostgreSQL/Supabase |

## Plan priorizado

### Fase 1 - Estabilizacion minima

- Crear linea base automatizada de pruebas.
- Caracterizar rutas, servicios, contratos y riesgos principales.
- Simular servicios externos.
- Documentar comandos y limitaciones.

### Fase 2 - Pruebas y contratos

- Completar matriz HTTP por endpoint.
- Agregar pruebas de controladores restantes.
- Agregar pruebas de no entrega, cancelacion, finalizacion y recalculo.
- Incorporar base de datos efimera solo si existe entorno aislado.

### Fase 3 - Automatizacion

- Ejecutar lint en backend y frontend.
- Configurar CI.
- Agregar detector de secretos.
- Validar estructura documental y enlaces.
- Mantener benchmark Python como verificacion manual de rendimiento.

### Fase 4 - Estabilizacion interna

- Estandarizar flujo ruta, validacion, controlador y servicio.
- Centralizar manejo de errores con errores tipados.
- Mover normalizacion y reglas desde controladores a servicios.
- Mantener modelos, asociaciones, estados, endpoints y contratos externos congelados.

Estado: implementada para modulos activos outbound.

### Fase 5 - Integraciones

- Implementar n8n real con reintentos e idempotencia.
- Centralizar OSRM si el proyecto crece.
- Agregar observabilidad basica de eventos logisticos.

### Fase 6 - Correcciones funcionales

- Agregar transaccion a cancelacion de pedido y avance de jornada si se mantiene como endpoint separado.
- Ejecutar y auditar las restricciones parciales de base en una base aislada antes de aplicarlas a Supabase real.
- Actualizar variables de entorno de ejemplo.

## Mejoras que pertenecen al MVP

- Seguridad backend minima implementada; queda auditoria HTTP amplia.
- Pruebas de flujo logistico principal.
- Contratos Node-Python documentados y verificables.
- n8n documentado como pendiente hasta completarse.
- Limpieza de variables de entorno de ejemplo.

## Mejoras futuras opcionales

- Pantallas completas de Bodega, carga y choferes.
- Paginacion backend.
- Semilla configurable de metaheuristica.
- Metricas logisticas historicas.
- Auditoria de cambios.
- Optimizacion de mayor escala.

## Elementos fuera del alcance

- Seguimiento GPS real.
- Microservicios adicionales.
- Kubernetes.
- Redux sin necesidad funcional.
- Migracion completa a TypeScript.
- Aplicacion movil.
