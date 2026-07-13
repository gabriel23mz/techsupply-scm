# Cronograma de Desarrollo – Grupo 2 (Outbound)

# TechSupply SCM

## Versión Actualizada

---

# Objetivo del Cronograma

Desarrollar el MVP funcional del módulo **Outbound** del sistema TechSupply SCM, priorizando la construcción de una arquitectura sólida, la implementación de las reglas de negocio y la integración de los distintos componentes del sistema antes del desarrollo de la interfaz de usuario.

La estrategia de desarrollo se centra en garantizar primero la estabilidad del backend y la correcta comunicación entre los módulos, reduciendo riesgos durante la integración con Python, n8n y el frontend.

El flujo principal del sistema será:

```text
Cliente
    ↓
Pedido
    ↓
Detalle del Pedido
    ↓
Validación de Stock
    ↓
Despacho
    ↓
Cálculo de Ruta Óptima (A*)
    ↓
Notificación
```

---

# Distribución de Responsabilidades

## Integrante A — Backend

Responsable de:

* Node.js
* Express
* Sequelize
* MySQL
* APIs REST
* Reglas de negocio
* Integración con Python
* Integración con n8n
* Arquitectura de servicios

---

## Integrante B — Frontend

Responsable de:

* React
* React Router
* Bootstrap
* Consumo de APIs REST
* Formularios CRUD
* Navegación
* Validaciones visuales
* Manual de usuario

---

## Trabajo Compartido

Ambos integrantes participarán en:

* Integración del sistema.
* Pruebas funcionales.
* Corrección de errores.
* Documentación técnica.
* Preparación de la presentación final.

---

# Estrategia de Desarrollo

El desarrollo del proyecto seguirá una estrategia incremental basada en cinco etapas principales.

## Fase 1

Infraestructura y arquitectura base.

## Fase 2

Implementación de la lógica de negocio.

## Fase 3

Integración del algoritmo A* y desarrollo del frontend.

## Fase 4

Automatización mediante n8n.

## Fase 5

Pruebas finales y documentación.

---

# Cronograma General

| Semana       | Actividades                                                                                                                                 | Responsable | Entregables                                               | Avance   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------- | -------- |
| **Semana 1** | Configuración del proyecto. Base de datos. Modelos Sequelize. Asociaciones. Arquitectura de servicios.                                      | A y B       | Base técnica completamente funcional.                     | **20%**  |
| **Semana 2** | Implementación de CRUD principales, reglas de negocio, control de stock, sincronización de estados y arquitectura logística.                | A y B       | Backend funcional con reglas de negocio implementadas.    | **55%**  |
| **Semana 3** | Implementación del módulo Python (A*). Integración Node.js ↔ Python. Inicio del desarrollo del frontend para pedidos, detalles y despachos. | A y B       | Algoritmo A* integrado y primeras interfaces del sistema. | **70%**  |
| **Semana 4** | Desarrollo de interfaces restantes. Integración completa Frontend ↔ Backend. Ajustes funcionales.                                           | A y B       | Sistema completamente integrado.                          | **85%**  |
| **Semana 5** | Integración con n8n. Automatizaciones. Validaciones finales. Pruebas generales. Documentación y preparación de exposición.                  | A y B       | MVP completamente funcional.                              | **100%** |

---

# Estado Actual del Proyecto

Actualmente el proyecto presenta un avance aproximado del **55%**.

Durante las primeras semanas se priorizó la construcción de la arquitectura del backend y la implementación de las reglas de negocio, permitiendo definir completamente la comunicación entre los distintos módulos antes de desarrollar la interfaz gráfica.

Actualmente se encuentran implementados:

* Configuración del proyecto.
* Base de datos.
* Modelos Sequelize.
* Relaciones entre entidades.
* CRUD completos.
* Arquitectura basada en servicios.
* Validaciones de negocio.
* Gestión de inventario.
* Gestión de pedidos.
* Gestión de detalles de pedido.
* Gestión de despachos.
* Sincronización automática de estados.
* Contratos de integración con Python.
* Contratos de integración con n8n.
* Documentación técnica de la arquitectura.

---

# Semana 1 — Infraestructura y Arquitectura

## Objetivo

Construir la base técnica del proyecto.

### Backend

* Configuración de Express.
* Configuración de Sequelize.
* Configuración de MySQL.
* Variables de entorno.
* Creación de modelos.
* Asociaciones entre entidades.
* Organización por capas (Controllers, Services, Models y Routes).

### Frontend

* Configuración inicial del proyecto React.
* Instalación de dependencias.
* Definición de la estructura del proyecto.

## Entregables

* Proyecto funcionando.
* Base de datos conectada.
* Arquitectura definida.

