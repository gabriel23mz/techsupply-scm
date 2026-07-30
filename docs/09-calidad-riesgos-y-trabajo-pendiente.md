# 09 - Calidad, riesgos y trabajo pendiente

## Estado de cierre

El MVP Outbound se encuentra funcional para demostracion academica. Backend, PostgreSQL, Python, frontend y n8n estan integrados. La planificacion multivehiculo genera jornadas, Bodega confirma la carga, Chofer opera entregas por parada y los eventos post-commit producen correos HTML.

## Fortalezas

- Arquitectura por capas con controladores delgados y servicios de negocio.
- Autenticacion y autorizacion por permisos.
- Transacciones y locks en operaciones criticas.
- Migraciones PostgreSQL reproducibles e integridad logistica reforzada.
- `JornadaReparto` como entidad central del flujo operativo.
- Paradas compartidas: varios despachos del mismo destino usan el mismo `orden_entrega`.
- Avance automatico al cerrar todos los despachos del punto actual.
- Python desacoplado de la base de datos.
- A* precalculado y ACO-CVRP acotado por presupuesto de tiempo.
- Una llamada OSRM por jornada final en lugar de una llamada por tramo.
- Frontend responsive y adaptado a seis roles.
- n8n desacoplado de la transaccion principal.
- Dataset demo reproducible para probar planificacion real.

## Pruebas y verificaciones

| Suite | Herramienta | Cobertura principal |
| --- | --- | --- |
| Backend | `node:test` | Seguridad, CRUDs, transacciones, jornadas, despachos, contratos Node-Python y n8n |
| Python | `unittest` | Grafo, A*, ACO-CVRP, contratos, endpoints y rendimiento funcional |
| Frontend | `node:test` | Arquitectura, rutas, componentes, responsive y modulos cerrados |
| Build | Vite | Empaquetado de produccion |
| Lint | ESLint | Calidad estatica del frontend |

Comandos de cierre:

```bash
npm test
npm run benchmark:python
npm --prefix frontend run build
npm --prefix frontend run lint
git -c core.whitespace=cr-at-eol diff --check
```

Las pruebas backend fijan `N8N_ENABLED=false` por defecto y sustituyen `axios.post` cuando validan los contratos del Webhook. No llaman a la instancia real de n8n durante la suite.

## Integracion n8n verificada

`src/services/n8n.service.js` implementa un cliente HTTP real con:

- URL configurable por `N8N_WEBHOOK_URL`.
- Timeout configurable.
- Modo demostracion configurable.
- Normalizacion de jornadas, despachos, pedidos y clientes.
- Cinco eventos logisticos.
- Agrupacion breve de jornadas creadas para emitir un solo resumen administrativo.
- Payloads sin instancias Sequelize completas.
- Errores posteriores al commit que no revierten el dominio.

El workflow local publicado usa:

```text
Webhook
  -> Switch
  -> Code: Preparar notificaciones
  -> Send Email SMTP
```

Riesgos restantes de n8n:

- La instancia se ejecuta localmente y debe levantarse por separado.
- No existe idempotencia; un reintento manual podria duplicar correos.
- No existe tabla de auditoria persistida de eventos enviados o fallidos.
- El buzon SMTP y sus credenciales viven en n8n, no en el repositorio.
- La URL `/webhook-test/` no sirve para operacion normal; debe usarse `/webhook/`.

## Riesgos tecnicos conocidos

### Servicios externos

- OSRM publico puede variar en latencia o disponibilidad.
- n8n o SMTP pueden estar apagados; la operacion logistica se conserva, pero la notificacion puede perderse.
- Supabase requiere SSL y debe manejarse con credenciales fuera de Git.

### Integridad y concurrencia

- La generacion revalida y bloquea pedidos, camiones y choferes antes de persistir.
- Las restricciones PostgreSQL protegen pedidos activos, recursos y paradas compartidas.
- Una accion duplicada desde el cliente debe seguir siendo validada por estados del backend.
- No se ha incorporado una base PostgreSQL efimera dentro de la suite automatizada.

### Rendimiento

- El ACO tiene limite de soluciones, parada temprana y presupuesto de tiempo.
- A* no se ejecuta dentro del ciclo de hormigas.
- OSRM se consulta solo para jornadas finales.
- El tiempo total real depende de la red, aunque el tiempo algoritimico se mantiene acotado.

## Deuda tecnica aceptada

- Estados del dominio repetidos como literales en varias capas.
- Dashboard construido con varias consultas en lugar de agregaciones especializadas.
- Sin pruebas end-to-end con navegador.
- Sin observabilidad centralizada ni auditoria historica de eventos.
- Sin despliegue Docker permanente de n8n.
- Sin CRUD frontend independiente para Productos y Categorias.
- Procesos Inbound fuera del alcance.

## Trabajo futuro opcional

1. Desplegar n8n y PostgreSQL en infraestructura controlada.
2. Agregar idempotency keys y tabla de eventos n8n.
3. Implementar reintentos con cola y politica de backoff.
4. Incorporar pruebas E2E y PostgreSQL efimero.
5. Agregar metricas historicas y observabilidad.
6. Ampliar Inbound mediante una nueva fase formal.
7. Evaluar limites estrictos de jornada y pedidos no asignados para escenarios productivos.

## Fuera del alcance

- GPS satelital en tiempo real.
- Trafico en tiempo real.
- Kubernetes.
- Migracion completa a TypeScript.
- Aplicacion movil nativa.
- Optimizacion global para flotas de escala industrial.
