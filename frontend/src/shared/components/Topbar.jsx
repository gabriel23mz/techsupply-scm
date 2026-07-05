import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { navigation } from '../constants/navigation.jsx';

function Topbar() {
  const menuRef = useRef(null);
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentRoute =
    navigation.find((route) => route.path === location.pathname) || navigation[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="app-topbar">
      <div>
        <h2>{currentRoute.label}</h2>
        <p>{currentRoute.description}</p>
      </div>

      <div className="topbar-actions">
        <button type="button" className="btn btn-outline-primary btn-sm">
          <i className="bi bi-arrow-clockwise me-2" />
          Actualizar datos
        </button>

        <button type="button" className="topbar-icon">
          <i className="bi bi-bell" />
        </button>

        <button type="button" className="topbar-icon">
          <i className="bi bi-gear" />
        </button>

        <div className="topbar-user-menu" ref={menuRef}>
          <button
            type="button"
            className="topbar-icon"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <i className="bi bi-person-circle" />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <strong>Admin Usuario</strong>
              <span>Operador logístico</span>
              <button
                type="button"
                onClick={() => {
                    setShowUserMenu(false);
                    // logout();
                }}
              >
                <i className="bi bi-box-arrow-right me-2" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;

