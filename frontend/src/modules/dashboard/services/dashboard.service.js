import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export const obtenerResumenDashboard = async () => {
  const response = await api.get('/dashboard/resumen');

  return unwrap(response);
};

export const obtenerNotificacionesDashboard = async (limit = 8) => {
  const response = await api.get('/dashboard/notificaciones', {
    params: { limit },
  });

  return unwrap(response);
};
