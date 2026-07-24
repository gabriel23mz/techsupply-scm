# 01 - Alcance y estado del MVP

## Problema que resuelve

TechSupply SCM - Modulo Outbound organiza la salida de pedidos de una distribuidora de productos tecnologicos. El sistema cubre el registro de clientes, productos, ubicaciones, pedidos y detalles; luego transforma pedidos listos en jornadas de reparto, asigna camiones disponibles, calcula el orden de entrega y muestra la operacion en una interfaz administrativa con mapas.

## Objetivo general

Construir un MVP academico funcional que permita administrar el flujo outbound desde la preparacion comercial del pedido hasta la planificacion, ejecucion y cierre de jornadas de reparto.

## Alcance real implementado

El alcance actual incluye:

- Autenticacion frontend y endpoint backend de login.
- Gestion de usuarios, clientes, categorias, productos, ubicaciones y rutas.
- Gestion de pedidos y detalles de pedido.
- Descuento y reintegro de stock al modificar detalles o cancelar pedidos.
- Estados comerciales del pedido.
- Gestion de camiones.
- Generacion automatica de jornadas de reparto.
- Asignacion automatica de camiones disponibles.
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
- Integracion n8n preparada como stub.

## Funcionalidades parciales

- Autenticacion: existe login, token y `ProtectedRoute` en frontend; backend solo protege `/api/auth/me`, no las rutas operativas.
- n8n: existen funciones por evento, pero solo hacen `console.log`.
- Recalculo de jornada: implementado para jornadas `PLANIFICADA` con despachos `PENDIENTE`, con limite de desvio del 15% para nuevos destinos.
- Visualizacion geografica: implementada con mapas y geometria; no existe seguimiento GPS real.
- Dashboard: consolida datos reales consultando varios endpoints, pero no usa agregaciones backend.

## Funcionalidades pendientes para completar el MVP

- Proteger rutas operativas del backend con autenticacion y, si aplica, roles.
- Formalizar contratos Node-Python con pruebas.
- Corregir payload de evento `jornadaCreada` antes de activar webhook real.
- Incorporar pruebas de servicios, contratos y flujos logisticos.
- Definir variables de entorno de ejemplo coherentes con PostgreSQL/Supabase.
- Implementar n8n real solo cuando existan URL, payloads, timeouts, trazabilidad e idempotencia.

## Fuera del alcance actual

- Gestion de choferes.
- Seguimiento GPS real.
- Aplicacion movil.
- Microservicios adicionales.
- Kubernetes.
- Redux.
- Migracion completa a TypeScript.
- Multiples algoritmos alternativos sin necesidad del MVP.
- Analitica empresarial avanzada.
- Optimizacion global de escala productiva.

## Estado actual del MVP

El MVP esta en estado funcional para demostracion academica local. El flujo principal de jornada esta mejor consolidado que el flujo heredado de despacho individual. La arquitectura ya refleja la evolucion real del proyecto: PostgreSQL/Supabase, mapas, coordenadas, OSRM, ACO-CVRP y `JornadaReparto` como entidad logistica central.

## Limitaciones conocidas

- No hay pruebas automatizadas reales.
- Algunas operaciones de pedido/detalle/despacho no son atomicas.
- La disponibilidad de camiones se evalua antes de invocar Python y antes de persistir; bajo concurrencia podria requerir restricciones adicionales.
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

