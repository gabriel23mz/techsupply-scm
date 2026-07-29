import {
  ROLES,
} from '../../../shared/constants/permissions';

import {
  StatCard,
} from '../../../shared/ui';

function UsuariosMetrics({
  loading = false,
  usuarios = [],
}) {
  const rolesRepresented = new Set(
    usuarios
      .map((usuario) => usuario.rol)
      .filter(Boolean),
  ).size;

  const operationalRoles = new Set([
    ROLES.VENTAS,
    ROLES.BODEGA,
    ROLES.LOGISTICA,
    ROLES.CHOFER,
  ]);

  const metrics = [
    {
      label: 'Usuarios activos',
      value: usuarios.length,
      helper: 'Cuentas disponibles para iniciar sesión',
      icon: 'bi bi-people',
      tone: 'primary',
    },
    {
      label: 'Administradores',
      value: usuarios.filter(
        (usuario) => usuario.rol === ROLES.ADMIN,
      ).length,
      helper: 'Acceso integral al sistema',
      icon: 'bi bi-shield-check',
      tone: 'info',
    },
    {
      label: 'Personal operativo',
      value: usuarios.filter(
        (usuario) => operationalRoles.has(usuario.rol),
      ).length,
      helper: 'Ventas, Bodega, Logística y Choferes',
      icon: 'bi bi-person-workspace',
      tone: 'success',
    },
    {
      label: 'Roles representados',
      value: rolesRepresented,
      helper: 'Perfiles activos en la plataforma',
      icon: 'bi bi-diagram-3',
      tone: 'warning',
    },
  ];

  return (
    <section
      className="users-metrics"
      aria-label="Resumen de usuarios"
    >
      {metrics.map((metric) => (
        <StatCard
          key={metric.label}
          {...metric}
          loading={loading}
        />
      ))}
    </section>
  );
}

export default UsuariosMetrics;
