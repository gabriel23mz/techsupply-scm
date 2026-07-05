import { NavLink } from 'react-router-dom';

import { navigation } from '../constants/navigation.jsx';

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <h1>TechSupply SCM</h1>
        <span>Logistics Management</span>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">
          <i className="bi bi-person" />
        </div>
        <div>
          <strong>Admin Usuario</strong>
          <span>Operador logístico</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;


