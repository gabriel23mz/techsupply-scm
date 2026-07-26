import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  getLandingPath,
} from '../routing/access';

function NotFoundPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  return (
    <section className="system-state-page">
      <div className="system-state-icon">
        <i className="bi bi-signpost-split" />
      </div>

      <span>Error 404</span>
      <h3>Página no encontrada</h3>

      <p>
        La dirección solicitada no corresponde a una pantalla registrada en TechSupply SCM.
      </p>

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
        Ir al inicio
      </button>
    </section>
  );
}

export default NotFoundPage;
