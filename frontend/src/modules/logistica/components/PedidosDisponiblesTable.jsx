function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '$0,00';
  }

  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getCliente(pedido) {
  return pedido.cliente ?? null;
}

function getUsuario(pedido) {
  return pedido.usuario ?? null;
}

function getUbicacion(cliente) {
  return cliente?.ubicacion ?? null;
}

function PedidosDisponiblesTable({ pedidos }) {
  if (!pedidos.length) {
    return (
      <div className="logistics-empty-state">
        <i className="bi bi-box-seam" />

        <h4>No existen pedidos disponibles</h4>

        <p>
          Los pedidos con estado LISTO PARA DESPACHO aparecerán aquí
          para ser incluidos en la siguiente planificación logística.
        </p>
      </div>
    );
  }

  return (
    <section className="logistics-table-card">
      <div className="logistics-table-intro">
        <div>
          <i className="bi bi-info-circle" />

          <span>
            Estos pedidos serán distribuidos automáticamente entre
            los camiones disponibles según capacidad y ruta óptima.
          </span>
        </div>

        <strong>
          {pedidos.length} pedido
          {pedidos.length === 1 ? '' : 's'} listo
          {pedidos.length === 1 ? '' : 's'}
        </strong>
      </div>

      <div className="table-responsive">
        <table className="table logistics-table align-middle mb-0">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Destino</th>
              <th>Responsable</th>
              <th>Fecha</th>
              <th>Fecha de entrega</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((pedido) => {
              const cliente = getCliente(pedido);
              const usuario = getUsuario(pedido);
              const ubicacion = getUbicacion(cliente);

              return (
                <tr key={pedido.id}>
                  <td>
                    <strong className="text-primary">
                      {formatPedidoId(pedido.id)}
                    </strong>

                    <span>
                      ID interno: {pedido.id}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {cliente?.nombre ||
                        'Cliente no disponible'}
                    </strong>

                    <span>
                      {cliente?.identificacion ||
                        `ID cliente: ${pedido.cliente_id}`}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {ubicacion?.nombre ||
                        cliente?.ubicacion_nombre ||
                        'Ubicación no disponible'}
                    </strong>

                    <span>
                      {cliente?.direccion ||
                        'Sin dirección registrada'}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {usuario
                        ? `${usuario.nombre ?? ''} ${
                          usuario.apellido ?? ''
                        }`.trim()
                        : 'No disponible'}
                    </strong>

                    <span>
                      {usuario?.rol || 'Sin rol'}
                    </span>
                  </td>

                  <td>
                    {formatDate(
                      pedido.fecha ??
                        pedido.created_at,
                    )}
                  </td>

                  <td>
                    {formatDate(pedido.fecha_entrega)}
                  </td>

                  <td>
                    <strong>
                      {formatCurrency(pedido.total)}
                    </strong>
                  </td>

                  <td>
                    <span className="logistics-status ready">
                      Listo para despacho
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="logistics-pagination">
        <span>
          Mostrando {pedidos.length} pedido
          {pedidos.length === 1 ? '' : 's'}
        </span>

        <div>
          <button type="button" disabled>
            <i className="bi bi-chevron-left" />
          </button>

          <button
            type="button"
            className="active"
          >
            1
          </button>

          <button type="button" disabled>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default PedidosDisponiblesTable;

