import Despacho from '../models/Despacho.js';
import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';


export const obtenerTodos = async () => {
  return await Despacho.findAll({
    include: [
      {
        model: Pedido,
        include: [
          {
            model: Cliente,
            attributes: ['id', 'nombre', 'ubicacion_id'],
          },
          {
            model: Usuario,
            attributes: [
              'id',
              'nombre',
              'apellido',
              'rol',
            ],
          },
        ],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Despacho.findByPk(id, {
    include: [
      {
        model: Pedido,
        include: [
          {
            model: Cliente,
            attributes: ['id', 'nombre', 'ubicacion_id'],
          },
          {
            model: Usuario,
            attributes: [
              'id',
              'nombre',
              'apellido',
              'rol',
            ],
          },
        ],
      },
    ],
  });
};

export const crear = async ({
  pedido_id,
  ruta_json,
  distancia_total,
  tiempo_estimado,
}) => {
  const despacho =
    await Despacho.create({
      pedido_id,
      estado: 'PENDIENTE',
      ruta_json,
      distancia_total,
      tiempo_estimado,
    });
  
  return await obtenerPorId(
    despacho.id,
  );
};

export const iniciar = async (id) => {
  const despacho =
    await Despacho.findByPk(id);

  if (!despacho) {
    return null;
  }

  despacho.estado =
    'EN_TRANSITO';

  despacho.fecha_salida =
    new Date();

  await despacho.save();

  return await obtenerPorId(id);
};

export const entregar = async (id) => {
  const despacho = await Despacho.findByPk(id);
  
  if (!despacho) {
    return null;
  }
  
  despacho.estado = 'ENTREGADO';

  despacho.fecha_entrega = new Date();

  await despacho.save();

  return await obtenerPorId(id);
};

export const cancelar = async (id) => {
  const despacho = await Despacho.findByPk(id);

  if (!despacho) {
    return null;
  }

  despacho.estado = 'CANCELADO';

  await despacho.save();

  return await obtenerPorId(id);
};

export const existeDespachoActivo = async (pedidoId) => {
  return await Despacho.findOne({
    where: {
      pedido_id: pedidoId,
      estado: [
        'PENDIENTE',
        'EN_TRANSITO',
      ],
    },
  });
};
