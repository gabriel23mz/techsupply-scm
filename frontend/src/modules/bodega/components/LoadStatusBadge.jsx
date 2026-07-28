import {
  StatusBadge,
} from '../../../shared/ui';

import {
  getLoadProgress,
  getLoadStatusMeta,
} from '../bodega.utils';

function LoadStatusBadge({ jornada, size = 'sm' }) {
  const progress = getLoadProgress(jornada);
  const meta = getLoadStatusMeta(progress.status);

  return (
    <StatusBadge tone={meta.tone} size={size}>
      {meta.label}
    </StatusBadge>
  );
}

export default LoadStatusBadge;