## Avance acumulado

**20%**

---

# Semana 2 — Implementación de la Lógica de Negocio

## Objetivo

Construir completamente el backend del sistema.

### Backend

Implementación de los módulos:

* Clientes.
* Productos.
* Rutas.
* Pedidos.
* Detalles de Pedido.
* Despachos.

Implementación de:

* Control de stock.
* Reglas de negocio.
* Recalculo automático de totales.
* Sincronización de estados.
* Arquitectura de orquestación mediante `logistica.service.js`.

Definición de contratos para:

* Integración con Python.
* Integración con n8n.

### Frontend

Planificación de la estructura de consumo de APIs.

## Entregables

* Backend completamente funcional.
* API REST operativa.
* Arquitectura desacoplada.

## Avance acumulado

**55%**

---

# Semana 3 — Integración del Algoritmo A* e Inicio del Frontend

## Objetivo

Integrar el módulo de cálculo de rutas y comenzar el desarrollo de la interfaz gráfica.

### Backend

* Implementación del módulo Python.
* Construcción del grafo.
* Implementación del algoritmo A*.
* Comunicación Node.js ↔ Python.
* Cálculo automático de rutas.
* Pruebas de integración.

### Frontend

Desarrollo de interfaces para:

* Pedidos.
* Detalles de Pedido.
* Despachos.

Implementación de:

* Navegación principal.
* Consumo de APIs.
* Formularios.

## Entregables

* Algoritmo A* funcionando.
* Integración Backend ↔ Python.
* Primer módulo del frontend operativo.

## Avance acumulado

**70%**

---

# Semana 4 — Desarrollo del Frontend

## Objetivo

Completar la interfaz de usuario e integrar todos los módulos.

### Frontend

Implementación de interfaces para:

* Clientes.
* Productos.
* Rutas.
* Pedidos.
* Detalles de Pedido.
* Despachos.

### Backend

* Corrección de incidencias.
* Ajustes menores.
* Optimización de consultas.

## Entregables

* Sistema completamente integrado.

## Avance acumulado

**85%**

---

# Semana 5 — Automatización y Cierre

## Objetivo

Finalizar el MVP.

### Backend

* Integración con n8n.
* Automatización de eventos.
* Notificaciones.

### Sistema

* Pruebas funcionales.
* Corrección de errores.
* Datos de demostración.
* Manual técnico.
* Manual de usuario.
* Preparación de la presentación.

## Entregables

* MVP completamente funcional.

## Avance acumulado

**100%**

---

# Riesgos Identificados

| Riesgo                                 | Impacto | Mitigación                                                                                            |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| Retrasos en el desarrollo del frontend | Alto    | Priorizar primero la arquitectura y las reglas de negocio.                                            |
| Integración Node.js ↔ Python           | Medio   | Definir previamente el contrato de comunicación antes de implementar el algoritmo.                    |
| Integración con n8n                    | Medio   | Limitar inicialmente las automatizaciones al alcance del MVP.                                         |
| Cambios en las reglas de negocio       | Alto    | Centralizar toda la lógica en la capa de servicios para reducir el impacto de modificaciones futuras. |
| Errores durante la integración final   | Alto    | Reservar tiempo para pruebas funcionales antes de la entrega.                                         |

---

# Alcance del MVP

El proyecto incluirá:

* Gestión de clientes.
* Gestión de productos.
* Gestión de rutas.
* Gestión de pedidos.
* Gestión de detalles de pedido.
* Gestión de despachos.
* Validación automática de inventario.
* Cálculo de rutas mediante algoritmo A*.
* Integración con Python.
* Automatizaciones básicas mediante n8n.
* API REST.
* Interfaz web en React.

No forman parte del alcance del MVP:

* Docker.
* Kubernetes.
* Microservicios.
* Facturación electrónica.
* Pagos en línea.
* Múltiples bodegas.
* Gestión de transportistas.
* Auditorías avanzadas.
* Sistemas complejos de permisos.

---

# Resumen Final

El proyecto TechSupply SCM se desarrolla siguiendo una arquitectura modular basada en servicios, donde Node.js es responsable de la lógica de negocio, Python del cálculo de rutas mediante el algoritmo A* y n8n de la automatización de eventos.

La estrategia adoptada prioriza la implementación de la arquitectura y las reglas de negocio antes del desarrollo del frontend, con el objetivo de reducir riesgos de integración y garantizar un sistema estable, escalable y fácilmente mantenible.

Al momento de presentar este cronograma, el proyecto cuenta con aproximadamente un **55% de avance**, encontrándose el backend prácticamente finalizado y listo para integrar el algoritmo A*, las automatizaciones y la interfaz de usuario.
