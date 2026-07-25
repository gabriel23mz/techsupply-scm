export const DEFAULT_APP_TIMEZONE = 'America/Guayaquil';
export const DEFAULT_HORA_INICIO_OPERACION = '08:00';
export const DEFAULT_TIEMPO_SERVICIO_POR_ENTREGA_MIN = 10;
export const DEFAULT_MARGEN_OPERATIVO_PORCENTAJE = 15;
export const DEFAULT_MINUTOS_MAXIMOS_OPERACION_DIA = 600;

export const getLogisticTimeConfig = () => ({
  timezone:
    process.env.APP_TIMEZONE ||
    DEFAULT_APP_TIMEZONE,
  horaInicioOperacion:
    process.env.HORA_INICIO_OPERACION ||
    DEFAULT_HORA_INICIO_OPERACION,
  tiempoServicioPorEntregaMin: Number(
    process.env.TIEMPO_SERVICIO_POR_ENTREGA_MIN ||
      DEFAULT_TIEMPO_SERVICIO_POR_ENTREGA_MIN,
  ),
  margenOperativoPorcentaje: Number(
    process.env.MARGEN_OPERATIVO_PORCENTAJE ||
      DEFAULT_MARGEN_OPERATIVO_PORCENTAJE,
  ),
  minutosMaximosOperacionDia: Number(
    process.env.MINUTOS_MAXIMOS_OPERACION_DIA ||
      DEFAULT_MINUTOS_MAXIMOS_OPERACION_DIA,
  ),
});

