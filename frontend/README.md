# TechSupply SCM Frontend

Frontend del módulo **Outbound** de **TechSupply SCM**, desarrollado con React y Vite como parte del proyecto académico de Inteligencia Artificial.

El sistema proporciona la interfaz de usuario para la gestión de la logística de salida, permitiendo administrar pedidos, clientes, ubicaciones, rutas y operaciones de despacho mediante una arquitectura modular y escalable.

---

## Tecnologías

* React
* Vite
* React Router DOM
* Axios
* Bootstrap
* Bootstrap Icons
* React Toastify

---

## Arquitectura

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

Cada módulo concentra sus propios componentes, páginas, servicios y recursos específicos, mientras que los elementos reutilizables permanecen dentro del directorio **shared**.

Esta organización facilita el mantenimiento del código y permite que nuevos módulos puedan incorporarse sin afectar el resto de la aplicación.

---

## Estado actual del proyecto

Actualmente el frontend cuenta con:

* Arquitectura base del proyecto.
* Sistema de navegación mediante React Router.
* Layout principal reutilizable.
* Sidebar de navegación.
* Topbar dinámico.
* Footer reutilizable.
* Sistema global de estilos mediante variables CSS.
* Dashboard completamente implementado a nivel de interfaz.
* Configuración de Axios para comunicación con el backend.
* Variables de entorno mediante Vite.

Por el momento el Dashboard utiliza información simulada (Mock Data). La integración con la API REST se realizará durante la implementación de los módulos funcionales.

---

## Próximos módulos

La implementación continuará siguiendo el flujo operativo del sistema:

1. Gestión de Pedidos
2. Workspace de Detalles de Pedido
3. Centro de Operaciones Logísticas
4. Gestión de Clientes
5. Gestión de Ubicaciones
6. Gestión de Rutas
7. Gestión de Despachos

---

## Instalación

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

Ejemplo:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Backend

Este frontend consume la API REST desarrollada para TechSupply SCM Outbound.

El backend proporciona los servicios de:

* Clientes
* Productos
* Pedidos
* Detalles de Pedido
* Ubicaciones
* Rutas
* Despachos
* Integración con Python para cálculo de rutas mediante el algoritmo A*
* Automatizaciones mediante n8n

---

## Estado del desarrollo

**Versión actual:** Desarrollo inicial del frontend.

La prioridad actual consiste en implementar completamente el flujo operativo principal del sistema antes de incorporar funcionalidades adicionales.
