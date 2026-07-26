import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  getLandingPath,
} from '../routing/access';

import {
  useAuth,
} from '../hooks/useAuth';

function AccessDeniedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
  } = useAuth();

  const attemptedPath =
    location.state?.from?.pathname ??
    location.state?.from ??
    null;

  return (
    <section className="system-state-page">
      <div className="system-state-icon warning">
        <i className="bi bi-shield-lock" />
      </div>

      <span>Permiso insuficiente</span>
      <h3>Acceso denegado</h3>

      <p>
        Tu usuario no tiene permiso para consultar esta sección ni ejecutar sus acciones.
      </p>

      {attemptedPath && (
        <small>
          Ruta solicitada: {attemptedPath}
        </small>
      )}

      <div className="system-state-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            navigate(getLandingPath(user), {
              replace: true,
            })
          }
        >
          <i className="bi bi-house me-2" />
          Volver al inicio
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Regresar
        </button>
      </div>
    </section>
  );
}

export default AccessDeniedPage;
