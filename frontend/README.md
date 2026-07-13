# TechSupply SCM Frontend

Frontend del módulo **Outbound** de **TechSupply SCM**, desarrollado con **React** y **Vite** como parte del proyecto académico de Inteligencia Artificial.

La aplicación implementa la interfaz completa para la gestión de la logística de salida de una distribuidora de productos tecnológicos, integrándose con el backend Node.js, el servicio de optimización logística desarrollado en Python y los servicios de automatización mediante n8n.

---

# Tecnologías

- React
- Vite
- React Router DOM
- Axios
- Bootstrap
- Bootstrap Icons
- React Toastify
- Leaflet
- OpenStreetMap (OSM)

---

# Arquitectura

El proyecto sigue una arquitectura modular orientada a dominios funcionales.

```text
src
│
├── app
├── assets
├── shared
├── modules
└── main.jsx
```

Cada módulo concentra sus propios componentes, páginas, servicios y lógica de negocio, mientras que los componentes reutilizables, layouts, hooks, estilos y utilidades se encuentran dentro del directorio **shared**.

Esta organización permite mantener una alta cohesión entre funcionalidades y facilita la escalabilidad del sistema.

---

# Módulos implementados

Actualmente el frontend implementa completamente el flujo operativo del módulo Outbound.

### Dashboard

- Indicadores operativos en tiempo real
- Actividad reciente
- Accesos rápidos
- Alertas operativas
- Información consolidada del sistema

---

### Clientes

- Gestión completa de clientes
- Búsqueda
- Filtros
- Validaciones
- Activación y desactivación

---

### Pedidos

- Gestión completa de pedidos
- Estados operativos
- Workspace de edición
- Gestión de productos
- Finalización del pedido

---

### Centro de Operaciones Logísticas

- Consulta de pedidos disponibles
- Generación automática de jornadas
- Visualización de jornadas
- Seguimiento operativo
- Inicio y finalización de rutas
- Gestión de entregas
- Confirmaciones inteligentes
- Resultados de planificación

---

### Rutas

Implementa tres áreas principales:

- Mapa general de jornadas
- Catálogo de rutas
- Consulta de camiones

Incluye:

- Visualización de mapas mediante Leaflet
- Seguimiento de camiones
- Consulta de rutas
- Registro de nuevas rutas
- Cálculo automático de distancia vial
- Consulta de disponibilidad de camiones

---

### Ubicaciones

- Gestión de ubicaciones
- Selección visual mediante mapa
- Obtención automática de coordenadas
- Validaciones geográficas

---

### Despachos

- Consulta histórica
- Seguimiento
- Estados
- Visualización de rutas
- Resumen operativo

---

# Características implementadas

El frontend incorpora:

- Arquitectura modular.
- Sistema de autenticación local.
- Layout reutilizable.
- Sidebar dinámico.
- Topbar dinámico.
- Dashboard conectado al backend.
- Navegación protegida.
- Servicios desacoplados mediante Axios.
- ConfirmDialog reutilizable.
- Toasts globales.
- Validaciones en tiempo real.
- Formularios inteligentes.
- Paginación.
- Mapas interactivos.
- Visualización de rutas.
- Seguimiento de jornadas.
- Integración completa con Bootstrap.
- Diseño responsive.
- Variables globales CSS.
- Componentes reutilizables.

---

# Instalación

Instalar dependencias:

```bash
npm install
```

Iniciar el proyecto:

```bash
npm run dev
```

---

# Variables de entorno

Crear un archivo `.env`.

Ejemplo:

```env
VITE_API_URL=http://localhost:3000/api

VITE_ROUTING_API_URL=https://router.project-osrm.org
```

---

# Backend

El frontend consume la API REST desarrollada para TechSupply SCM Outbound.

Actualmente integra los siguientes servicios:

- Autenticación
- Usuarios
- Clientes
- Productos
- Categorías
- Pedidos
- Detalles de Pedido
- Ubicaciones
- Rutas
- Camiones
- Jornadas de Reparto
- Despachos

Además consume:

- Servicio Python para optimización logística mediante metaheurísticas.
- OpenStreetMap y OSRM para cálculo y visualización de rutas.
- Automatizaciones mediante n8n.

---

# Estado actual del proyecto

**Versión actual:** MVP Funcional.

El sistema implementa completamente el flujo principal del proceso Outbound.

Las siguientes etapas del desarrollo estarán orientadas principalmente a:

- Optimización del código.
- Refactorización interna.
- Mejoras de experiencia de usuario.
- Implementación de control de acceso por roles.
- Pruebas finales del sistema.
