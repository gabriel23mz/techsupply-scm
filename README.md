# TechSupply SCM - Backend

Sistema de gestión de cadena de suministro (Supply Chain Management) desarrollado como proyecto académico para la asignatura de Inteligencia Artificial.

## Descripción

TechSupply SCM es una plataforma orientada a la gestión de operaciones logísticas y comerciales de una distribuidora tecnológica. El proyecto está dividido en dos módulos principales que comparten una misma base de datos:

* **Inbound (Grupo 1):** Gestión de proveedores, compras e ingresos de inventario.
* **Outbound (Grupo 2):** Gestión de clientes, pedidos, despachos y optimización de rutas.

El presente repositorio corresponde al desarrollo del módulo **Outbound**, cuya arquitectura fue diseñada siguiendo principios de desacoplamiento y responsabilidad única para facilitar su mantenimiento y futura integración con componentes de Inteligencia Artificial.

---

# Tecnologías Utilizadas

## Backend

* Node.js
* Express.js
* Sequelize ORM
* MySQL

## Inteligencia Artificial

* Python
* FastAPI
* Algoritmo A*

## Automatización

* n8n (integración preparada)

## Frontend

* React (pendiente de desarrollo)

---

# Arquitectura del Backend

La lógica del sistema se encuentra organizada en capas, separando controladores, servicios y persistencia.

```text
Cliente HTTP
      │
      ▼
Controllers
      │
      ▼
Servicios de Negocio
      │
      ▼
Servicios Especializados
      │
      ├───────────────┐
      ▼               ▼
Persistencia      Integraciones
      │               │
      ▼               ▼
  Sequelize       Python / n8n
      │
      ▼
    MySQL
```

El módulo de logística implementa una arquitectura basada en un servicio orquestador (`logistica.service.js`) que coordina la creación y administración de los despachos, manteniendo desacopladas las responsabilidades de persistencia, cálculo de rutas y automatizaciones.

---

# Arquitectura del Módulo de Logística

```text
POST /despachos
        │
        ▼
Controller
        │
        ▼
logistica.service.js
        │
        ├───────────────┐
        ▼               ▼
python.service.js   despacho.service.js
        │               │
        └───────┬───────┘
                ▼
          n8n.service.js
                │
                ▼
            Response
```

Esta arquitectura desacopla completamente la lógica de negocio del cálculo de rutas y las automatizaciones. El servicio `logistica.service.js` actúa como orquestador, mientras que `python.service.js` encapsula la comunicación con el servicio FastAPI encargado de ejecutar el algoritmo A*. Gracias a esta separación, futuras mejoras en el algoritmo o nuevas integraciones podrán incorporarse sin afectar el resto del backend.

---

# Modelo de Datos

El proyecto implementa mediante Sequelize las principales entidades del módulo Outbound.

## Catálogos

* Usuario
* Categoría
* Producto
* Ubicación

## Gestión Comercial

* Cliente
* Pedido
* DetallePedido

## Gestión Logística

* Ruta
* Despacho

Las relaciones entre entidades se encuentran completamente implementadas y sincronizadas con la base de datos MySQL.

---

# Estado Actual del Proyecto

## Implementado

* Configuración completa del backend con Express y Sequelize.
* Conexión con MySQL.
* Modelado completo de la base de datos.
* Implementación de todos los modelos del módulo Outbound.
* Relaciones entre entidades.
* CRUD completo para:

  * Usuarios
  * Categorías
  * Productos
  * Ubicaciones
  * Clientes
  * Rutas
  * Pedidos
  * Detalles de Pedido
  * Despachos

* Validaciones de negocio.
* Gestión automática del stock.
* Cálculo automático del total de pedidos.
* Gestión del ciclo de vida de los pedidos.
* Gestión del ciclo de vida de los despachos.
* Refactorización del módulo de despachos mediante una arquitectura desacoplada basada en servicios especializados.
* Servicio orquestador de logística.
* Integración completa entre Node.js y Python mediante FastAPI.
* Implementación del algoritmo A* para cálculo de rutas óptimas.
* Arquitectura desacoplada para el módulo de Inteligencia Artificial.
* Adaptador para integración con n8n.
* Endpoint para consultar pedidos disponibles para despacho.
* Pruebas funcionales realizadas mediante Thunder Client.

---

## En Desarrollo

* Desarrollo del frontend del módulo Outbound.
* Diseño de la interfaz para la gestión de pedidos y despachos.
* Diseño del flujo de interacción entre los procesos comerciales y logísticos.

---

## Pendiente

* Implementación del panel de gestión de pedidos.
* Implementación del panel de gestión de despachos.
* Integración de automatizaciones mediante n8n.
* Mejoras y ampliaciones funcionales del sistema.

---

# Instalación

Clonar el repositorio:

```bash
git clone <url-del-repositorio>
```

Instalar las dependencias del backend:

```bash
npm install
```

Crear el entorno virtual del servicio de Inteligencia Artificial:

```bash
cd python

python -m venv .venv

.\.venv\Scripts\activate

pip install -r requirements.txt

deactivate
```

Configurar las variables de entorno:

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

PYTHON_API=http://127.0.0.1:8000
```

Iniciar el proyecto:

```bash
npm run dev
```

El comando anterior inicia automáticamente:

- Backend Express.
- Servicio FastAPI del algoritmo A*.

Gracias al uso de `concurrently`, ambos servicios se ejecutan de forma simultánea durante el desarrollo.

---

# Próximos Objetivos

Las siguientes etapas del proyecto contemplan:

1. Diseñar e implementar el frontend del módulo Outbound.
2. Construir la interfaz para la gestión de pedidos.
3. Construir la interfaz para la gestión de despachos.
4. Incorporar automatizaciones mediante n8n.
5. Continuar con mejoras evolutivas del sistema.


---

# Equipo de Desarrollo

Proyecto académico desarrollado para la asignatura de Inteligencia Artificial.

**Universidad:** ESPAM MFL

**Carrera:** Computación

**Año:** 2026

---

# Licencia

Proyecto desarrollado con fines educativos y académicos.



