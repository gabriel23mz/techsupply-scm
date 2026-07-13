import api from '../../../shared/services/api';

function unwrap(result) {
  return (
    result?.value?.data?.data ??
    result?.value?.data ??
    []
  );
}

function arrayFrom(result) {
  const value = unwrap(result);

  return Array.isArray(value)
    ? value
    : [];
}

export const obtenerResumenDashboard =
  async () => {
    const results =
      await Promise.allSettled([
        api.get('/pedidos'),
        api.get('/clientes'),
        api.get('/ubicaciones'),
        api.get('/rutas'),
        api.get('/despachos'),
        api.get('/jornadas-reparto'),
        api.get('/camiones'),
        api.get('/productos'),
      ]);

    const [
      pedidosResult,
      clientesResult,
      ubicacionesResult,
      rutasResult,
      despachosResult,
      jornadasResult,
      camionesResult,
      productosResult,
    ] = results;

    const pedidos =
      arrayFrom(pedidosResult);

    const clientes =
      arrayFrom(clientesResult);

    const ubicaciones =
      arrayFrom(ubicacionesResult);

    const rutas =
      arrayFrom(rutasResult);

    const despachos =
      arrayFrom(despachosResult);

    const jornadas =
      arrayFrom(jornadasResult);

    const camiones =
      arrayFrom(camionesResult);

    const productos =
      arrayFrom(productosResult);

    const failedSources = results
      .map((result, index) => ({
        result,
        source: [
          'pedidos',
          'clientes',
          'ubicaciones',
          'rutas',
          'despachos',
          'jornadas',
          'camiones',
          'productos',
        ][index],
      }))
      .filter(
        ({ result }) =>
          result.status ===
          'rejected',
      )
      .map(({ source }) => source);

    return {
      pedidos,
      clientes,
      ubicaciones,
      rutas,
      despachos,
      jornadas,
      camiones,
      productos,
      failedSources,
    };
  };
