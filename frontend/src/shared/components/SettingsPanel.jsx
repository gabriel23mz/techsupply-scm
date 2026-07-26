import {
  useEffect,
  useRef,
} from 'react';

import {
  usePreferences,
} from '../hooks/usePreferences';

const THEME_OPTIONS = [
  {
    id: 'system',
    label: 'Sistema',
    description: 'Sigue automáticamente el tema del dispositivo.',
    icon: 'bi-circle-half',
  },
  {
    id: 'light',
    label: 'Claro',
    description: 'Interfaz luminosa para ambientes con buena luz.',
    icon: 'bi-sun',
  },
  {
    id: 'dark',
    label: 'Oscuro',
    description: 'Reduce el brillo y mejora el contraste nocturno.',
    icon: 'bi-moon-stars',
  },
];

function SettingsPanel({
  open,
  onClose,
}) {
  const closeButtonRef = useRef(null);

  const {
    preferences,
    resolvedTheme,
    setTheme,
    updatePreference,
  } = usePreferences();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const body = document.body;
    body.classList.add('settings-scroll-locked');
    closeButtonRef.current?.focus();

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      body.classList.remove('settings-scroll-locked');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="settings-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header>
          <div>
            <span>Preferencias locales</span>
            <h4 id="settings-title">Configuración</h4>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración"
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="settings-body">
          <section>
            <div className="settings-section-heading">
              <div>
                <h5>Tema visual</h5>
                <p>
                  Tema activo: <strong>{resolvedTheme}</strong>
                </p>
              </div>
            </div>

            <div className="theme-options" role="radiogroup" aria-label="Tema visual">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`theme-option ${
                    preferences.theme === option.id
                      ? 'selected'
                      : ''
                  }`}
                  role="radio"
                  aria-checked={preferences.theme === option.id}
                  onClick={() => setTheme(option.id)}
                >
                  <i className={`bi ${option.icon}`} />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                  <i className="bi bi-check-circle-fill theme-option-check" />
                </button>
              ))}
            </div>
          </section>

          <section>
            <h5>Distribución</h5>

            <label className="settings-option">
              <div>
                <i className="bi bi-layout-sidebar-inset" />
                <span>
                  <strong>Sidebar compacto</strong>
                  <small>
                    Reduce el panel lateral y muestra únicamente iconos en escritorio.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={preferences.sidebarCollapsed}
                onChange={(event) =>
                  updatePreference(
                    'sidebarCollapsed',
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="settings-option">
              <div>
                <i className="bi bi-arrows-collapse" />
                <span>
                  <strong>Contenido compacto</strong>
                  <small>
                    Reduce el espacio lateral del área principal.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={preferences.compactContent}
                onChange={(event) =>
                  updatePreference(
                    'compactContent',
                    event.target.checked,
                  )
                }
              />
            </label>
          </section>

          <section>
            <h5>Información</h5>

            <div className="settings-info-card">
              <span>Producto</span>
              <strong>TechSupply SCM</strong>
            </div>

            <div className="settings-info-card">
              <span>Módulo</span>
              <strong>Outbound</strong>
            </div>

            <div className="settings-info-card">
              <span>Versión</span>
              <strong>2.4.0 MVP</strong>
            </div>
          </section>
        </div>

        <footer>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Aplicar y cerrar
          </button>
        </footer>
      </aside>
    </div>
  );
}

export default SettingsPanel;