const parseHora = (hora) => {
  const match = /^(\d{2}):(\d{2})$/.exec(
    String(hora),
  );

  if (!match) {
    return {
      hour: 8,
      minute: 0,
    };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

const formatterCache = new Map();

const getFormatter = (timezone) => {
  if (!formatterCache.has(timezone)) {
    formatterCache.set(
      timezone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    );
  }

  return formatterCache.get(timezone);
};

export const getZonedParts = (
  date,
  timezone = getLogisticTimeConfig().timezone,
) => {
  const parts = Object.fromEntries(
    getFormatter(timezone)
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

export const getOperationalDate = (
  now = new Date(),
  timezone = getLogisticTimeConfig().timezone,
) => {
  const parts = getZonedParts(now, timezone);

  return [
    parts.year,
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
};

const parseDateOnly = (dateOnly) => {
  const [year, month, day] = String(dateOnly)
    .slice(0, 10)
    .split('-')
    .map(Number);

  return {
    year,
    month,
    day,
  };
};

const addDaysToDateOnly = (
  dateOnly,
  days,
) => {
  const {
    year,
    month,
    day,
  } = parseDateOnly(dateOnly);
  const date = new Date(
    Date.UTC(year, month - 1, day + days),
  );

  return date.toISOString().slice(0, 10);
};

export const zonedDateTimeToUtc = (
  dateOnly,
  hora,
  timezone = getLogisticTimeConfig().timezone,
) => {
  const {
    year,
    month,
    day,
  } = parseDateOnly(dateOnly);
  const {
    hour,
    minute,
  } = parseHora(hora);

  let utc = new Date(
    Date.UTC(year, month - 1, day, hour, minute),
  );
  const target = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
  );

  for (let index = 0; index < 3; index += 1) {
    const parts = getZonedParts(utc, timezone);
    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    utc = new Date(
      utc.getTime() + target - observed,
    );
  }

  return utc;
};

export const resolveInicioEstimado = ({
  fechaOperativa,
  now = new Date(),
  inicioEstimadoEn,
  timezone = getLogisticTimeConfig().timezone,
  horaInicioOperacion =
    getLogisticTimeConfig().horaInicioOperacion,
} = {}) => {
  if (inicioEstimadoEn) {
    const requested = new Date(inicioEstimadoEn);

    return requested > now
      ? requested
      : new Date(now);
  }

  const inicioOperacion = zonedDateTimeToUtc(
    fechaOperativa,
    horaInicioOperacion,
    timezone,
  );

  return inicioOperacion > now
    ? inicioOperacion
    : new Date(now);
};

export const calcularDuracionOperativaMin = ({
  tiempoViajeMin,
  totalEntregas,
  tiempoServicioPorEntregaMin =
    getLogisticTimeConfig().tiempoServicioPorEntregaMin,
  margenOperativoPorcentaje =
    getLogisticTimeConfig().margenOperativoPorcentaje,
}) => {
  const viaje = Number(tiempoViajeMin) || 0;
  const entregas = Number(totalEntregas) || 0;
  const servicio =
    entregas * Number(tiempoServicioPorEntregaMin);
  const margen =
    1 + Number(margenOperativoPorcentaje) / 100;

  return Math.ceil((viaje + servicio) * margen);
};

export const agregarMinutosOperativos = (
  fechaInicial,
  minutos,
  minutosMaximosDia =
    getLogisticTimeConfig().minutosMaximosOperacionDia,
  options = {},
) => {
  const config = getLogisticTimeConfig();
  const timezone = options.timezone || config.timezone;
  const horaInicioOperacion =
    options.horaInicioOperacion ||
    config.horaInicioOperacion;
  const limiteDiario = Number(minutosMaximosDia);
  let restantes = Math.ceil(Number(minutos) || 0);
  let actual = new Date(fechaInicial);

  if (restantes <= 0) {
    return actual;
  }

  if (!Number.isFinite(limiteDiario) || limiteDiario <= 0) {
    return new Date(
      actual.getTime() + restantes * 60 * 1000,
    );
  }

  while (restantes > limiteDiario) {
    actual = new Date(
      actual.getTime() + limiteDiario * 60 * 1000,
    );
    restantes -= limiteDiario;

    const fechaSiguiente = addDaysToDateOnly(
      getOperationalDate(actual, timezone),
      1,
    );

    actual = zonedDateTimeToUtc(
      fechaSiguiente,
      horaInicioOperacion,
      timezone,
    );
  }

  return new Date(
    actual.getTime() + restantes * 60 * 1000,
  );
};

export const calcularEntregaEstimada = ({
  inicio,
  tiempoAcumuladoMin,
  ordenEntrega,
  tiempoServicioPorEntregaMin =
    getLogisticTimeConfig().tiempoServicioPorEntregaMin,
  margenOperativoPorcentaje =
    getLogisticTimeConfig().margenOperativoPorcentaje,
  minutosMaximosOperacionDia =
    getLogisticTimeConfig().minutosMaximosOperacionDia,
  timezone = getLogisticTimeConfig().timezone,
  horaInicioOperacion =
    getLogisticTimeConfig().horaInicioOperacion,
}) => {
  const orden = Math.max(
    Number(ordenEntrega) || 1,
    1,
  );
  const base =
    (Number(tiempoAcumuladoMin) || 0) +
    (orden - 1) * Number(tiempoServicioPorEntregaMin);
  const minutos = Math.ceil(
    base *
      (1 + Number(margenOperativoPorcentaje) / 100),
  );

  return agregarMinutosOperativos(
    inicio,
    minutos,
    minutosMaximosOperacionDia,
    {
      timezone,
      horaInicioOperacion,
    },
  );
};

export const derivarAtrasoJornada = (
  jornada,
  now = new Date(),
) => {
  if (
    jornada?.estado !== 'EN_RUTA' ||
    !jornada?.retorno_estimado_en
  ) {
    return {
      atrasada: false,
      minutos_retraso: 0,
    };
  }

  const retorno = new Date(
    jornada.retorno_estimado_en,
  );
  const diff = now.getTime() - retorno.getTime();

  return {
    atrasada: diff > 0,
    minutos_retraso:
      diff > 0
        ? Math.floor(diff / 60000)
        : 0,
  };
};
