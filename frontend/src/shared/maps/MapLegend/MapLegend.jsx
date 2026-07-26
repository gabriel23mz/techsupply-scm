import {
  classNames,
} from '../../ui/internal/classNames';

import './MapLegend.css';

function MapLegend({
  className,
  items = [],
  label = 'Leyenda del mapa',
}) {
  const visibleItems = items.filter(
    (item) => item && item.label,
  );

  if (!visibleItems.length) {
    return null;
  }

  return (
    <div
      className={classNames(
        'map-legend',
        className,
      )}
      aria-label={label}
    >
      {visibleItems.map((item) => (
        <span
          key={item.id ?? item.label}
          className="map-legend__item"
        >
          <i
            className={classNames(
              'map-legend__swatch',
              `map-legend__swatch--${item.type ?? 'dot'}`,
              `map-legend__swatch--${item.tone ?? 'primary'}`,
              item.className,
            )}
            style={
              item.color
                ? {
                    '--map-legend-color': item.color,
                  }
                : undefined
            }
            aria-hidden="true"
          >
            {item.icon && (
              <i className={`bi ${item.icon}`} />
            )}
          </i>

          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export default MapLegend;
