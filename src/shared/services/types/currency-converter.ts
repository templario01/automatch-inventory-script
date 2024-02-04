export interface CurrencyConverterRequest {
  from: string;
  to: string;
}

export interface CurrencyConverterResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<Record<string, string | number>>;
  status: string;
  request_id: string;
  count: number;
}
