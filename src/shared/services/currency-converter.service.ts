import axios, { AxiosResponse } from 'axios';
import { winstonLogger } from '../logger/winston.logger';
import { envConfig } from '../settings/env-config';
import {
  CurrencyConverterRequest,
  CurrencyConverterResponse,
} from './types/currency-converter';

export class CurrencyConverterApiService {
  private readonly logger = winstonLogger(CurrencyConverterApiService.name);
  private readonly apiUrl = envConfig.forexApiUrl;
  private readonly apikey = envConfig.forexApiKey;

  async convertCurrency(
    request: CurrencyConverterRequest,
  ): Promise<string | number> {
    try {
      const { from, to } = request;
      const url = `${this.apiUrl}/aggs/ticker/C:${from}${to}/prev`;
      const { data }: Awaited<AxiosResponse<CurrencyConverterResponse>> =
        await axios.get(url, {
          params: { adjusted: true },
          headers: { Authorization: `Bearer ${this.apikey}` },
        });

      return data.results[0].c;
    } catch (error) {
      this.logger.error('request failed', error);
      return undefined;
    }
  }
}
