# 📌 DEFINICIÓN Y DISEÑO FINAL DE BASE DE DATOS

## Sistema de Gestión de Suministros (Supply Chain Manager)

### Versión 1.1 (Diseño Actualizado)

---

# 1. Objetivo del Proyecto

Desarrollar un Sistema de Gestión de Suministros para una empresa de productos tecnológicos donde:

* Grupo 1 gestione la Logística de Entrada (Inbound).
* Grupo 2 gestione la Logística de Salida (Outbound).
* n8n actúe como centro de automatización.
* React sea el frontend.
* Node.js + Express el backend.
* Sequelize el ORM.
* MySQL la base de datos principal.
* Python se utilice para algoritmos de IA.

---

# 2. Temática Definitiva

Empresa distribuidora de productos tecnológicos.

---

# 3. Criterios de Diseño

* Una sola empresa.
* Una sola base de datos compartida.
* Normalización hasta 3FN.
* Eliminación lógica.
* Integridad referencial con claves foráneas.
* Compatibilidad con Sequelize.

---

# 4. Eliminación Lógica

```sql
estado BOOLEAN DEFAULT TRUE
```

Aplica a todas las entidades principales.

---

# 5. Seguridad

```text
password_hash (bcrypt)
```

Nunca se almacena la contraseña en texto plano.

---

# 6. Módulo de Usuarios

## usuarios

```text
id
nombre
apellido
correo (UNIQUE)
password_hash
rol
estado
created_at
updated_at
```

Roles:

```text
ADMIN, COMPRAS, BODEGA, VENTAS, LOGISTICA
```

---

# 7. Catálogo de Productos

## categorias

```text
id
nombre
descripcion
estado
created_at
updated_at
```

## productos

```text
id
categoria_id (FK)
codigo (UNIQUE)
nombre
descripcion
precio_compra
precio_venta
stock_actual
stock_minimo
estado
created_at
updated_at
```

---

# 8. Proveedores

```text
id
nombre
ruc (UNIQUE)
telefono
correo
direccion
estado
created_at
updated_at
```

---

# 9. Clientes (ACTUALIZADO)

## clientes

```text
id
nombre
identificacion
telefono
correo
direccion
ubicacion_id (FK)
estado
created_at
updated_at
```

📌 Cambio importante:

* Se elimina `ciudad`
* Se reemplaza por `ubicacion_id`

---

# 10. Ubicaciones (NUEVA TABLA)

## ubicaciones

```text
id
nombre
estado
```

Ejemplo:

```text
Calceta
Chone
Tosagua
Portoviejo
Rocafuerte
```

---

# 11. Módulo Inbound

## ordenes_compra

```text
id
proveedor_id
usuario_id
fecha
estado
total
created_at
updated_at
```

Estados:

```text
PENDIENTE
APROBADA
RECHAZADA
RECIBIDA
```

## detalle_orden_compra

```text
id
orden_compra_id
producto_id
cantidad
precio_unitario
subtotal
```

## ingresos_inventario

```text
id
orden_compra_id
usuario_id
fecha_ingreso
observacion
created_at
updated_at
```

## detalle_ingreso

```text
id
ingreso_id
producto_id
cantidad
```

---

# 12. Módulo Outbound

## pedidos (ACTUALIZADO)

```text
id
cliente_id
usuario_id
fecha
estado
total
created_at
updated_at
```

## Estados pedidos (ACTUALIZADO)

```text
PENDIENTE
PREPARANDO
LISTO_PARA_DESPACHO
DESPACHADO
ENTREGADO
CANCELADO
```

---

## detalle_pedido

```text
id
pedido_id
producto_id
cantidad
precio_unitario
subtotal
```

---

## despachos (ACTUALIZADO MVP)

```text
id
pedido_id
estado
fecha_salida
fecha_entrega

ruta_json
distancia_total
tiempo_estimado
```

📌 Ejemplo:

```json
{
  "id": 10,
  "pedido_id": 15,
  "estado": "EN_TRANSITO",
  "ruta_json": ["Calceta", "Chone", "Portoviejo"],
  "distancia_total": 52,
  "tiempo_estimado": 35
}
```

---

# 🔗 Relación Pedidos - Despachos (ACTUALIZADO)

```text
Pedido 1 ─── N Despachos
```

Regla:

* Un pedido puede tener múltiples despachos.
* Solo uno puede finalizar en ENTREGADO.
* Los demás representan intentos fallidos.

```javascript
Pedido.hasMany(Despacho)
Despacho.belongsTo(Pedido)
```

---

# 13. RUTAS (REDISEÑO PARA A*)

## rutas (ACTUALIZADO)

```text
id
origen_id (FK ubicaciones)
destino_id (FK ubicaciones)
distancia_km
estado
```

📌 Ahora representa ARISTAS del grafo.

---

# 14. Modelo de Grafo

* ubicaciones = nodos
* rutas = aristas

Ejemplo:

```text
Calceta → Chone (18 km)
Calceta → Tosagua (12 km)
```

---

# 15. Flujo A* (ACTUALIZADO)

```text
Cliente → ubicacion_id
↓
Pedido
↓
Despacho (origen fijo: Calceta)
↓
Consulta rutas
↓
Construcción del grafo
↓
A*
↓
ruta_json + distancia + tiempo
```

---

# 16. IA

## Python - Regresión Lineal

* Predicción de demanda
* Stock futuro

## Python - A*

* Optimización de rutas
* Cálculo de caminos mínimos

---

# 17. n8n Automatización

* Alertas de stock
* Flujo de compras
* Notificación de despacho
* Postventa

---

# 18. Relaciones Actualizadas

```text
usuarios
├── ordenes_compra
├── ingresos_inventario
└── pedidos

categorias
└── productos

proveedores
└── ordenes_compra

clientes
└── pedidos

ubicaciones
└── clientes

ordenes_compra
├── detalle_orden_compra
└── ingresos_inventario

ingresos_inventario
└── detalle_ingreso

productos
├── detalle_orden_compra
├── detalle_ingreso
└── detalle_pedido

pedidos
├── detalle_pedido
└── despachos

rutas
└── grafo (A*)
```

---

# 19. Resumen Final

```text
usuarios
categorias
productos
proveedores
clientes
ubicaciones

ordenes_compra
detalle_orden_compra

ingresos_inventario
detalle_ingreso

pedidos
detalle_pedido

despachos

rutas
```

---

# 20. Estado del Diseño

Diseño actualizado a versión 1.1.

Cambios principales:

* Nuevo estado: LISTO_PARA_DESPACHO
* Despachos con ruta_json + métricas A*
* Nueva tabla ubicaciones
* Rutas convertidas en grafo (origen/destino FK)
* Clientes ahora usan ubicacion_id
* Separación formal de nodos y aristas

---
