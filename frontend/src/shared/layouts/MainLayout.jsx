import {
  usePreferences,
} from '../hooks/usePreferences';

import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

import './app-shell.css';

function MainLayout({ children }) {
  const {
    preferences,
  } = usePreferences();

  return (
    <div
      className={`app-shell ${
        preferences.sidebarCollapsed
          ? 'sidebar-collapsed'
          : ''
      } ${
        preferences.compactContent
          ? 'content-compact'
          : ''
      }`}
    >
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="app-content">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
