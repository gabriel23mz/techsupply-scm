import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  showError,
} from '../../../shared/utils/toast';

import {
  useAuth,
} from '../../../shared/hooks/useAuth';

import {
  getLandingPath,
} from '../../../shared/routing/access';

import '../auth.css';

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const {
    isAuthenticating,
    login,
  } = useAuth();

  const [formData, setFormData] =
    useState({
      correo: '',
      password: '',
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [attemptedFields, setAttemptedFields] =
    useState({
      correo: false,
      password: false,
    });

  const [shakeField, setShakeField] =
    useState('');

  useEffect(() => {
    document.title =
      'Iniciar sesión | TechSupply SCM';

    emailRef.current?.focus();
  }, []);

  const normalizedEmail =
    formData.correo.trim();

  const emailHasText =
    normalizedEmail.length > 0;

  const passwordHasText =
    formData.password.length > 0;

  const emailIsValid =
    EMAIL_PATTERN.test(
      normalizedEmail,
    );

  const passwordIsValid =
    formData.password.length >= 6;

  const formIsValid =
    emailIsValid &&
    passwordIsValid;

  const emailState = useMemo(() => {
    if (!emailHasText) {
      return attemptedFields.correo
        ? 'invalid'
        : 'idle';
    }

    return emailIsValid
      ? 'valid'
      : 'invalid';
  }, [
    attemptedFields.correo,
    emailHasText,
    emailIsValid,
  ]);

  const passwordState = useMemo(() => {
    if (!passwordHasText) {
      return attemptedFields.password
        ? 'invalid'
        : 'idle';
    }

    return passwordIsValid
      ? 'valid'
      : 'invalid';
  }, [
    attemptedFields.password,
    passwordHasText,
    passwordIsValid,
  ]);

  const triggerFieldFeedback = (
    field,
  ) => {
    setAttemptedFields(
      (current) => ({
        ...current,
        [field]: true,
      }),
    );

    setShakeField(field);

    window.setTimeout(() => {
      setShakeField('');
    }, 260);
  };

  const updateField = (
    field,
    value,
  ) => {
    setFormData(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    if (value.length > 0) {
      setAttemptedFields(
        (current) => ({
          ...current,
          [field]: true,
        }),
      );
    }
  };

  const handleEmailKeyDown = (
    event,
  ) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (emailIsValid) {
      passwordRef.current?.focus();
      return;
    }

    triggerFieldFeedback('correo');
    emailRef.current?.focus();
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!formIsValid) {
      if (!emailIsValid) {
        triggerFieldFeedback('correo');
        emailRef.current?.focus();
        return;
      }

      triggerFieldFeedback('password');
      passwordRef.current?.focus();
      return;
    }

    try {
      const nextSession = await login({
        correo:
          normalizedEmail.toLowerCase(),
        password:
          formData.password,
      });

      const previousLocation =
        location.state?.from;

      const destination =
        typeof previousLocation === 'string'
          ? previousLocation
          : previousLocation?.pathname
            ? `${previousLocation.pathname}${previousLocation.search ?? ''}${previousLocation.hash ?? ''}`
            : getLandingPath(nextSession.user);

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      showError(
        error.message ||
          'No fue posible iniciar sesión.',
      );
    }
  };

  const getEmailMessage = () => {
    if (emailState === 'valid') {
      return 'Formato de correo válido.';
    }

    if (
      emailState === 'invalid' &&
      !emailHasText
    ) {
      return 'Escribe tu correo electrónico.';
    }

    if (emailState === 'invalid') {
      return 'Usa un formato como usuario@empresa.com.';
    }

    return 'Utiliza el correo registrado en el sistema.';
  };

  const getPasswordMessage = () => {
    if (passwordState === 'valid') {
      return 'Contraseña lista para validar.';
    }

    if (
      passwordState === 'invalid' &&
      !passwordHasText
    ) {
      return 'Escribe tu contraseña.';
    }

    if (passwordState === 'invalid') {
      const remaining = Math.max(
        6 - formData.password.length,
        0,
      );

      return `Faltan ${remaining} ${
        remaining === 1
          ? 'carácter'
          : 'caracteres'
      }.`;
    }

    return 'Debe contener al menos 6 caracteres.';
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <i className="bi bi-boxes" />
          </div>

          <div>
            <strong>TechSupply</strong>

            <span>
              Supply Chain Management
            </span>
          </div>
        </div>

        <div className="auth-brand-message">
          <span>
            Operación Outbound
          </span>

          <h1>
            Control logístico en una sola plataforma.
          </h1>

          <p>
            Administra clientes, pedidos, rutas,
            jornadas y despachos con información
            centralizada y trazabilidad operativa.
          </p>
        </div>

        <div className="auth-capabilities">
          <article>
            <i className="bi bi-diagram-3" />

            <div>
              <strong>
                Flujo integrado
              </strong>

              <span>
                Del pedido a la entrega.
              </span>
            </div>
          </article>

          <article>
            <i className="bi bi-signpost-split" />

            <div>
              <strong>
                Rutas optimizadas
              </strong>

              <span>
                Seguimiento de jornadas.
              </span>
            </div>
          </article>

          <article>
            <i className="bi bi-shield-check" />

            <div>
              <strong>
                Acceso controlado
              </strong>

              <span>
                Sesión asociada al usuario.
              </span>
            </div>
          </article>
        </div>

        <small>
          TechSupply SCM · Sistema académico
          de gestión logística
        </small>
      </section>

      <section className="auth-form-panel">
        <form
          className="auth-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <header className="auth-card-header">
            <div className="auth-mobile-brand">
              <i className="bi bi-boxes" />
              TechSupply SCM
            </div>

            <div className="auth-card-kicker">
              <i className="bi bi-shield-lock" />
              Acceso seguro
            </div>

            <h2>Iniciar sesión</h2>

            <p>
              Ingresa las credenciales de un usuario
              activo para acceder al centro de control.
            </p>
          </header>

          <div
            className={`auth-field ${
              shakeField === 'correo'
                ? 'auth-field--shake'
                : ''
            }`}
          >
            <div className="auth-label-row">
              <label
                htmlFor="login-email"
                className="form-label"
              >
                Correo electrónico
              </label>

              {emailState !== 'idle' && (
                <span
                  className={`auth-field-state ${emailState}`}
                >
                  <i
                    className={`bi ${
                      emailState === 'valid'
                        ? 'bi-check-circle-fill'
                        : 'bi-exclamation-circle-fill'
                    }`}
                  />

                  {emailState === 'valid'
                    ? 'Válido'
                    : 'Revisar'}
                </span>
              )}
            </div>

            <div
              className={`auth-input auth-input--${emailState}`}
            >
              <i className="bi bi-envelope" />

              <input
                ref={emailRef}
                id="login-email"
                type="email"
                className="form-control"
                value={formData.correo}
                placeholder="usuario@techsupply.com"
                autoComplete="email"
                aria-invalid={
                  emailState === 'invalid'
                }
                aria-describedby="email-help"
                onChange={(event) =>
                  updateField(
                    'correo',
                    event.target.value,
                  )
                }
                onBlur={() => {
                  if (emailHasText) {
                    setAttemptedFields(
                      (current) => ({
                        ...current,
                        correo: true,
                      }),
                    );
                  }
                }}
                onKeyDown={handleEmailKeyDown}
              />

              {emailState !== 'idle' && (
                <i
                  className={`bi auth-input-status ${
                    emailState === 'valid'
                      ? 'bi-check-circle-fill'
                      : 'bi-exclamation-circle-fill'
                  }`}
                />
              )}
            </div>

            <span
              id="email-help"
              className={`auth-helper auth-helper--${emailState}`}
            >
              {getEmailMessage()}
            </span>
          </div>

          <div
            className={`auth-field ${
              shakeField === 'password'
                ? 'auth-field--shake'
                : ''
            }`}
          >
            <div className="auth-label-row">
              <label
                htmlFor="login-password"
                className="form-label"
              >
                Contraseña
              </label>

              {passwordState !== 'idle' && (
                <span
                  className={`auth-field-state ${passwordState}`}
                >
                  <i
                    className={`bi ${
                      passwordState === 'valid'
                        ? 'bi-check-circle-fill'
                        : 'bi-exclamation-circle-fill'
                    }`}
                  />

                  {passwordState === 'valid'
                    ? 'Lista'
                    : 'Incompleta'}
                </span>
              )}
            </div>

            <div
              className={`auth-input auth-input--${passwordState} ${
                passwordHasText
                  ? 'auth-input--has-action'
                  : ''
              }`}
            >
              <i className="bi bi-lock" />

              <input
                ref={passwordRef}
                id="login-password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                className="form-control"
                value={formData.password}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={
                  passwordState === 'invalid'
                }
                aria-describedby="password-help"
                onChange={(event) =>
                  updateField(
                    'password',
                    event.target.value,
                  )
                }
                onBlur={() => {
                  if (passwordHasText) {
                    setAttemptedFields(
                      (current) => ({
                        ...current,
                        password: true,
                      }),
                    );
                  }
                }}
              />

              {passwordHasText && (
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    showPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                >
                  <i
                    className={`bi ${
                      showPassword
                        ? 'bi-eye-slash'
                        : 'bi-eye'
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="auth-password-feedback">
              <span
                id="password-help"
                className={`auth-helper auth-helper--${passwordState}`}
              >
                {getPasswordMessage()}
              </span>

              {passwordHasText && (
                <div
                  className={`auth-password-progress ${passwordState}`}
                  aria-hidden="true"
                >
                  <span
                    style={{
                      width: `${Math.min(
                        (formData.password.length / 6) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={
              !formIsValid ||
              isAuthenticating
            }
          >
            {isAuthenticating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Validando acceso...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2" />
                Ingresar al sistema
              </>
            )}
          </button>

          <div className="auth-submit-hint">
            <i className="bi bi-keyboard" />

            <span>
              Completa ambos campos y presiona Enter para ingresar.
            </span>
          </div>

          <div className="auth-security-note">
            <i className="bi bi-shield-check" />

            <span>
              Tus credenciales se validan de forma segura en el servidor.
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
