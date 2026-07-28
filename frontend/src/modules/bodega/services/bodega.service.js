import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function obtenerPedidosPreparacion() {
  const response = await api.get('/bodega/pedidos');
  return unwrap(response);
}

export async function obtenerPedidoPreparacion(id) {
  const response = await api.get(`/bodega/pedidos/${id}`);
  return unwrap(response);
}

export async function actualizarPreparacionDetalle(
  id,
  cantidadPreparada,
) {
  const response = await api.patch(
    `/bodega/detalles/${id}/preparacion`,
    {
      cantidad_preparada: cantidadPreparada,
    },
  );

  return unwrap(response);
}

export async function finalizarPreparacion(id) {
  const response = await api.patch(
    `/bodega/pedidos/${id}/finalizar-preparacion`,
  );

  return unwrap(response);
}


export async function obtenerJornadasCarga() {
  const response = await api.get('/bodega/jornadas');
  return unwrap(response);
}

export async function obtenerJornadaCarga(id) {
  const response = await api.get(`/bodega/jornadas/${id}/carga`);
  return unwrap(response);
}

export async function actualizarCargaDespacho(id, cargado) {
  const response = await api.patch(
    `/bodega/despachos/${id}/carga`,
    { cargado: Boolean(cargado) },
  );

  return unwrap(response);
}

export async function confirmarCargaJornada(id) {
  const response = await api.patch(
    `/bodega/jornadas/${id}/confirmar-carga`,
  );

  return unwrap(response);
}

const bodegaService = {
  actualizarCargaDespacho,
  actualizarPreparacionDetalle,
  confirmarCargaJornada,
  finalizarPreparacion,
  obtenerJornadaCarga,
  obtenerJornadasCarga,
  obtenerPedidoPreparacion,
  obtenerPedidosPreparacion,
};

export default bodegaService;
