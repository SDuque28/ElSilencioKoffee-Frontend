export interface ApiPagination {
  page: number;
  size: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: ApiPagination;
}
