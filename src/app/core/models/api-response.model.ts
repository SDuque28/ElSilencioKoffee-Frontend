export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  pagination?: ApiPagination;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.success;
}
