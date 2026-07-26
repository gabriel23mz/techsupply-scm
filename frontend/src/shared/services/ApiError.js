export class ApiError extends Error {
  constructor({
    message,
    status = null,
    code = 'API_ERROR',
    details = undefined,
    data = undefined,
    method = undefined,
    url = undefined,
    cause = undefined,
  }) {
    super(message, cause ? { cause } : undefined);

    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
    this.method = method;
    this.url = url;
    this.isApiError = true;
  }
}

export function createApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const responseData = error?.response?.data;
  const status = error?.response?.status ?? null;

  const message =
    responseData?.message ??
    responseData?.error ??
    error?.message ??
    'Error de comunicación con el servidor';

  return new ApiError({
    message:
      status === 403
        ? 'Acceso denegado. Tu usuario no tiene permiso para esta operación.'
        : message,
    status,
    code:
      responseData?.code ??
      error?.code ??
      'API_ERROR',
    details: responseData?.details,
    data: responseData,
    method: error?.config?.method,
    url: error?.config?.url,
    cause: error,
  });
}

export function isApiError(error) {
  return Boolean(error?.isApiError);
}
