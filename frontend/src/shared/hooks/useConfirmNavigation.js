import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function useConfirmNavigation() {
  const navigate = useNavigate();

  const [pendingPath, setPendingPath] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const requestNavigation = (path) => {
    setPendingPath(path);
    setShowConfirm(true);
  };

  const confirmNavigation = () => {
    if (pendingPath) {
      navigate(pendingPath);
    }

    setPendingPath(null);
    setShowConfirm(false);
  };

  const cancelNavigation = () => {
    setPendingPath(null);
    setShowConfirm(false);
  };

  return {
    showConfirm,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
  };
}

export default useConfirmNavigation;


