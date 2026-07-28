import {
  StatusBadge,
} from '../../../shared/ui';

import {
  getPreparationProgress,
  getPreparationStatusMeta,
} from '../bodega.utils';

function PreparationStatusBadge({ pedido }) {
  const progress = getPreparationProgress(pedido);
  const meta = getPreparationStatusMeta(progress.status);

  return (
    <StatusBadge tone={meta.tone} size="sm">
      {meta.label}
    </StatusBadge>
  );
}

export default PreparationStatusBadge;
