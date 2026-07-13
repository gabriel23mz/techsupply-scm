# TechSupply SCM
## Documentación Técnica del Proyecto

**Versión:** 2.0 (MVP Funcional)

---

# Descripción

TechSupply SCM es un sistema de Supply Chain Management (SCM) desarrollado como proyecto académico para la asignatura de Inteligencia Artificial de la carrera de Computación.

El proyecto se divide en dos dominios:

- Inbound (Grupo 1)
- Outbound (Grupo 2)

Esta documentación corresponde al módulo Outbound.

---

# Objetivo de la Documentación

Esta documentación constituye la referencia oficial del proyecto y describe:

- Arquitectura general.
- Backend.
- Frontend.
- Servicio Python.
- API.
- Integraciones.
- Estado del proyecto.

---

# Arquitectura General

                 Frontend React
                        │
                        ▼
               Backend Node.js
                        │
        ┌───────────────┴────────────────┐
        ▼                                ▼
 Servicio IA (Python)            PostgreSQL (Supabase)
        │
        ▼
      OSRM

---

# Estado Actual

El sistema implementa completamente el flujo principal del módulo Outbound.

Módulos implementados:

- Dashboard
- Clientes
- Pedidos
- Workspace
- Ubicaciones
- Rutas
- Centro Logístico
- Despachos
- Autenticación

---

# Organización

```text
docs/
├── README.md
├── 01-general/
├── 02-backend/
├── 03-python/
├── 04-frontend/
├── 05-api/
├── 06-arquitectura/
└── 99-historico/
```

---

# Versión

**Versión funcional:** MVP Estable
