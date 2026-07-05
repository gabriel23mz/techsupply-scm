import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

function AppProviders({ children }) {
  return (
    <BrowserRouter>
      {children}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </BrowserRouter>
  );
}

export default AppProviders;


