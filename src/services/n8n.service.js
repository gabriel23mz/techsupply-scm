import axios from 'axios';

/**
 * ---------------------------------------------------------
 * n8n Service
 * ---------------------------------------------------------
 *
 * Responsabilidad:
 * - Traducir eventos logisticos a un contrato estable.
 * - Enviar ese contrato al Webhook publicado de n8n.
 * - Mantener la notificacion fuera de las transacciones.
 *
 * Este servicio no contiene reglas de negocio ni persiste
 * informacion. Si n8n no esta disponible, los servicios que
 * lo invocan capturan el error despues del commit y la
 * operacion logistica principal permanece confirmada.
 */

const DEFAULT_WEBHOOK_URL =
  'http://localhost:5678/webhook/techsupply-notificaciones';
const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_BATCH_WINDOW_MS = 150;

const EVENTOS = Object.freeze({
  JORNADA_CREADA: 'JORNADA_CREADA',
  JORNADA_INICIADA: 'JORNADA_INICIADA',
  DESPACHO_ENTREGADO: 'DESPACHO_ENTREGADO',
  DESPACHO_NO_ENTREGADO: 'DESPACHO_NO_ENTREGADO',
  JORNADA_FINALIZADA: 'JORNADA_FINALIZADA',
});

let jornadasCreadasPendientes = [];
let temporizadorPlanificacion = null;
let envioPlanificacionEnCurso = null;

const leerBooleano = (valor, fallback) => {
  if (valor === undefined || valor === null || valor === '') {
    return fallback;
  }

  return String(valor).trim().toLowerCase() === 'true';
};

const leerEnteroPositivo = (valor, fallback) => {
  const numero = Number(valor);

  return Number.isInteger(numero) && numero > 0
    ? numero
    : fallback;
};

const obtenerConfiguracion = () => ({
  habilitado: leerBooleano(
    process.env.N8N_ENABLED,
    true,
  ),
  webhookUrl:
    process.env.N8N_WEBHOOK_URL?.trim() ||
    DEFAULT_WEBHOOK_URL,
  timeoutMs: leerEnteroPositivo(
    process.env.N8N_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  ),
  batchWindowMs: leerEnteroPositivo(
    process.env.N8N_BATCH_WINDOW_MS,
    DEFAULT_BATCH_WINDOW_MS,
  ),
  modoDemo: leerBooleano(
    process.env.N8N_DEMO_MODE,
    true,
  ),
});

const convertirPlano = (valor) => {
  if (!valor) {
    return {};
  }

  return typeof valor.toJSON === 'function'
    ? valor.toJSON()
    : valor;
};

