import api from '../../../shared/services/api';

/*
|--------------------------------------------------------------------------
| Pedidos disponibles
|--------------------------------------------------------------------------
*/

export const obtenerPedidosDisponibles = async () => {
  const { data } = await api.get(
    '/despachos/pedidos-disponibles',
  );

  return data.data;
};

/*
|--------------------------------------------------------------------------
| Jornadas
|--------------------------------------------------------------------------
*/

export const generarJornadas = async () => {
  const { data } = await api.post(
    '/jornadas-reparto/generar',
    {},
    {
      timeout: 90000,
    },
  );

  return data.data;
};

export const obtenerJornadas = async () => {
  const { data } = await api.get(
    '/jornadas-reparto',
  );

  return data.data;
};

export const obtenerMapaGeneral = async () => {
  const { data } = await api.get(
    '/jornadas-reparto/mapa-general',
  );

  return data.data;
};

export const obtenerJornada = async (id) => {
  const { data } = await api.get(
    `/jornadas-reparto/${id}`,
  );

  return data.data;
};

export const obtenerChoferesDisponibles = async (fecha) => {
  const { data } = await api.get(
    '/choferes/disponibles',
    {
      params: fecha ? { fecha } : undefined,
    },
  );

  return Array.isArray(data.data) ? data.data : [];
};

export const asignarChoferJornada = async (id, choferId) => {
  const { data } = await api.patch(
    `/jornadas-reparto/${id}/asignar-chofer`,
    {
      chofer_id: choferId,
    },
  );

  return data.data;
};

/*
|--------------------------------------------------------------------------
| Operación de jornada
|--------------------------------------------------------------------------
*/

export const iniciarJornada = async (id) => {
  const { data } = await api.patch(
    `/jornadas-reparto/${id}/iniciar`,
  );

  return data.data;
};

export const avanzarJornada = async (id) => {
  const { data } = await api.patch(
    `/jornadas-reparto/${id}/avanzar`,
  );

  return data.data;
};

export const finalizarJornada = async (id) => {
  const { data } = await api.patch(
    `/jornadas-reparto/${id}/finalizar`,
  );

  return data.data;
};

export const recalcularJornada = async (id) => {
  const { data } = await api.patch(
    `/jornadas-reparto/${id}/recalcular`,
  );

  return data.data;
};

/*
|--------------------------------------------------------------------------
| Operación de despachos
|--------------------------------------------------------------------------
*/

export const entregarDespacho = async (id) => {
  const { data } = await api.patch(
    `/despachos/${id}/entregar`,
  );

  return data.data;
};

export const marcarDespachoNoEntregado = async (
  id,
) => {
  const { data } = await api.patch(
    `/despachos/${id}/no-entregado`,
  );

  return data.data;
};

/*
|--------------------------------------------------------------------------
| Exportación agrupada
|--------------------------------------------------------------------------
*/

const logisticaService = {
  obtenerPedidosDisponibles,

  generarJornadas,
  obtenerJornadas,
  obtenerMapaGeneral,
  obtenerJornada,
  obtenerChoferesDisponibles,
  asignarChoferJornada,

  iniciarJornada,
  avanzarJornada,
  finalizarJornada,
  recalcularJornada,

  entregarDespacho,
  marcarDespachoNoEntregado,
};

export default logisticaService;

