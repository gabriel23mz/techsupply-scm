import {
  useMemo,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  ROLE_LABELS,
} from '../../../shared/constants/permissions';

import {
  getRoleExperience,
} from '../../../shared/constants/roleExperience';

import {
  useAuth,
} from '../../../shared/hooks/useAuth';

import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';

import {
  getRouteById,
} from '../../../shared/routing/routeRegistry';

import {
  Tabs,
} from '../../../shared/ui';

import '../help.css';

const TAB_IDS = Object.freeze({
  SYSTEM: 'sistema',
  ROLE: 'rol',
});

const SYSTEM_STEPS = [
  {
    title: 'Consulta tu dashboard',
    detail: 'Revisa indicadores, alertas y accesos calculados según tu rol.',
  },
  {
    title: 'Trabaja en el módulo correspondiente',
    detail: 'La navegación solo muestra las áreas autorizadas para tu sesión.',
  },
  {
    title: 'Confirma y verifica',
    detail: 'Las acciones críticas solicitan confirmación y actualizan el estado real del proceso.',
  },
];

const SYSTEM_PRINCIPLES = [
  {
    icon: 'bi-shield-check',
    title: 'Acceso por rol',
    description: 'Cada usuario consulta únicamente la información y acciones permitidas.',
  },
  {
    icon: 'bi-arrow-repeat',
    title: 'Trazabilidad',
    description: 'Pedidos, cargas, jornadas y entregas conservan un flujo de estados controlado.',
  },
  {
    icon: 'bi-phone',
    title: 'Experiencia adaptable',
    description: 'La interfaz responde a escritorio, tableta y móvil sin cambiar las reglas operativas.',
  },
];

function HelpCenterPage() {
  const {
    user,
  } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = Object.values(TAB_IDS).includes(requestedTab)
    ? requestedTab
    : TAB_IDS.SYSTEM;

  const role = user?.rol;
  const roleLabel = ROLE_LABELS[role] ?? role ?? 'Usuario';
  const experience = getRoleExperience(role);

  const pageHeader = useMemo(() => ({
    title: 'Centro de ayuda',
    description: 'Información del sistema y orientación operativa para tu rol.',
  }), []);

  usePageHeader(pageHeader);

  const modules = useMemo(
    () => experience.modules
      .map(getRouteById)
      .filter(Boolean),
    [experience],
  );

  const changeTab = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="help-page">
      <Tabs
        className="help-tabs"
        activeId={activeTab}
        ariaLabel="Información del centro de ayuda"
        onChange={changeTab}
        tabs={[
          {
            id: TAB_IDS.SYSTEM,
            label: 'Sistema',
            icon: 'bi bi-boxes',
            panelId: 'help-system-panel',
          },
          {
            id: TAB_IDS.ROLE,
            label: 'Mi rol',
            icon: 'bi bi-person-badge',
            panelId: 'help-role-panel',
          },
        ]}
      />

      {activeTab === TAB_IDS.SYSTEM ? (
        <section
          id="help-system-panel"
          role="tabpanel"
          aria-labelledby={`${TAB_IDS.SYSTEM}-tab`}
          className="help-system-grid"
        >
          <article className="help-intro help-panel--wide">
            <div className="help-intro__icon" aria-hidden="true">
              <i className="bi bi-boxes" />
            </div>
            <div className="help-intro__heading">
              <span className="help-eyebrow">TechSupply SCM</span>
              <h2>Gestión coordinada de la operación outbound</h2>
            </div>
            <p className="help-intro__description">
              El sistema conecta la gestión comercial, la preparación en bodega,
              la planificación logística y la entrega al cliente dentro de un flujo
              trazable y protegido por roles.
            </p>
          </article>

          <section className="help-panel">
            <header className="help-panel__heading">
              <div>
                <span>Cómo trabajar</span>
                <h3>Flujo recomendado</h3>
                <p>Una secuencia simple para utilizar el sistema con seguridad.</p>
              </div>
            </header>
            <ol className="help-steps">
              {SYSTEM_STEPS.map((step, index) => (
                <li key={step.title} className="help-step">
                  <span className="help-step__number">{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="help-panel">
            <header className="help-panel__heading">
              <div>
                <span>Principios</span>
                <h3>Qué puedes esperar</h3>
                <p>Reglas comunes que mantienen una sola identidad y operación.</p>
              </div>
            </header>
            <div className="help-practices-grid">
              {SYSTEM_PRINCIPLES.map((principle) => (
                <article key={principle.title} className="help-practice-card">
                  <i className={`bi ${principle.icon}`} aria-hidden="true" />
                  <div>
                    <strong>{principle.title}</strong>
                    <p>{principle.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : (
        <section
          id="help-role-panel"
          role="tabpanel"
          aria-labelledby={`${TAB_IDS.ROLE}-tab`}
          className="help-role-grid"
        >
          <article className="help-role-card help-panel--wide">
            <div className="help-role-card__icon" aria-hidden="true">
              <i className={`bi ${experience.icon}`} />
            </div>
            <div className="help-role-card__copy">
              <span>Rol {roleLabel}</span>
              <h2>{experience.objective}</h2>
            </div>
            <p className="help-role-card__description">
              {experience.focusDescription}
            </p>
          </article>

          {experience.scopeNotice && (
            <article className="help-scope-notice help-panel--wide">
              <i className="bi bi-info-circle" aria-hidden="true" />
              <div>
                <strong>Alcance informativo</strong>
                <p>{experience.scopeNotice}</p>
              </div>
            </article>
          )}

          <section className="help-panel">
            <header className="help-panel__heading">
              <div>
                <span>Responsabilidades</span>
                <h3>Qué corresponde a tu rol</h3>
              </div>
            </header>
            <ul className="help-responsibilities">
              {experience.responsibilities.map((responsibility) => (
                <li key={responsibility}>
                  <i className="bi bi-check2" aria-hidden="true" />
                  <div>
                    <strong>{responsibility}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="help-panel">
            <header className="help-panel__heading">
              <div>
                <span>Buenas prácticas</span>
                <h3>Trabaja con seguridad</h3>
              </div>
            </header>
            <div className="help-practices-grid">
              {experience.goodPractices.map((practice) => (
                <article key={practice} className="help-practice-card">
                  <i className="bi bi-shield-check" aria-hidden="true" />
                  <div>
                    <strong>{practice}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="help-panel help-panel--wide">
            <header className="help-panel__heading">
              <div>
                <span>Navegación</span>
                <h3>Módulos disponibles</h3>
                <p>Accesos operativos visibles para el rol {roleLabel}.</p>
              </div>
            </header>

            {modules.length ? (
              <div className="help-modules-grid">
                {modules.map((module) => (
                  <Link
                    key={module.id}
                    className="help-module-card"
                    to={module.path}
                  >
                    <i className={`bi ${module.icon}`} aria-hidden="true" />
                    <div>
                      <strong>{module.label}</strong>
                      <p>{module.description}</p>
                    </div>
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="help-scope-notice">
                <i className="bi bi-layout-sidebar-inset" aria-hidden="true" />
                <div>
                  <strong>Sin módulos operativos en Outbound</strong>
                  <p>
                    Tu sesión conserva el Dashboard y este Centro de ayuda como
                    espacios informativos hasta que el dominio correspondiente sea implementado.
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>
      )}
    </div>
  );
}

export default HelpCenterPage;
