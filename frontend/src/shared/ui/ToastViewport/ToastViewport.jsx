import {
  ToastContainer,
} from 'react-toastify';

import {
  usePreferences,
} from '../../hooks/usePreferences';

function ToastViewport() {
  const {
    resolvedTheme,
  } = usePreferences();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme={resolvedTheme}
      limit={4}
    />
  );
}

export default ToastViewport;
