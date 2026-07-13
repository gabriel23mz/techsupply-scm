# TechSupply SCM - Backend

Backend del módulo **Outbound** de **TechSupply SCM**, desarrollado como proyecto académico para la asignatura de Inteligencia Artificial.

El sistema implementa la lógica de negocio para la gestión completa de la logística de salida de una distribuidora de productos tecnológicos, integrando procesos comerciales, planificación logística, optimización mediante Inteligencia Artificial y seguimiento operativo.

---

# Descripción

TechSupply SCM se divide en dos módulos que comparten una misma base de datos:

- **Inbound (Grupo 1):** Gestión de proveedores, órdenes de compra e ingresos de inventario.
- **Outbound (Grupo 2):** Gestión de clientes, pedidos, rutas, jornadas de reparto, despachos y distribución.

Este repositorio corresponde al desarrollo del módulo **Outbound**.

Actualmente el backend implementa completamente el flujo operativo principal del sistema y se encuentra integrado con el frontend desarrollado en React.

---

# Tecnologías

## Backend

- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL
- Supabase

## Inteligencia Artificial

- Python
- FastAPI
- Metaheurística de Colonia de Hormigas (CVRP)
- Algoritmo A*
- OSRM

## Frontend

- React
- Vite

## Automatización

- n8n (arquitectura preparada)

---

# Arquitectura General

```text
Cliente HTTP
        │
        ▼
 Controllers
        │
        ▼
 Servicios de negocio
        │
        ├──────────────────────────┐
        ▼                          ▼
 Persistencia                Servicios externos
        │                          │
        ▼                          ▼
 PostgreSQL                 Python / n8n / OSRM
        │
        ▼
     Supabase
```

La arquitectura se encuentra desacoplada mediante controladores, servicios y modelos, permitiendo que cada responsabilidad permanezca aislada y facilite futuras ampliaciones.

---

# Arquitectura del módulo logístico

Actualmente la operación logística gira alrededor de la entidad **Jornada de Reparto**, la cual representa una planificación completa realizada para un camión.

```text
Pedidos LISTOS PARA DESPACHO
                │
                ▼
      JornadaRepartoService
                │
                ▼
     Python Metaheurística
                │
                ▼
      Jornada de reparto
                │
        ┌───────┴────────┐
        ▼                ▼
   Despachos        Ruta General
        │
        ▼
 Automatizaciones (n8n)
```

Cada jornada agrupa múltiples despachos, mantiene el recorrido completo, la posición actual del vehículo y el estado operativo de la distribución.

---

# Modelo de Datos

## Catálogos

- Usuarios
- Categorías
- Productos
- Ubicaciones
- Rutas
- Camiones

## Gestión Comercial

- Clientes
- Pedidos
- Detalles de Pedido

## Gestión Logística

- Jornadas de Reparto
- Despachos

Todas las entidades se encuentran modeladas mediante Sequelize y sincronizadas con PostgreSQL utilizando Supabase.

---

# Funcionalidades implementadas

## Gestión Comercial

- CRUD de clientes.
- CRUD de ubicaciones.
- CRUD de rutas.
- CRUD de categorías.
- CRUD de productos.
- CRUD de usuarios.
- Gestión completa de pedidos.
- Gestión de detalles de pedido.
- Control automático de inventario.
- Validaciones de negocio.

---

## Gestión Logística

- Generación automática de jornadas.
- Asignación automática de camiones.
- Creación automática de despachos.
- Persistencia de rutas.
- Estados operativos.
- Seguimiento de jornadas.
- Gestión de entregas.
- Pedidos no entregados.
- Cancelación de despachos.
- Consulta histórica.

---

## Inteligencia Artificial

- Comunicación Node ↔ Python mediante FastAPI.
- Metaheurística de Colonia de Hormigas para planificación logística.
- Algoritmo A* disponible para cálculo de caminos.
- Integración con OSRM para cálculo de geometrías y distancias reales.

---

## Seguridad

- Autenticación local.
- Hash de contraseñas mediante bcrypt.
- Login.
- Protección básica de rutas.
- Tokens de sesión.

---

# Estado actual del proyecto

## Implementado

- Backend completamente funcional.
- Frontend completamente integrado.
- PostgreSQL mediante Supabase.
- Arquitectura modular.
- Gestión comercial completa.
- Gestión logística completa.
- Dashboard conectado.
- Sistema de autenticación.
- Integración Node ↔ Python.
- Integración con mapas.
- Servicios preparados para automatización mediante n8n.

---

## En desarrollo

Las siguientes funcionalidades ya poseen la arquitectura preparada, pero aún requieren implementación completa:

- Automatizaciones mediante n8n.
- Notificaciones automáticas a clientes.
- Roles y permisos.
- Auditoría de operaciones.
- Mejoras de rendimiento.

---

# Instalación

Clonar el repositorio:

```bash
git clone <url-del-repositorio>
```

Instalar dependencias:

```bash
npm install
```

Configurar el servicio Python:

```bash
cd python

python -m venv .venv

.\.venv\Scripts\activate

pip install -r requirements.txt

deactivate
```

Crear el archivo `.env`:

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

SUPABASE_URL=
SUPABASE_KEY=

PYTHON_API=http://127.0.0.1:8000

AUTH_SECRET=
```

Iniciar el proyecto:

```bash
npm run dev
```

El comando ejecuta simultáneamente:

- Backend Express.
- Servicio Python (FastAPI).

---

# Estado del proyecto

**Versión actual:** MVP Funcional (Versión Base Estable)

El sistema implementa completamente el flujo principal del módulo Outbound.

Las siguientes iteraciones estarán enfocadas principalmente en:

- refactorización del backend;
- optimización del código;
- automatización mediante n8n;
- control de acceso por roles;
- pruebas integrales del sistema.

---

# Equipo de Desarrollo

Proyecto académico desarrollado para la asignatura de Inteligencia Artificial.

**Universidad:** ESPAM MFL

**Carrera:** Computación

**Año:** 2026

---

# Licencia

Proyecto desarrollado con fines educativos y académicos.