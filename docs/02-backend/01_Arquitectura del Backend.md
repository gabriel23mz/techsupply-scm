# Arquitectura del Backend

El backend está desarrollado con Node.js, Express y Sequelize siguiendo una arquitectura por capas.

## Capas

- Controladores
- Servicios de negocio
- Modelos Sequelize
- Integraciones externas (Python, OSRM, n8n)
- PostgreSQL (Supabase)

## Principios

- Responsabilidad única.
- Desacoplamiento entre servicios.
- Integraciones encapsuladas.
- Respuestas uniformes mediante utilidades comunes.
