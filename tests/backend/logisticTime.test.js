import test from 'node:test';
import assert from 'node:assert/strict';

import {
  agregarMinutosOperativos,
  calcularDuracionOperativaMin,
  calcularEntregaEstimada,
  derivarAtrasoJornada,
  getOperationalDate,
  resolveInicioEstimado,
  zonedDateTimeToUtc,
} from '../../src/utils/logisticTime.js';

const timezone = 'America/Guayaquil';

test('fecha operativa usa la zona horaria configurada', () => {
  assert.equal(
    getOperationalDate(
      new Date('2026-07-25T04:30:00.000Z'),
      timezone,
    ),
    '2026-07-24',
  );
});

test('inicio estimado nunca queda en el pasado', () => {
  const now = new Date('2026-07-25T15:00:00.000Z');
  const inicio = resolveInicioEstimado({
    fechaOperativa: '2026-07-25',
    now,
    timezone,
    horaInicioOperacion: '08:00',
  });

  assert.equal(inicio.toISOString(), now.toISOString());
});

test('agregar minutos operativos soporta menos, igual y más de un día', () => {
  const inicio = zonedDateTimeToUtc(
    '2026-07-27',
    '08:00',
    timezone,
  );

  assert.equal(
    agregarMinutosOperativos(
      inicio,
      120,
      600,
      { timezone, horaInicioOperacion: '08:00' },
    ).toISOString(),
    '2026-07-27T15:00:00.000Z',
  );
  assert.equal(
    agregarMinutosOperativos(
      inicio,
      600,
      600,
      { timezone, horaInicioOperacion: '08:00' },
    ).toISOString(),
    '2026-07-27T23:00:00.000Z',
  );
  assert.equal(
    agregarMinutosOperativos(
      inicio,
      900,
      600,
      { timezone, horaInicioOperacion: '08:00' },
    ).toISOString(),
    '2026-07-28T18:00:00.000Z',
  );
});

test('duración operativa suma servicio por entrega y margen', () => {
  assert.equal(
    calcularDuracionOperativaMin({
      tiempoViajeMin: 100,
      totalEntregas: 2,
      tiempoServicioPorEntregaMin: 10,
      margenOperativoPorcentaje: 25,
    }),
    150,
  );
});

test('estimación de entrega usa tiempo acumulado sin incluir retorno', () => {
  const inicio = zonedDateTimeToUtc(
    '2026-07-27',
    '08:00',
    timezone,
  );

  assert.equal(
    calcularEntregaEstimada({
      inicio,
      tiempoAcumuladoMin: 50,
      ordenEntrega: 2,
      tiempoServicioPorEntregaMin: 10,
      margenOperativoPorcentaje: 0,
      minutosMaximosOperacionDia: 600,
      timezone,
      horaInicioOperacion: '08:00',
    }).toISOString(),
    '2026-07-27T14:00:00.000Z',
  );
});

test('jornada atrasada es derivada y no cambia estado', () => {
  const jornada = {
    estado: 'EN_RUTA',
    retorno_estimado_en: '2026-07-25T14:00:00.000Z',
  };

  const atraso = derivarAtrasoJornada(
    jornada,
    new Date('2026-07-25T15:30:00.000Z'),
  );

  assert.equal(atraso.atrasada, true);
  assert.equal(atraso.minutos_retraso, 90);
  assert.equal(jornada.estado, 'EN_RUTA');
});
