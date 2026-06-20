export const successResponse = (
  res,
  data = null,
  message = 'Operación realizada correctamente',
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res,
  message = 'Error interno del servidor',
  statusCode = 500,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
