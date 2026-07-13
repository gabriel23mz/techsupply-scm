function formatCode(
  prefix,
  id,
  length = 5,
) {
  return `${prefix}-${String(
    id ?? 0,
  ).padStart(length, '0')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-EC',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

function RecentActivity({
  pedidos,
  despachos,
}) {
  const items = [
    ...pedidos.slice(0, 4).map(
      (pedido) => ({
        id: `pedido-${pedido.id}`,
        icon: 'bi-receipt',
        variant: 'primary',
        title: formatCode(
          'PED',
          pedido.id,
        ),
        detail:
          pedido?.Cliente?.nombre ??
          pedido?.cliente?.nombre ??
          'Pedido registrado',
        date:
          pedido.created_at ??
          pedido.createdAt ??
          pedido.fecha,
      }),
    ),
    ...despachos.slice(0, 4).map(
      (despacho) => ({
        id: `despacho-${despacho.id}`,
        icon: 'bi-truck',
        variant: 'info',
        title: formatCode(
          'DSP',
          despacho.id,
        ),
        detail:
          despacho.estado ??
          'Despacho',
        date:
          despacho.created_at ??
          despacho.createdAt,
      }),
    ),
  ]
    .sort(
      (first, second) =>
        new Date(second.date) -
        new Date(first.date),
    )
    .slice(0, 6);

  return (
    <section className="dashboard-panel dashboard-activity">
      <header className="dashboard-section-header">
        <div>
          <span>
            Trazabilidad
          </span>

          <h4>
            Actividad reciente
          </h4>
        </div>
      </header>

      <div className="dashboard-activity-list">
        {!items.length ? (
          <div className="dashboard-activity-empty">
            Sin actividad reciente.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="dashboard-activity-item"
            >
              <div
                className={`dashboard-activity-icon ${item.variant}`}
              >
                <i className={`bi ${item.icon}`} />
              </div>

              <div>
                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.detail}
                </span>
              </div>

              <time>
                {formatDate(
                  item.date,
                )}
              </time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default RecentActivity;
