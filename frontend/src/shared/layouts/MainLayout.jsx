import {
  useEffect,
  useState,
} from 'react';

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

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    const body = document.body;

    body.classList.toggle(
      'app-scroll-locked',
      mobileSidebarOpen,
    );

    return () => {
      body.classList.remove('app-scroll-locked');
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    }

    function handleDesktopResize() {
      if (window.innerWidth > 960) {
        setMobileSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleDesktopResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleDesktopResize);
    };
  }, []);

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
      } ${
        mobileSidebarOpen
          ? 'mobile-sidebar-open'
          : ''
      }`}
    >
      <a
        href="#main-content"
        className="app-skip-link visually-hidden-focusable"
      >
        Saltar al contenido principal
      </a>

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <button
        type="button"
        className="sidebar-mobile-overlay"
        aria-label="Cerrar menú de navegación"
        tabIndex={mobileSidebarOpen ? 0 : -1}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <div className="app-main">
        <Topbar
          onOpenNavigation={() => setMobileSidebarOpen(true)}
        />

        <main
          id="main-content"
          className="app-content"
          tabIndex="-1"
        >
          <div className="app-page-container">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
