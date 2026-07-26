import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  Button,
  Combobox,
  SearchField,
} from '../../../shared/ui';

function ClientesToolbar({
  searchTerm,
  locationFilter,
  ubicaciones,
  onSearchChange,
  onLocationChange,
  onCreate,
}) {
  const locationOptions = [
    {
      value: 'TODAS',
      label: 'Todas las ubicaciones',
      icon: 'bi bi-geo-alt',
    },
    ...ubicaciones.map((ubicacion) => ({
      value: ubicacion.id,
      label: ubicacion.nombre,
      icon: 'bi bi-geo-alt',
    })),
  ];

  return (
    <div className="clients-toolbar">
      <SearchField
        className="clients-search"
        value={searchTerm}
        placeholder="Buscar nombre, identificación, correo o teléfono..."
        aria-label="Buscar clientes"
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        onClear={() => onSearchChange('')}
      />

      <Combobox
        className="clients-location-filter"
        value={locationFilter}
        options={locationOptions}
        placeholder="Todas las ubicaciones"
        searchPlaceholder="Buscar ubicación..."
        onChange={onLocationChange}
      />

      <Can permission={PERMISSIONS.CLIENTES_GESTIONAR}>
        <Button
          icon="bi bi-person-plus"
          onClick={onCreate}
        >
          Nuevo cliente
        </Button>
      </Can>
    </div>
  );
}

export default ClientesToolbar;
