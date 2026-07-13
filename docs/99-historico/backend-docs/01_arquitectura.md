# Resumen Ejecutivo del Proyecto (Versión Definitiva)

## Nombre Provisional

TechSupply SCM

Sistema Maestro de Gestión de Suministros para una empresa distribuidora de productos tecnológicos.

---

## Objetivo General

Diseñar un Supply Chain Manager donde n8n actúe como centro de mando para automatizar procesos de logística de entrada (Inbound) y logística de salida (Outbound).

---

## Tecnologías

### Frontend

* React
* Bootstrap
* JavaScript

### Backend

* Node.js
* Express

### ORM

* Sequelize

### Base de Datos

* MySQL

### Automatización

* n8n

### Inteligencia Artificial

* Python

---

## Arquitectura General

```text
React
↓
API REST
↓
Node.js + Express
↓
Sequelize
↓
MySQL
```

Integraciones:

```text
Node.js
↓
Python
```

```text
Node.js
↓
n8n
```

---

## Alcance MVP

El proyecto será desarrollado como un Producto Mínimo Viable (MVP) enfocado exclusivamente en los requerimientos solicitados por el docente.

Se implementarán únicamente los módulos necesarios para demostrar:

* Gestión de inventario.
* Gestión de proveedores.
* Gestión de órdenes de compra.
* Control de ingresos al almacén.
* Gestión de clientes.
* Procesamiento de pedidos.
* Coordinación de despachos.
* Gestión de rutas.
* Optimización de rutas mediante A*.
* Automatizaciones mediante n8n.

No forman parte del alcance:

* Facturación.
* Pagos.
* Gestión de vehículos.
* Gestión de transportistas.
* Gestión de sucursales.
* Gestión de múltiples almacenes.
* Microservicios.
* Arquitecturas distribuidas.
* Chatbots.
* Redes neuronales complejas.
* Algoritmos avanzados de optimización.
* Despliegues empresariales.

---

## Base de Datos Compartida

Ambos grupos trabajarán sobre una misma base de datos MySQL.

```text
Grupo 1 (Inbound)
        │
        ▼
      MySQL
        ▲
        │
Grupo 2 (Outbound)
```

Ambos sistemas serán desarrollados de forma independiente, manteniendo repositorios, backend y frontend separados.

La integración entre ambos proyectos se realizará mediante una base de datos MySQL compartida, permitiendo el intercambio de información sin acoplar directamente las aplicaciones.

---

# Grupo 1 — Logística de Entrada (Inbound)

## Responsabilidades

* Gestión de proveedores.
* Gestión de órdenes de compra.
* Control de ingresos al almacén.
* Automatización de alertas de stock bajo.
* Flujos de aprobación mediante n8n.

## Inteligencia Artificial

Python + Regresión Lineal

### Objetivos

* Predecir demanda de productos.
* Detectar posibles faltantes de inventario.
* Recomendar abastecimiento futuro.

### Fuente de Datos

La regresión lineal utilizará información histórica de ventas proveniente de los pedidos y detalles de pedido registrados en el módulo Outbound.

Con base en dichos datos se estimará la demanda futura de productos para apoyar la toma de decisiones relacionadas con abastecimiento y compras.

### Flujo Principal

```text
Stock bajo
↓
n8n detecta
↓
Genera alerta
↓
Orden de compra
↓
Aprobación
↓
Proveedor
↓
Ingreso al almacén
↓
Actualización de stock
```

---

# Grupo 2 — Logística de Salida (Outbound)

## Responsabilidades

* Gestión de clientes.
* Procesamiento de pedidos.
* Coordinación de despachos.
* Gestión de rutas.
* Notificaciones postventa.

## Inteligencia Artificial

Python + Algoritmo A*

### Objetivos

* Optimizar rutas de despacho.
* Calcular el camino óptimo entre la bodega y la ubicación del cliente.
* Reducir la distancia recorrida.
* Reducir el tiempo estimado de entrega.

### Implementación

El algoritmo A* trabajará sobre un grafo de ubicaciones donde las ciudades o zonas de entrega actuarán como nodos.

Las rutas almacenadas en la base de datos representarán las conexiones entre dichos nodos, permitiendo encontrar caminos óptimos para los despachos.

### Flujo Principal

```text
Cliente realiza pedido
↓
Validación de stock
↓
Generación de despacho
↓
A* calcula ruta óptima
↓
n8n envía notificación
↓
Seguimiento postventa
```

---

## Lo que realmente debes aprender

Ya tienes conocimientos base en:

* Node.js
* Express
* Sequelize
* MySQL
* CRUD
* APIs REST

Debes reforzar:

* React
* React Router
* Fetch API o Axios
* Integración Node ↔ Python
* Integración Node ↔ n8n
* Manejo de estados en React
* Consumo de APIs REST desde React

---

## Lo que NO es prioridad

* Docker
* Kubernetes
* Microservios
* PostgreSQL
* Algoritmos genéticos
* Redes neuronales
* Ontologías
* Chatbots
* Arquitecturas complejas
* Despliegues empresariales
* Sistemas distribuidos

---

## Resumen en una frase

Construir un sistema de gestión de suministros para una distribuidora tecnológica utilizando React, Node.js, Express, Sequelize y MySQL, donde n8n automatiza procesos logísticos, el Grupo 1 gestiona el abastecimiento mediante predicción de demanda y el Grupo 2 gestiona pedidos, despachos y rutas optimizadas utilizando el algoritmo A*.
