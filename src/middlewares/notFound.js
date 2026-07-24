import {
  NotFoundError,
} from '../utils/errors.js';

const notFound = (req, res, next) => {
  return next(
    new NotFoundError(
      'Ruta no encontrada',
      'RUTA_NO_ENCONTRADA',
    ),
  );
};

export default notFound;
