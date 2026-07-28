import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import PageHeaderContext from './page-header-context';

export function PageHeaderProvider({ children }) {
  const [pageHeader, setPageHeader] = useState(null);
  const activeRegistrationRef = useRef(null);

  const registerPageHeader = useCallback((nextHeader) => {
    const registration = Symbol('page-header');

    activeRegistrationRef.current = registration;
    setPageHeader(nextHeader ?? null);

    return () => {
      if (activeRegistrationRef.current !== registration) {
        return;
      }

      activeRegistrationRef.current = null;
      setPageHeader(null);
    };
  }, []);

  const value = useMemo(
    () => ({
      pageHeader,
      registerPageHeader,
    }),
    [pageHeader, registerPageHeader],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}
