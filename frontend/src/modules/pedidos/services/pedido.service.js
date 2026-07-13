import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export const obtenerPedidos = async () => {
  const response = await api.get('/pedidos');
  return unwrap(response);
};

export const obtenerPedido = async (id) => {
  const response = await api.get(`/pedidos/${id}`);
  return unwrap(response);
};

export const crearPedido = async (payload) => {
  const {
    fecha_entrega,
    ...createPayload
  } = payload;

  const response = await api.post(
    '/pedidos',
    createPayload,
  );

  const pedido = unwrap(response);

  if (
    fecha_entrega &&
    pedido?.id
  ) {
    const updateResponse =
      await api.put(
        `/pedidos/${pedido.id}`,
        {
          fecha_entrega,
        },
      );

    return unwrap(updateResponse);
  }

  return pedido;
};

export const actualizarPedido = async (
  id,
  payload,
) => {
  const response = await api.put(
    `/pedidos/${id}`,
    payload,
  );

  return unwrap(response);
};

export const iniciarPreparacion = async (
  id,
) => {
  const response = await api.patch(
    `/pedidos/${id}/preparar`,
  );

  return unwrap(response);
};

export const finalizarPreparacion =
  async (id) => {
    const response = await api.patch(
      `/pedidos/${id}/finalizar-preparacion`,
    );

    return unwrap(response);
  };

export const cancelarPedido = async (
  id,
) => {
  const response = await api.patch(
    `/pedidos/${id}/cancelar`,
  );

  return unwrap(response);
};

export const obtenerClientes = async () => {
  const response = await api.get('/clientes');
  return unwrap(response);
};

export const obtenerUsuarios = async () => {
  const response = await api.get('/usuarios');
  return unwrap(response);
};

export const obtenerProductos = async () => {
  const response = await api.get('/productos');
  return unwrap(response);
};

export const crearDetallePedido = async (
  payload,
) => {
  const response = await api.post(
    '/detalles-pedido',
    payload,
  );

  return unwrap(response);
};

export const actualizarDetallePedido =
  async (
    id,
    payload,
  ) => {
    const response = await api.put(
      `/detalles-pedido/${id}`,
      payload,
    );

    return unwrap(response);
  };

export const eliminarDetallePedido =
  async (id) => {
    const response = await api.delete(
      `/detalles-pedido/${id}`,
    );

    return unwrap(response);
  };

const pedidoService = {
  obtenerPedidos,
  obtenerPedido,
  crearPedido,
  actualizarPedido,
  iniciarPreparacion,
  finalizarPreparacion,
  cancelarPedido,
  obtenerClientes,
  obtenerUsuarios,
  obtenerProductos,
  crearDetallePedido,
  actualizarDetallePedido,
  eliminarDetallePedido,
};

export default pedidoService;