const numeroFinitoONull = (valor) => {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const codigoConPrefijo = (prefijo, id) => {
  const numero = Number(id);

  return Number.isInteger(numero) && numero > 0
    ? `${prefijo}-${String(numero).padStart(5, '0')}`
    : null;
};

const nombreCompleto = (persona = {}) => {
  const partes = [
    persona.nombre,
    persona.apellido,
  ].filter(Boolean);

  return partes.join(' ').trim() || null;
};

const normalizarCliente = (valor = {}) => {
  const cliente = convertirPlano(valor);
  const ubicacion = convertirPlano(cliente.ubicacion);

  return {
    id: cliente.id ?? null,
    nombre:
      cliente.nombre_completo ??
      cliente.nombre ??
      'Cliente',
    correo:
      cliente.correo ??
      cliente.email ??
      'Correo no disponible',
    telefono: cliente.telefono ?? null,
    direccion: cliente.direccion ?? null,
    ubicacion: Object.keys(ubicacion).length
      ? {
        id: ubicacion.id ?? null,
        nombre: ubicacion.nombre ?? null,
      }
      : null,
  };
};

const normalizarPedido = (valor = {}, despacho = {}) => {
  const pedido = convertirPlano(valor);
  const cliente = normalizarCliente(
    pedido.cliente ?? despacho.cliente,
  );
  const id = pedido.id ?? despacho.pedido_id ?? null;

  return {
    id,
    codigo:
      pedido.codigo ??
      pedido.numero ??
      despacho.codigo_pedido ??
      codigoConPrefijo('PED', id) ??
      'Pedido',
    estado: pedido.estado ?? null,
    cliente,
  };
};

const normalizarDespacho = (valor = {}) => {
  const despacho = convertirPlano(valor);
  const pedido = normalizarPedido(
    despacho.pedido,
    despacho,
  );

  return {
    id: despacho.id ?? null,
    pedido_id: despacho.pedido_id ?? pedido.id,
    codigo_pedido: pedido.codigo,
    estado: despacho.estado ?? null,
    orden_entrega:
      numeroFinitoONull(despacho.orden_entrega),
    pedido,
  };
};

const normalizarCamion = (valor = {}, camionId = null) => {
  const camion = convertirPlano(valor);
  const id = camion.id ?? camionId ?? null;

  return {
    id,
    codigo:
      camion.codigo ??
      codigoConPrefijo('CAM', id) ??
      'Camion',
    placa: camion.placa ?? null,
  };
};

const normalizarChofer = (valor = {}, choferId = null) => {
  const chofer = convertirPlano(valor);
  const usuario = convertirPlano(chofer.usuario);
  const id = chofer.id ?? choferId ?? null;

  return {
    id,
    nombre:
      chofer.nombre ??
      nombreCompleto(usuario) ??
      (id ? `Chofer #${id}` : 'No disponible'),
  };
};

const normalizarJornada = (
  valor = {},
  despachosExternos = null,
) => {
  const jornada = convertirPlano(valor);
  const despachosFuente = Array.isArray(despachosExternos)
    ? despachosExternos
    : Array.isArray(jornada.despachos)
      ? jornada.despachos
      : [];
  const despachos = despachosFuente.map(normalizarDespacho);
  const camion = normalizarCamion(
    jornada.camion,
    jornada.camion_id,
  );
  const chofer = normalizarChofer(
    jornada.chofer,
    jornada.chofer_id,
  );
  const ordenes = new Set(
    despachos
      .map((despacho) => despacho.orden_entrega)
      .filter((orden) => Number.isInteger(orden) && orden > 0),
  );

  return {
    id: jornada.id ?? null,
    codigo:
      jornada.codigo ??
      jornada.codigo_jornada ??
      codigoConPrefijo('JR', jornada.id) ??
      'Jornada',
    estado: jornada.estado ?? null,
    fecha: jornada.fecha ?? null,
    camion_id: jornada.camion_id ?? camion.id,
    camion,
    camion_codigo: camion.codigo,
    chofer_id: jornada.chofer_id ?? chofer.id,
    chofer,
    nombre_chofer: chofer.nombre,
    distancia_total:
      numeroFinitoONull(jornada.distancia_total),
    tiempo_estimado:
      numeroFinitoONull(jornada.tiempo_estimado),
    posicion_actual_orden:
      numeroFinitoONull(jornada.posicion_actual_orden),
    total_pedidos: despachos.length,
    total_puntos: ordenes.size,
    despachos,
  };
};

const crearErrorN8n = (evento, error) => {
  const detalle =
    error.response?.data?.message ??
    error.response?.data?.error ??
    error.message ??
    'Error desconocido';
  const errorN8n = new Error(
    `No fue posible notificar ${evento} a n8n: ${detalle}`,
  );

  errorN8n.code = 'N8N_WEBHOOK_ERROR';
  errorN8n.cause = error;
  return errorN8n;
};

const enviarEvento = async (evento, datos) => {
  const configuracion = obtenerConfiguracion();

  if (!configuracion.habilitado) {
    return {
      enviado: false,
      omitido: true,
      evento,
      motivo: 'N8N_DISABLED',
    };
  }

  const payload = {
    evento,
    fecha_evento: new Date().toISOString(),
    modo_demo: configuracion.modoDemo,
    datos,
  };

  try {
    const respuesta = await axios.post(
      configuracion.webhookUrl,
      payload,
      {
        timeout: configuracion.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'X-TechSupply-Event': evento,
        },
      },
    );

    return {
      enviado: true,
      evento,
      status: respuesta.status,
    };
  } catch (error) {
    throw crearErrorN8n(evento, error);
  }
};

