import axios from 'axios';

import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';

const createAxiosError = (status: number) =>
  new axios.AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status,
      statusText: '',
      data: {},
      headers: {},
      config: {
        headers: new axios.AxiosHeaders(),
      },
    },
  );

const createAxiosCodeError = (code: string) =>
  new axios.AxiosError('Network error', code, undefined, undefined);

describe('classifyFailure', () => {
  it('should classify 400 as param_error', () => {
    expect(classifyFailure(createAxiosError(400))).toBe('param_error');
  });

  it('should classify 401 as hard_fail', () => {
    expect(classifyFailure(createAxiosError(401))).toBe('hard_fail');
  });

  it('should classify 403 as hard_fail', () => {
    expect(classifyFailure(createAxiosError(403))).toBe('hard_fail');
  });

  it('should classify 404 as soft_miss', () => {
    expect(classifyFailure(createAxiosError(404))).toBe('soft_miss');
  });

  it('should classify 429 as retryable_failed', () => {
    expect(classifyFailure(createAxiosError(429))).toBe('retryable_failed');
  });

  it('should classify 500 as retryable_failed', () => {
    expect(classifyFailure(createAxiosError(500))).toBe('retryable_failed');
  });

  it('should classify 503 as retryable_failed', () => {
    expect(classifyFailure(createAxiosError(503))).toBe('retryable_failed');
  });

  it('should classify ETIMEDOUT as retryable_failed', () => {
    expect(classifyFailure(createAxiosCodeError('ETIMEDOUT'))).toBe(
      'retryable_failed',
    );
  });

  it('should classify ECONNABORTED as retryable_failed', () => {
    expect(classifyFailure(createAxiosCodeError('ECONNABORTED'))).toBe(
      'retryable_failed',
    );
  });

  it('should classify ERR_NETWORK as retryable_failed', () => {
    expect(classifyFailure(createAxiosCodeError('ERR_NETWORK'))).toBe(
      'retryable_failed',
    );
  });

  it('should classify unknown status 418 as hard_fail', () => {
    expect(classifyFailure(createAxiosError(418))).toBe('hard_fail');
  });

  it('should classify non-axios error as hard_fail', () => {
    expect(classifyFailure(new Error('boom'))).toBe('hard_fail');
  });
});
