class LogisticaError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict | None = None,
        status_code: int = 400,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code


def error_response(error: LogisticaError) -> dict:
    return {
        "error": {
            "code": error.code,
            "message": error.message,
            "details": error.details,
        },
    }
