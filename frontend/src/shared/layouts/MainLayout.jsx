import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

function MainLayout({ children }) {
  return (
    <div className="app-shell">
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

