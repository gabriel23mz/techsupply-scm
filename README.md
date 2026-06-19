# TechSupply SCM - Backend

Sistema de gestión de cadena de suministro (Supply Chain Management) desarrollado como proyecto académico para la asignatura de Inteligencia Artificial.

## Descripción

TechSupply SCM es una plataforma orientada a la gestión de operaciones logísticas y de abastecimiento de una distribuidora tecnológica. El sistema se encuentra dividido en dos módulos principales:

* **Inbound (Grupo 1):** Gestión de compras e inventario.
* **Outbound (Grupo 2):** Gestión de clientes, pedidos, despachos y optimización de rutas.

Ambos módulos comparten una misma base de datos y mantienen una coordinación sobre las entidades comunes del sistema. Sin embargo, cada equipo desarrolla de forma independiente la lógica de negocio y funcionalidades correspondientes a su módulo.

---

## Tecnologías Utilizadas

### Backend

* Node.js
* Express.js
* Sequelize ORM
* MySQL

### Inteligencia Artificial

* Python
* Algoritmo A* para optimización de rutas

### Automatización

* n8n

### Frontend (Próximamente)

* React

---

## Arquitectura General

```text
Frontend (React)
        │
        ▼
Backend (Node.js + Express)
        │
        ▼
MySQL Database
        │
        ├── Módulo Inbound
        │     ├── Proveedores
        │     ├── Órdenes de Compra
        │     ├── Ingresos de Inventario
        │     └── Control de Stock
        │
        └── Módulo Outbound
              ├── Clientes
              ├── Pedidos
              ├── Despachos
              ├── Rutas
              └── Optimización A*
```

---

## Modelo de Datos

Actualmente el proyecto cuenta con un esquema completo de base de datos implementado mediante Sequelize.

### Catálogos

* Usuario
* Categoría
* Producto
* Ubicación

### Módulo Outbound (Grupo 2)

* Cliente
* Pedido
* DetallePedido
* Ruta
* Despacho

### Módulo Inbound (Grupo 1)

* Proveedor
* OrdenCompra
* DetalleOrdenCompra
* IngresoInventario
* DetalleIngreso

---

## Estado Actual del Proyecto

### Completado

* Estructura inicial del proyecto
* Configuración de Express
* Configuración de Sequelize
* Conexión con MySQL
* Diseño y modelado de la base de datos
* Implementación de todos los modelos
* Relaciones entre entidades
* Sincronización y validación del esquema

### En Desarrollo

* CRUD de Ubicaciones
* CRUD de Clientes
* CRUD de Rutas
* CRUD de Pedidos
* CRUD de Despachos

### Próximamente

* Integración del algoritmo A*
* Automatizaciones mediante n8n
* Desarrollo del frontend en React

---

## Instalación

Clonar el repositorio:

```bash
git clone <url-del-repositorio>
```

Instalar dependencias:

```bash
npm install
```

Configurar las variables de entorno:

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Ejecutar el proyecto:

```bash
npm run dev
```

---

## Equipo de Desarrollo

Proyecto académico desarrollado para la asignatura de Inteligencia Artificial.

Universidad: ESPAM MFL

Carrera: Computación

Año: 2026

---

## Licencia

Proyecto desarrollado con fines educativos y académicos.
