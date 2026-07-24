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

## Deuda tecnica

- Estados repetidos como literales en modelos, servicios y frontend.
- Flujo heredado de despacho individual convive con el flujo actual por jornadas.
- `.env.example` no refleja la configuracion activa.
- n8n es stub.
- Dashboard carga multiples colecciones completas.
- OSRM se consume desde Python y tambien desde frontend.
- No hay definicion formal versionada de contratos.

## Riesgos de seguridad

- Las rutas operativas del backend no aplican `requireAuth`.
- No hay autorizacion por roles en endpoints.
- El manejador de errores puede exponer mensajes internos.
- El servicio n8n imprime objetos completos en consola.
- Los secretos reales deben mantenerse fuera de Git y de la documentacion.

## Riesgos de integridad

- Crear/editar/eliminar detalles modifica stock y total sin transaccion propia.
- Cancelar pedido reintegra stock sin transaccion propia.
- Entregar y marcar no entregado actualizan despacho y pedido sin transaccion.
- No hay restriccion de base para impedir dos jornadas activas del mismo camion.
- No hay restriccion parcial para impedir dos despachos activos del mismo pedido.
- `ruta_json` puede quedar desactualizado si se modifican ubicaciones despues de generar jornadas.

## Riesgos de concurrencia

- Generar jornadas en paralelo podria seleccionar los mismos pedidos o camiones si no hay bloqueo/restriccion adicional.
- Doble clic o reintento HTTP podria repetir operaciones sensibles.
- Avanzar jornada no usa transaccion.

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

- Backend: 17 pruebas aprobadas.
- Python: 15 pruebas aprobadas.
- Frontend: 1 prueba aprobada.
- Fallos omitidos intencionalmente: ninguno.
- Servicios reales utilizados: ninguno.

## Riesgos confirmados por pruebas

- `detallePedido.service.js` descuenta stock antes de crear el detalle. Si falla la creacion del detalle, el stock ya fue modificado.
- `despacho.service.js` marca despacho como `ENTREGADO` antes de actualizar el pedido. Si falla la actualizacion del pedido, puede quedar un cambio parcial.
- A* falla con `KeyError` cuando el nodo de origen no existe en el grafo.
- El grafo y A* aceptan distancias negativas y cero.
- Los contratos Pydantic aceptan coordenadas fuera de rango.
- n8n sigue siendo stub local con salida por consola.

## Cobertura por modulo

| Modulo | Nivel | Cobertura actual | Pendiente |
| ------ | ----- | ---------------- | --------- |
| Autenticacion | A | Login valido, credenciales invalidas, token y exclusion de `password_hash` | Pruebas HTTP completas de `/api/auth/me` |
| Usuarios | B | Listado sin `password_hash`, eliminacion logica | Validaciones completas de controlador |
| Clientes | B | Listado activo e include de ubicacion | Duplicados, relaciones y errores HTTP |
| Categorias | B | CRUD de servicio, duplicado indirecto y eliminacion logica | Relaciones con productos |
| Productos | B | Listado activo e include de categoria | Stock/precio y controlador |
| Ubicaciones | B | Listado activo | Rangos de coordenadas en backend |
| Rutas | B | Listado activo, aliases `origen` y `destino` | Duplicados y distancias invalidas |
| Pedidos | A | Transicion de preparacion y rechazo sin detalles | Matriz completa de estados HTTP |
| Detalles de pedido | A | Creacion, stock y riesgo no atomico | Actualizacion/eliminacion con fallos parciales |
| Camiones | A | Resumen, capacidad y jornada vigente | Restricciones con jornadas activas |
| Despachos | A | Entrega secuencial y riesgo no atomico | No entrega, cancelacion y finalizacion de jornada |
| Jornadas de reparto | A | Rechazo sin pedidos/camiones, inicio y avance bloqueado | Persistencia completa con respuesta Python simulada |
| Node-Python | A | Ruta valida, respuesta invalida e indisponibilidad simulada | Planificacion multivehiculo invalida en servicio de jornada |
| n8n | C | Stub local sin webhook real | Cliente real con timeout, reintentos e idempotencia |
| Dashboard | C | No hay endpoints backend propios detectados | Caracterizar si se agrega controlador dedicado |
| Frontend | C | Smoke test de rutas principales | Renderizado React y flujos de usuario |
| Modelos inbound | C | Inventariados por asociaciones, sin rutas activas outbound | No requieren CRUD artificial en esta fase |

## Automatizaciones recomendadas

| Automatizacion | Beneficio | Prioridad |
| -------------- | --------- | --------- |
| Lint backend y frontend | Detectar errores de estilo/imports | Alta |
| Ampliar tests de servicios backend | Proteger reglas de negocio restantes | Alta |
| Ampliar tests de contratos Node-Python | Evitar divergencias JSON de jornadas | Alta |
| Ampliar tests Python de grafo y ACO-CVRP | Validar mas casos limite | Alta |
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
- Corregir el payload de `jornadaCreada`.
- Registrar eventos enviados o fallidos.

## Flujos heredados

`logistica.service.js` conserva funciones de despacho individual (`crearDespacho`, `iniciarDespacho`, `entregarDespacho`, `cancelarDespacho`). El flujo actual mas importante es el de jornadas mediante `jornadaReparto.service.js`. No se debe eliminar nada sin revisar dependencias, pero la documentacion oficial debe priorizar jornadas.

## Archivos candidatos a revision futura

| Archivo | Motivo |
| ------- | ------ |
| `src/routes/*.js` | Aplicar autenticacion y autorizacion |
| `src/services/detallePedido.service.js` | Agregar transacciones para stock y total |
| `src/services/despacho.service.js` | Agregar transacciones para entrega/no entrega |
| `src/services/jornadaReparto.service.js` | Reforzar concurrencia y payload n8n |
| `src/services/n8n.service.js` | Reemplazar stub por cliente real seguro |
| `src/constants/logistica.js` | Centralizar estados y parametros logisticos |
| `python/algoritmo/colonia_hormigas_cvrp.py` | Semilla/configuracion reproducible |
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

### Fase 4 - Integraciones

- Implementar n8n real con reintentos e idempotencia.
- Centralizar OSRM si el proyecto crece.
- Agregar observabilidad basica de eventos logisticos.

### Fase 5 - Correcciones funcionales

- Proteger rutas backend.
- Agregar transacciones a detalle/stock/total y despacho/pedido.
- Corregir payload de `jornadaCreada`.
- Actualizar variables de entorno de ejemplo.

## Mejoras que pertenecen al MVP

- Seguridad backend minima.
- Pruebas de flujo logistico principal.
- Contratos Node-Python documentados y verificables.
- n8n documentado como pendiente hasta completarse.
- Limpieza de variables de entorno de ejemplo.

## Mejoras futuras opcionales

- Roles finos por modulo.
- Paginacion backend.
- Semilla configurable de metaheuristica.
- Metricas logisticas historicas.
- Auditoria de cambios.
- Optimizacion de mayor escala.

## Elementos fuera del alcance

- Gestion de choferes.
- Seguimiento GPS real.
- Microservicios adicionales.
- Kubernetes.
- Redux sin necesidad funcional.
- Migracion completa a TypeScript.
- Aplicacion movil.
