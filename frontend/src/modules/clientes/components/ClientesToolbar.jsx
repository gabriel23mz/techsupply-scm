import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

function ClientesToolbar({
  searchTerm,
  locationFilter,
  ubicaciones,
  onSearchChange,
  onLocationChange,
  onCreate,
}) {
  return (
    <div className="clients-toolbar">
      <div className="clients-search">
        <i className="bi bi-search" />

        <input
          type="search"
          className="form-control"
          value={searchTerm}
          placeholder="Buscar nombre, identificación, correo o teléfono..."
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />

        {searchTerm && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => onSearchChange('')}
          >
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      <div className="clients-location-filter">
        <i className="bi bi-geo-alt" />

        <select
          className="form-select"
          value={locationFilter}
          onChange={(event) =>
            onLocationChange(event.target.value)
          }
        >
          <option value="TODAS">
            Todas las ubicaciones
          </option>

          {ubicaciones.map((ubicacion) => (
            <option
              key={ubicacion.id}
              value={ubicacion.id}
            >
              {ubicacion.nombre}
            </option>
          ))}
        </select>
      </div>

      <Can permission={PERMISSIONS.CLIENTES_GESTIONAR}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreate}
        >
          <i className="bi bi-person-plus me-2" />
          Nuevo cliente
        </button>
      </Can>
    </div>
  );
}

export default ClientesToolbar;