const programarEnvioPlanificacion = () => {
  const { batchWindowMs } = obtenerConfiguracion();

  if (temporizadorPlanificacion) {
    clearTimeout(temporizadorPlanificacion);
  }

  temporizadorPlanificacion = setTimeout(() => {
    temporizadorPlanificacion = null;

    void flushJornadasCreadasPendientes()
      .catch((error) => {
        console.error(error);
      });
  }, batchWindowMs);

  temporizadorPlanificacion.unref?.();
};

/**
 * Fuerza el envio del resumen de jornadas que se hayan
 * acumulado en la ventana corta de planificacion.
 *
 * Se exporta para pruebas y para permitir un cierre limpio
 * si en el futuro el proceso incorpora manejo de señales.
 */
export const flushJornadasCreadasPendientes = async () => {
  if (temporizadorPlanificacion) {
    clearTimeout(temporizadorPlanificacion);
    temporizadorPlanificacion = null;
  }

  if (envioPlanificacionEnCurso) {
    await envioPlanificacionEnCurso;
  }

  if (!jornadasCreadasPendientes.length) {
    return {
      enviado: false,
      omitido: true,
      evento: EVENTOS.JORNADA_CREADA,
      motivo: 'SIN_JORNADAS_PENDIENTES',
    };
  }

  const jornadas = jornadasCreadasPendientes;
  jornadasCreadasPendientes = [];

  const resumen = {
    total_jornadas: jornadas.length,
    pedidos_asignados: jornadas.reduce(
      (total, jornada) => total + jornada.total_pedidos,
      0,
    ),
    sin_asignar: 0,
  };

  envioPlanificacionEnCurso = enviarEvento(
    EVENTOS.JORNADA_CREADA,
    {
      jornadas,
      resumen,
    },
  );

  try {
    return await envioPlanificacionEnCurso;
  } finally {
    envioPlanificacionEnCurso = null;

    if (jornadasCreadasPendientes.length) {
      programarEnvioPlanificacion();
    }
  }
};

/**
 * La generacion persiste una jornada por camion y llama a
 * este metodo una vez por cada una. Para conservar el correo
 * administrativo unico por planificacion, las llamadas de la
 * misma rafaga se agrupan durante una ventana muy corta.
 */
export const jornadaCreada = async (jornada, despachos) => {
  const configuracion = obtenerConfiguracion();

  if (!configuracion.habilitado) {
    return {
      enviado: false,
      omitido: true,
      evento: EVENTOS.JORNADA_CREADA,
      motivo: 'N8N_DISABLED',
    };
  }

  const jornadaNormalizada = normalizarJornada(
    jornada,
    despachos,
  );

  jornadasCreadasPendientes.push({
    id: jornadaNormalizada.id,
    codigo: jornadaNormalizada.codigo,
    camion: jornadaNormalizada.camion,
    total_pedidos: jornadaNormalizada.total_pedidos,
    total_puntos: jornadaNormalizada.total_puntos,
    distancia_total: jornadaNormalizada.distancia_total,
    tiempo_estimado: jornadaNormalizada.tiempo_estimado,
  });

  programarEnvioPlanificacion();

  return {
    enviado: false,
    en_cola: true,
    evento: EVENTOS.JORNADA_CREADA,
  };
};

export const jornadaIniciada = async (jornada) => {
  const jornadaNormalizada = normalizarJornada(jornada);

  return enviarEvento(
    EVENTOS.JORNADA_INICIADA,
    {
      jornada: jornadaNormalizada,
      despachos: jornadaNormalizada.despachos,
    },
  );
};

export const despachoEntregado = async (despacho) =>
  enviarEvento(
    EVENTOS.DESPACHO_ENTREGADO,
    {
      despacho: normalizarDespacho(despacho),
    },
  );

export const despachoNoEntregado = async (despacho) =>
  enviarEvento(
    EVENTOS.DESPACHO_NO_ENTREGADO,
    {
      despacho: normalizarDespacho(despacho),
    },
  );

export const jornadaFinalizada = async (jornada) => {
  const jornadaNormalizada = normalizarJornada(jornada);

  return enviarEvento(
    EVENTOS.JORNADA_FINALIZADA,
    {
      jornada: jornadaNormalizada,
      despachos: jornadaNormalizada.despachos,
    },
  );
};
