# 01 - Alcance y estado del MVP

## Problema que resuelve

TechSupply SCM - Modulo Outbound organiza la salida de pedidos de una distribuidora de productos tecnologicos. El sistema cubre el registro de clientes, productos, ubicaciones, pedidos y detalles; luego transforma pedidos listos en jornadas de reparto, asigna camiones disponibles, calcula el orden de entrega y muestra la operacion en una interfaz administrativa con mapas.

## Objetivo general

Construir un MVP academico funcional que permita administrar el flujo outbound desde la preparacion comercial del pedido hasta la planificacion, ejecucion y cierre de jornadas de reparto.

## Alcance real implementado

El alcance actual incluye:

- Autenticacion frontend, endpoint backend de login y autenticacion obligatoria para rutas operativas.
- Autorizacion por permisos para `ADMIN`, `VENTAS`, `BODEGA`, `LOGISTICA`, `CHOFER` y `COMPRAS`.
- Gestion de usuarios, clientes, categorias, productos, ubicaciones y rutas.
- Gestion de pedidos y detalles de pedido.
- Propiedad de pedidos por vendedor y visibilidad por rol.
- Preparacion de Bodega por cantidades.
- Carga de despachos y confirmacion de carga de jornada.
- Gestion de choferes y asignacion a jornadas.
- Descuento y reintegro de stock al modificar detalles o cancelar pedidos.
- Estados comerciales del pedido.
- Gestion de camiones.
- CRUD completo de camiones.
- Generacion diaria de rutas operables con fecha operativa local.
- Asignacion automatica de camiones en bodega y choferes disponibles.
- Agrupacion de multiples pedidos por jornada.
- Creacion de despachos asociados a cada pedido dentro de una jornada.
- Orden de entrega por punto logistico.
- Persistencia de `ruta_json` en jornadas y despachos.
- Coordenadas geograficas en ubicaciones.
- Mapas con Leaflet, OpenStreetMap y geometria obtenida mediante OSRM cuando esta disponible.
- Servicio Python FastAPI para ruta individual y generacion de jornadas.
- A* con heuristica nula para caminos minimos.
- Metaheuristica ACO-CVRP para asignar pedidos a camiones y ordenar destinos.
- Centro de Operaciones Logisticas en frontend.
- Vista de jornadas, mapa general y detalle de jornada.
- Gestion de despachos y seguimiento de entregas.
- Inicio, entrega, no entrega y finalizacion por chofer asignado o `ADMIN`.
- Integracion n8n preparada como stub.

## Funcionalidades parciales

- Frontend de Bodega, carga, choferes y administracion visual de permisos: el backend ya expone los endpoints, pero las pantallas dedicadas quedan para una siguiente pasada.
- n8n: existen funciones por evento, pero solo hacen `console.log`.
- Recalculo de jornada: implementado para jornadas `PLANIFICADA` con despachos `PENDIENTE`, con limite de desvio del 15% para nuevos destinos.
- Estimaciones logisticas: inicio, retorno y entregas estimadas se calculan en Node con parametros tecnicos del MVP; las fechas reales solo se asignan al iniciar, entregar o finalizar.
- Visualizacion geografica: implementada con mapas y geometria; no existe seguimiento GPS real.
- Dashboard: consolida datos reales consultando varios endpoints, pero no usa agregaciones backend.

## Funcionalidades pendientes para completar el MVP

- Formalizar contratos Node-Python con pruebas.
- Mantener auditado el payload de evento `jornadaCreada` antes de activar webhook real.
- Incorporar pruebas de servicios, contratos y flujos logisticos.
- Definir variables de entorno de ejemplo coherentes con PostgreSQL/Supabase.
- Implementar n8n real solo cuando existan URL, payloads, timeouts, trazabilidad e idempotencia.

## Fuera del alcance actual

- Seguimiento GPS real.
- Aplicacion movil.
- Microservicios adicionales.
- Kubernetes.
- Redux.
- Migracion completa a TypeScript.
- Multiples algoritmos alternativos sin necesidad del MVP.
- Analitica empresarial avanzada.
- Optimizacion global de escala productiva.
- Planificacion futura de recursos fuera de la fecha operativa actual.
- Liberar recursos por cambio de dia o retorno estimado.

## Estado actual del MVP

El MVP esta en estado funcional para demostracion academica local. El flujo operativo de despacho individual heredado fue eliminado; `JornadaReparto` es la entidad logistica central para planificacion, salida, entregas y cierre. La arquitectura ya refleja la evolucion real del proyecto: PostgreSQL/Supabase, mapas, coordenadas, OSRM y ACO-CVRP.

## Limitaciones conocidas

- La suite automatizada existe, pero no usa una base PostgreSQL efimera real.
- Algunas restricciones definitivas de concurrencia siguen pendientes a nivel PostgreSQL.
- La metaheuristica usa aleatoriedad sin semilla configurable.
- A* no usa heuristica geografica; con heuristica nula se comporta como Dijkstra.
- n8n no esta integrado con webhooks reales.
- `.env.example` conserva variables heredadas de MySQL y no representa completamente la configuracion activa PostgreSQL/Supabase.

## Decisiones que no conviene cambiar todavia

- Mantener JavaScript en lugar de migrar a TypeScript.
- Mantener React con estado local mientras el flujo no exija un store global.
- Mantener Sequelize porque modelos, migraciones y servicios ya estan alineados.
- Mantener Python como motor logistico independiente.
- Mantener `JornadaReparto` como entidad principal del proceso logistico.
- Mantener n8n como integracion preparada hasta estabilizar contratos y pruebas.
