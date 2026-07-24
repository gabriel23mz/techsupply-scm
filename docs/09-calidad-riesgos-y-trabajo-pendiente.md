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

## Pruebas faltantes

No se detectaron suites reales. El script `test` del `package.json` es placeholder.

Casos prioritarios:

- Pedido sin detalles no puede quedar listo.
- Stock insuficiente al crear detalle.
- Modificacion de detalle reintegra o descuenta correctamente.
- Cancelacion de pedido reintegra stock.
- Jornada sin pedidos disponibles.
- Jornada sin camiones disponibles.
- Python no disponible.
- Python devuelve jornada sin entregas.
- Pedido duplicado en respuesta Python.
- Entrega fuera de orden.
- No entrega reprograma pedido.
- Finalizar jornada con despachos pendientes debe fallar.
- Recalcular jornada con despachos no pendientes debe fallar.

## Automatizaciones recomendadas

| Automatizacion | Beneficio | Prioridad |
| -------------- | --------- | --------- |
| Lint backend y frontend | Detectar errores de estilo/imports | Alta |
| Tests de servicios backend | Proteger reglas de negocio | Alta |
| Tests de contratos Node-Python | Evitar divergencias JSON | Alta |
| Tests Python de grafo y ACO-CVRP | Validar casos limite | Alta |
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

- Proteger rutas backend.
- Agregar transacciones a detalle/stock/total y despacho/pedido.
- Corregir payload de `jornadaCreada`.
- Actualizar variables de entorno de ejemplo.

### Fase 2 - Pruebas y contratos

- Crear tests de reglas de pedidos.
- Crear tests de jornadas.
- Crear tests Node-Python.
- Crear fixtures de rutas, bodega, camiones y pedidos.

### Fase 3 - Automatizacion

- Ejecutar lint en backend y frontend.
- Configurar CI.
- Agregar detector de secretos.
- Validar estructura documental y enlaces.

### Fase 4 - Integraciones

- Implementar n8n real con reintentos e idempotencia.
- Centralizar OSRM si el proyecto crece.
- Agregar observabilidad basica de eventos logisticos.

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

