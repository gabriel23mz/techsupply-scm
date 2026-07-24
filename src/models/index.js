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

import Camion from './Camion.js';
import JornadaReparto from './JornadaReparto.js';


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
  as: 'productos',
});

Producto.belongsTo(Categoria, {
  foreignKey: 'categoria_id',
  as: 'categoria',
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
  as: 'clientes',
});

Cliente.belongsTo(Ubicacion, {
  foreignKey: 'ubicacion_id',
  as: 'ubicacion',
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
  as: 'pedidos',
});

Pedido.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente',
});

//
// Usuario -> Pedido
//
Usuario.hasMany(Pedido, {
  foreignKey: 'usuario_id',
  as: 'pedidos',
});

Pedido.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

//
// Pedido -> DetallePedido
//
Pedido.hasMany(DetallePedido, {
  foreignKey: 'pedido_id',
  as: 'detalles',
});

DetallePedido.belongsTo(Pedido, {
  foreignKey: 'pedido_id',
  as: 'pedido',
});

//
// Producto -> DetallePedido
//
Producto.hasMany(DetallePedido, {
  foreignKey: 'producto_id',
  as: 'detallesPedido',
});

DetallePedido.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto',
});

//
// Pedido -> Despacho
//
Pedido.hasMany(Despacho, {
  foreignKey: 'pedido_id',
  as: 'despachos',
});

Despacho.belongsTo(Pedido, {
  foreignKey: 'pedido_id',
  as: 'pedido',
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
  as: 'ordenesCompra',
});

OrdenCompra.belongsTo(Proveedor, {
  foreignKey: 'proveedor_id',
  as: 'proveedor',
});

//
// Usuario -> OrdenCompra
//
Usuario.hasMany(OrdenCompra, {
  foreignKey: 'usuario_id',
  as: 'ordenesCompra',
});

OrdenCompra.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

//
// OrdenCompra -> DetalleOrdenCompra
//
OrdenCompra.hasMany(DetalleOrdenCompra, {
  foreignKey: 'orden_compra_id',
  as: 'detalles',
});

DetalleOrdenCompra.belongsTo(OrdenCompra, {
  foreignKey: 'orden_compra_id',
  as: 'ordenCompra',
});

//
// Producto -> DetalleOrdenCompra
//
Producto.hasMany(DetalleOrdenCompra, {
  foreignKey: 'producto_id',
  as: 'detallesOrdenCompra',
});

DetalleOrdenCompra.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto',
});

//
// OrdenCompra -> IngresoInventario
//
OrdenCompra.hasMany(IngresoInventario, {
  foreignKey: 'orden_compra_id',
  as: 'ingresosInventario',
});

IngresoInventario.belongsTo(OrdenCompra, {
  foreignKey: 'orden_compra_id',
  as: 'ordenCompra',
});

//
// Usuario -> IngresoInventario
//
Usuario.hasMany(IngresoInventario, {
  foreignKey: 'usuario_id',
  as: 'ingresosInventario',
});

IngresoInventario.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

//
// IngresoInventario -> DetalleIngreso
//
IngresoInventario.hasMany(DetalleIngreso, {
  foreignKey: 'ingreso_inventario_id',
  as: 'detalles',
});

DetalleIngreso.belongsTo(IngresoInventario, {
  foreignKey: 'ingreso_inventario_id',
  as: 'ingresoInventario',
});

//
// Producto -> DetalleIngreso
//
Producto.hasMany(DetalleIngreso, {
  foreignKey: 'producto_id',
  as: 'detallesIngreso',
});

DetalleIngreso.belongsTo(Producto, {
  foreignKey: 'producto_id',
  as: 'producto',
});

//
// Camion -> JornadaReparto
//
Camion.hasMany(JornadaReparto, {
  foreignKey: 'camion_id',
  as: 'jornadas',
});

JornadaReparto.belongsTo(Camion, {
  foreignKey: 'camion_id',
  as: 'camion',
});

//
// JornadaReparto -> Despacho
//
JornadaReparto.hasMany(Despacho, {
  foreignKey: 'jornada_reparto_id',
  as: 'despachos',
});

Despacho.belongsTo(JornadaReparto, {
  foreignKey: 'jornada_reparto_id',
  as: 'jornada',
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

  Camion,
  JornadaReparto,
};

export default db;
