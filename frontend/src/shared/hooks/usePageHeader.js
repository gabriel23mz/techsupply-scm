import {
  useContext,
  useEffect,
} from 'react';

import PageHeaderContext from '../contexts/page-header-context';

export function usePageHeader(config) {
  const context = useContext(PageHeaderContext);

  if (!context) {
    throw new Error(
      'usePageHeader debe utilizarse dentro de PageHeaderProvider',
    );
  }

  const { registerPageHeader } = context;

  useEffect(
    () => registerPageHeader(config),
    [config, registerPageHeader],
  );
}

export default usePageHeader;
