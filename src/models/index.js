import Usuario from './Usuario.js';

import Categoria from './Categoria.js';
import Producto from './Producto.js';

import Ubicacion from './Ubicacion.js';
import Ruta from './Ruta.js';

import Cliente from './Cliente.js';
import Pedido from './Pedido.js';
import DetallePedido from './DetallePedido.js';
import Despacho from './Despacho.js';

import Proveedor from './Proveedor.js';
import OrdenCompra from './OrdenCompra.js';
import DetalleOrdenCompra from './DetalleOrdenCompra.js';
import IngresoInventario from './IngresoInventario.js';
import DetalleIngreso from './DetalleIngreso.js';

//
// ======================================================
// CATÁLOGOS
// ======================================================
//

//
// Categoria -> Producto
//
Categoria.hasMany(Producto, {
  foreignKey: 'categoria_id',
});

Producto.belongsTo(Categoria, {
  foreignKey: 'categoria_id',
});

//
// ======================================================
// UBICACIONES Y RUTAS
// ======================================================
//

//
// Ubicacion -> Cliente
//
Ubicacion.hasMany(Cliente, {
  foreignKey: 'ubicacion_id',
});

Cliente.belongsTo(Ubicacion, {
  foreignKey: 'ubicacion_id',
});

//
// Ubicacion -> Ruta
//
Ubicacion.hasMany(Ruta, {
  as: 'rutasOrigen',
  foreignKey: 'origen_id',
});

Ubicacion.hasMany(Ruta, {
  as: 'rutasDestino',
  foreignKey: 'destino_id',
});

Ruta.belongsTo(Ubicacion, {
  as: 'origen',
  foreignKey: 'origen_id',
});

Ruta.belongsTo(Ubicacion, {
  as: 'destino',
  foreignKey: 'destino_id',
});

//
// ======================================================
// OUTBOUND (GRUPO 2)
// Clientes, Pedidos, Despachos y Optimización de Rutas
// ======================================================
//

//
// Cliente -> Pedido
//
Cliente.hasMany(Pedido, {
  foreignKey: 'cliente_id',
});

Pedido.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
});

//
// Usuario -> Pedido
//
Usuario.hasMany(Pedido, {
  foreignKey: 'usuario_id',
});

Pedido.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
});

//
// Pedido -> DetallePedido
//
Pedido.hasMany(DetallePedido, {
  foreignKey: 'pedido_id',
});

DetallePedido.belongsTo(Pedido, {
  foreignKey: 'pedido_id',
});

//
// Producto -> DetallePedido
//
Producto.hasMany(DetallePedido, {
  foreignKey: 'producto_id',
});

DetallePedido.belongsTo(Producto, {
  foreignKey: 'producto_id',
});

//
// Pedido -> Despacho
//
Pedido.hasMany(Despacho, {
  foreignKey: 'pedido_id',
});

Despacho.belongsTo(Pedido, {
  foreignKey: 'pedido_id',
});

//
// ======================================================
// INBOUND (GRUPO 1)
// Compras e Inventario
// ======================================================
//

//
// Proveedor -> OrdenCompra
//
Proveedor.hasMany(OrdenCompra, {
  foreignKey: 'proveedor_id',
});

OrdenCompra.belongsTo(Proveedor, {
  foreignKey: 'proveedor_id',
});

//
// Usuario -> OrdenCompra
//
Usuario.hasMany(OrdenCompra, {
  foreignKey: 'usuario_id',
});

OrdenCompra.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
});

//
// OrdenCompra -> DetalleOrdenCompra
//
OrdenCompra.hasMany(DetalleOrdenCompra, {
  foreignKey: 'orden_compra_id',
});

DetalleOrdenCompra.belongsTo(OrdenCompra, {
  foreignKey: 'orden_compra_id',
});

//
// Producto -> DetalleOrdenCompra
//
Producto.hasMany(DetalleOrdenCompra, {
  foreignKey: 'producto_id',
});

DetalleOrdenCompra.belongsTo(Producto, {
  foreignKey: 'producto_id',
});

//
// OrdenCompra -> IngresoInventario
//
OrdenCompra.hasMany(IngresoInventario, {
  foreignKey: 'orden_compra_id',
});

IngresoInventario.belongsTo(OrdenCompra, {
  foreignKey: 'orden_compra_id',
});

//
// Usuario -> IngresoInventario
//
Usuario.hasMany(IngresoInventario, {
  foreignKey: 'usuario_id',
});

IngresoInventario.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
});

//
// IngresoInventario -> DetalleIngreso
//
IngresoInventario.hasMany(DetalleIngreso, {
  foreignKey: 'ingreso_inventario_id',
});

DetalleIngreso.belongsTo(IngresoInventario, {
  foreignKey: 'ingreso_inventario_id',
});

//
// Producto -> DetalleIngreso
//
Producto.hasMany(DetalleIngreso, {
  foreignKey: 'producto_id',
});

DetalleIngreso.belongsTo(Producto, {
  foreignKey: 'producto_id',
});

//
// ======================================================
// EXPORTACIÓN
// ======================================================
//

const db = {
  Usuario,

  Categoria,
  Producto,

  Ubicacion,
  Ruta,

  Cliente,
  Pedido,
  DetallePedido,
  Despacho,

  Proveedor,
  OrdenCompra,
  DetalleOrdenCompra,
  IngresoInventario,
  DetalleIngreso,
};

export default db;
