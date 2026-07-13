import {
  usePreferences,
} from '../contexts/PreferencesContext';

function SettingsPanel({
  open,
  onClose,
}) {
  const {
    preferences,
    updatePreference,
  } = usePreferences();

  if (!open) {
    return null;
  }

  return (
    <div
      className="settings-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside className="settings-panel">
        <header>
          <div>
            <span>
              Preferencias locales
            </span>

            <h4>
              Configuración
            </h4>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración"
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="settings-body">
          <section>
            <h5>
              Apariencia del sistema
            </h5>

            <label className="settings-option">
              <div>
                <i className="bi bi-layout-sidebar-inset" />

                <span>
                  <strong>
                    Sidebar compacto
                  </strong>

                  <small>
                    Reduce el panel lateral y muestra únicamente iconos.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  preferences.sidebarCollapsed
                }
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
                  <strong>
                    Contenido compacto
                  </strong>

                  <small>
                    Reduce el espacio lateral del área principal.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  preferences.compactContent
                }
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
            <h5>
              Información
            </h5>

            <div className="settings-info-card">
              <span>
                Producto
              </span>

              <strong>
                TechSupply SCM
              </strong>
            </div>

            <div className="settings-info-card">
              <span>
                Módulo
              </span>

              <strong>
                Outbound
              </strong>
            </div>

            <div className="settings-info-card">
              <span>
                Versión
              </span>

              <strong>
                2.4.0 MVP
              </strong>
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
