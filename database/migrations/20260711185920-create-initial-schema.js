'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    /*
     * =====================================================
     * 1. TABLAS PRINCIPALES SIN DEPENDENCIAS
     * =====================================================
     */

    await queryInterface.createTable('usuarios', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      apellido: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      correo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      rol: {
        type: DataTypes.ENUM(
          'ADMIN',
          'COMPRAS',
          'BODEGA',
          'VENTAS',
          'LOGISTICA',
        ),
        allowNull: false,
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('categorias', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });

    await queryInterface.createTable('ubicaciones', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      latitud: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },

      longitud: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });

    await queryInterface.createTable('proveedores', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      ruc: {
        type: DataTypes.STRING(13),
        allowNull: false,
        unique: true,
      },

      telefono: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      correo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },

      direccion: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('camiones', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      placa: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      descripcion: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      capacidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      estado: {
        type: DataTypes.ENUM(
          'EN_BODEGA',
          'EN_RUTA',
          'INACTIVO',
        ),
        allowNull: false,
        defaultValue: 'EN_BODEGA',
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    /*
     * =====================================================
     * 2. CATÁLOGOS Y UBICACIONES DEPENDIENTES
     * =====================================================
     */

    await queryInterface.createTable('productos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'categorias',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      codigo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      precio_compra: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      precio_venta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      stock_actual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      stock_minimo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },

      stock_maximo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('clientes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      identificacion: {
        type: DataTypes.STRING(13),
        allowNull: false,
        unique: true,
      },

      telefono: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      correo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },

      direccion: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      ubicacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ubicaciones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('rutas', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      origen_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ubicaciones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      destino_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ubicaciones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      distancia_km: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    /*
     * =====================================================
     * 3. OUTBOUND
     * =====================================================
     */

    await queryInterface.createTable('pedidos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      fecha_entrega: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      estado: {
        type: DataTypes.ENUM(
          'PENDIENTE',
          'PREPARANDO',
          'LISTO_PARA_DESPACHO',
          'DESPACHADO',
          'ENTREGADO',
          'CANCELADO',
          'REPROGRAMADO',
        ),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },

      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('jornadas_reparto', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      camion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'camiones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      fecha_salida: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      fecha_finalizacion: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      estado: {
        type: DataTypes.ENUM(
          'PLANIFICADA',
          'EN_RUTA',
          'FINALIZADA',
          'CANCELADA',
        ),
        allowNull: false,
        defaultValue: 'PLANIFICADA',
      },

      posicion_actual_orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      ruta_json: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      distancia_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      tiempo_estimado: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('detalle_pedido', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      pedido_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      producto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    });

    await queryInterface.createTable('despachos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      pedido_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      fecha_salida: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      fecha_entrega: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      jornada_reparto_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'jornadas_reparto',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      orden_entrega: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      fecha_estimada_entrega: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      estado: {
        type: DataTypes.ENUM(
          'PENDIENTE',
          'EN_TRANSITO',
          'ENTREGADO',
          'NO_ENTREGADO',
          'CANCELADO',
        ),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },

      ruta_json: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      distancia_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      tiempo_estimado: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    /*
     * =====================================================
     * 4. INBOUND
     * =====================================================
     */

    await queryInterface.createTable('ordenes_compra', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'proveedores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      estado: {
        type: DataTypes.ENUM(
          'PENDIENTE',
          'APROBADA',
          'RECIBIDA',
          'CANCELADA',
        ),
        allowNull: false,
        defaultValue: 'PENDIENTE',
      },

      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('detalle_orden_compra', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      orden_compra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ordenes_compra',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      producto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    });

    await queryInterface.createTable('ingresos_inventario', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      orden_compra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ordenes_compra',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      fecha_ingreso: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      observacion: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('detalle_ingreso', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      ingreso_inventario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ingresos_inventario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      producto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    });

    /*
     * =====================================================
     * 5. ÍNDICES ÚNICOS Y OPERATIVOS
     * =====================================================
     */

    await queryInterface.addIndex(
      'detalle_pedido',
      ['pedido_id', 'producto_id'],
      {
        unique: true,
        name: 'detalle_pedido_pedido_producto_unique',
      },
    );

    await queryInterface.addIndex(
      'detalle_orden_compra',
      ['orden_compra_id', 'producto_id'],
      {
        unique: true,
        name: 'detalle_orden_compra_orden_producto_unique',
      },
    );

    await queryInterface.addIndex(
      'detalle_ingreso',
      ['ingreso_inventario_id', 'producto_id'],
      {
        unique: true,
        name: 'detalle_ingreso_ingreso_producto_unique',
      },
    );

    await queryInterface.addIndex(
      'rutas',
      ['origen_id', 'destino_id'],
      {
        unique: true,
        name: 'rutas_origen_destino_unique',
      },
    );

    await queryInterface.addIndex(
      'rutas',
      ['estado'],
      {
        name: 'rutas_estado_idx',
      },
    );

    await queryInterface.addIndex(
      'pedidos',
      ['estado'],
      {
        name: 'pedidos_estado_idx',
      },
    );

    await queryInterface.addIndex(
      'pedidos',
      ['fecha_entrega'],
      {
        name: 'pedidos_fecha_entrega_idx',
      },
    );

    await queryInterface.addIndex(
      'pedidos',
      ['cliente_id'],
      {
        name: 'pedidos_cliente_idx',
      },
    );

    await queryInterface.addIndex(
      'jornadas_reparto',
      ['camion_id'],
      {
        name: 'jornadas_reparto_camion_idx',
      },
    );

    await queryInterface.addIndex(
      'jornadas_reparto',
      ['estado'],
      {
        name: 'jornadas_reparto_estado_idx',
      },
    );

    await queryInterface.addIndex(
      'jornadas_reparto',
      ['fecha'],
      {
        name: 'jornadas_reparto_fecha_idx',
      },
    );

    await queryInterface.addIndex(
      'despachos',
      ['jornada_reparto_id', 'orden_entrega'],
      {
        name: 'despachos_jornada_orden_idx',
      },
    );

    await queryInterface.addIndex(
      'despachos',
      ['pedido_id'],
      {
        name: 'despachos_pedido_idx',
      },
    );

    /*
     * =====================================================
     * 6. RESTRICCIONES CHECK
     * =====================================================
     */

    await queryInterface.addConstraint('camiones', {
      fields: ['capacidad'],
      type: 'check',
      name: 'camiones_capacidad_positive_check',
      where: {
        capacidad: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    await queryInterface.addConstraint('rutas', {
      fields: ['distancia_km'],
      type: 'check',
      name: 'rutas_distancia_positive_check',
      where: {
        distancia_km: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    await queryInterface.addConstraint('rutas', {
      fields: ['origen_id', 'destino_id'],
      type: 'check',
      name: 'rutas_origen_destino_diferentes_check',
      where: Sequelize.literal(
        '"origen_id" <> "destino_id"',
      ),
    });

    await queryInterface.addConstraint('productos', {
      fields: ['precio_compra'],
      type: 'check',
      name: 'productos_precio_compra_nonnegative_check',
      where: {
        precio_compra: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('productos', {
      fields: ['precio_venta'],
      type: 'check',
      name: 'productos_precio_venta_nonnegative_check',
      where: {
        precio_venta: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('productos', {
      fields: ['stock_actual'],
      type: 'check',
      name: 'productos_stock_actual_nonnegative_check',
      where: {
        stock_actual: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('productos', {
      fields: ['stock_minimo'],
      type: 'check',
      name: 'productos_stock_minimo_nonnegative_check',
      where: {
        stock_minimo: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('productos', {
      fields: ['stock_maximo'],
      type: 'check',
      name: 'productos_stock_maximo_positive_check',
      where: {
        stock_maximo: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    await queryInterface.addConstraint('productos', {
      fields: ['stock_minimo', 'stock_maximo'],
      type: 'check',
      name: 'productos_stock_limites_check',
      where: Sequelize.literal(
        '"stock_minimo" <= "stock_maximo"',
      ),
    });

    await queryInterface.addConstraint('productos', {
      fields: ['precio_compra', 'precio_venta'],
      type: 'check',
      name: 'productos_precio_venta_check',
      where: Sequelize.literal(
        '"precio_venta" >= "precio_compra"',
      ),
    });

    await queryInterface.addConstraint('pedidos', {
      fields: ['total'],
      type: 'check',
      name: 'pedidos_total_nonnegative_check',
      where: {
        total: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('jornadas_reparto', {
      fields: ['posicion_actual_orden'],
      type: 'check',
      name: 'jornadas_posicion_nonnegative_check',
      where: {
        posicion_actual_orden: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('jornadas_reparto', {
      fields: ['distancia_total'],
      type: 'check',
      name: 'jornadas_distancia_nonnegative_check',
      where: Sequelize.literal(
        '"distancia_total" IS NULL OR "distancia_total" >= 0',
      ),
    });

    await queryInterface.addConstraint('jornadas_reparto', {
      fields: ['tiempo_estimado'],
      type: 'check',
      name: 'jornadas_tiempo_nonnegative_check',
      where: Sequelize.literal(
        '"tiempo_estimado" IS NULL OR "tiempo_estimado" >= 0',
      ),
    });

    await queryInterface.addConstraint('despachos', {
      fields: ['orden_entrega'],
      type: 'check',
      name: 'despachos_orden_positive_check',
      where: Sequelize.literal(
        '"orden_entrega" IS NULL OR "orden_entrega" > 0',
      ),
    });

    await queryInterface.addConstraint('despachos', {
      fields: ['distancia_total'],
      type: 'check',
      name: 'despachos_distancia_nonnegative_check',
      where: Sequelize.literal(
        '"distancia_total" IS NULL OR "distancia_total" >= 0',
      ),
    });

    await queryInterface.addConstraint('despachos', {
      fields: ['tiempo_estimado'],
      type: 'check',
      name: 'despachos_tiempo_nonnegative_check',
      where: Sequelize.literal(
        '"tiempo_estimado" IS NULL OR "tiempo_estimado" >= 0',
      ),
    });

    await queryInterface.addConstraint('detalle_pedido', {
      fields: ['cantidad'],
      type: 'check',
      name: 'detalle_pedido_cantidad_positive_check',
      where: {
        cantidad: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    await queryInterface.addConstraint('detalle_pedido', {
      fields: ['precio_unitario'],
      type: 'check',
      name: 'detalle_pedido_precio_nonnegative_check',
      where: {
        precio_unitario: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('detalle_pedido', {
      fields: ['subtotal'],
      type: 'check',
      name: 'detalle_pedido_subtotal_nonnegative_check',
      where: {
        subtotal: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('ordenes_compra', {
      fields: ['total'],
      type: 'check',
      name: 'ordenes_compra_total_nonnegative_check',
      where: {
        total: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('detalle_orden_compra', {
      fields: ['cantidad'],
      type: 'check',
      name: 'detalle_orden_compra_cantidad_positive_check',
      where: {
        cantidad: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    await queryInterface.addConstraint('detalle_orden_compra', {
      fields: ['precio_unitario'],
      type: 'check',
      name: 'detalle_orden_compra_precio_nonnegative_check',
      where: {
        precio_unitario: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('detalle_orden_compra', {
      fields: ['subtotal'],
      type: 'check',
      name: 'detalle_orden_compra_subtotal_nonnegative_check',
      where: {
        subtotal: {
          [Sequelize.Op.gte]: 0,
        },
      },
    });

    await queryInterface.addConstraint('detalle_ingreso', {
      fields: ['cantidad'],
      type: 'check',
      name: 'detalle_ingreso_cantidad_positive_check',
      where: {
        cantidad: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    /*
     * Coordenadas válidas o ambas nulas.
     */

    await queryInterface.addConstraint('ubicaciones', {
      fields: ['latitud'],
      type: 'check',
      name: 'ubicaciones_latitud_range_check',
      where: Sequelize.literal(
        '"latitud" IS NULL OR ("latitud" >= -90 AND "latitud" <= 90)',
      ),
    });

    await queryInterface.addConstraint('ubicaciones', {
      fields: ['longitud'],
      type: 'check',
      name: 'ubicaciones_longitud_range_check',
      where: Sequelize.literal(
        '"longitud" IS NULL OR ("longitud" >= -180 AND "longitud" <= 180)',
      ),
    });

    await queryInterface.addConstraint('ubicaciones', {
      fields: ['latitud', 'longitud'],
      type: 'check',
      name: 'ubicaciones_coordenadas_completas_check',
      where: Sequelize.literal(
        `(
          ("latitud" IS NULL AND "longitud" IS NULL)
          OR
          ("latitud" IS NOT NULL AND "longitud" IS NOT NULL)
        )`,
      ),
    });
  },

  async down(queryInterface) {
    /*
     * Eliminar en orden inverso por dependencias.
     */

    await queryInterface.dropTable('detalle_ingreso');
    await queryInterface.dropTable('ingresos_inventario');
    await queryInterface.dropTable('detalle_orden_compra');
    await queryInterface.dropTable('ordenes_compra');

    await queryInterface.dropTable('despachos');
    await queryInterface.dropTable('detalle_pedido');
    await queryInterface.dropTable('jornadas_reparto');
    await queryInterface.dropTable('pedidos');

    await queryInterface.dropTable('rutas');
    await queryInterface.dropTable('clientes');
    await queryInterface.dropTable('productos');

    await queryInterface.dropTable('camiones');
    await queryInterface.dropTable('proveedores');
    await queryInterface.dropTable('ubicaciones');
    await queryInterface.dropTable('categorias');
    await queryInterface.dropTable('usuarios');

    /*
     * PostgreSQL conserva los tipos ENUM aunque se eliminen
     * las tablas. Debemos retirarlos expresamente.
     */

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_usuarios_rol";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_camiones_estado";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_pedidos_estado";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jornadas_reparto_estado";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_despachos_estado";',
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_ordenes_compra_estado";',
    );
  },
};

