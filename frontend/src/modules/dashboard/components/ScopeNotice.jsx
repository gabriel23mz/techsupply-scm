import {
  useNavigate,
} from 'react-router-dom';

import {
  Button,
} from '../../../shared/ui';

function ScopeNotice({ message }) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-scope-notice">
      <div className="dashboard-scope-notice__icon" aria-hidden="true">
        <i className="bi bi-info-circle" />
      </div>
      <div>
        <span>Alcance del proyecto</span>
        <h3>Dashboard informativo para Compras</h3>
        <p>{message}</p>
      </div>
      <Button
        tone="secondary"
        icon="bi bi-life-preserver"
        onClick={() => navigate('/ayuda?tab=rol')}
      >
        Ver información del rol
      </Button>
    </section>
  );
}

export default ScopeNotice;
