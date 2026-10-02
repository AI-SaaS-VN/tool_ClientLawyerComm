export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
