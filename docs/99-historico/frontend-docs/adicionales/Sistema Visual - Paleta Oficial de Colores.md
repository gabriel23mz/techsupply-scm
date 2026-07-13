# Sistema Visual - Paleta Oficial de Colores

**Proyecto:** TechSupply SCM
**Versión:** 1.0

---

# Objetivo

Definir la paleta oficial de colores del sistema para garantizar una identidad visual consistente en todos los módulos del frontend.

Todos los componentes deberán utilizar esta paleta mediante variables globales, evitando el uso de colores codificados directamente (`hardcoded`) dentro de los componentes.

---

# Principios del Diseño

La interfaz de TechSupply SCM debe transmitir:

* Profesionalismo
* Tecnología
* Confianza
* Organización
* Limpieza visual
* Facilidad de lectura durante largas jornadas de trabajo

La identidad visual estará basada en tonos azules acompañados de una escala neutra de grises.

---

# Paleta Principal

| Uso            | Color            | Código    |
| -------------- | ---------------- | --------- |
| Primario       | Azul Corporativo | `#1E3A8A` |
| Primario Hover | Azul Medio       | `#2563EB` |
| Primario Claro | Azul Suave       | `#60A5FA` |

---

# Colores de Fondo

| Uso           | Color          | Código    |
| ------------- | -------------- | --------- |
| Fondo General | Gris Muy Claro | `#F8FAFC` |
| Tarjetas      | Blanco         | `#FFFFFF` |
| Bordes        | Gris Claro     | `#E5E7EB` |

---

# Tipografía

| Uso              | Color       | Código    |
| ---------------- | ----------- | --------- |
| Texto Principal  | Gris Oscuro | `#1F2937` |
| Texto Secundario | Gris Medio  | `#6B7280` |

---

# Estados del Sistema

| Estado      | Color    | Código    |
| ----------- | -------- | --------- |
| Éxito       | Verde    | `#22C55E` |
| Advertencia | Amarillo | `#F59E0B` |
| Error       | Rojo     | `#EF4444` |
| Información | Celeste  | `#0EA5E9` |

---

# Lineamientos de Uso

* El azul corporativo será el color principal de la aplicación.
* Los botones principales utilizarán el color primario.
* El fondo general utilizará siempre el gris muy claro.
* Las tarjetas serán blancas para maximizar el contraste.
* Los estados utilizarán exclusivamente los colores definidos en esta paleta.
* No deberán utilizarse colores adicionales sin una actualización formal de esta documentación.

---

# Estrategia de Implementación

La paleta será implementada mediante variables CSS globales.

Todos los componentes deberán consumir estas variables, evitando declarar colores directamente dentro del código.

De esta manera, cualquier cambio futuro en la identidad visual del sistema requerirá modificar únicamente el archivo de variables globales, manteniendo el resto del proyecto sin cambios.



