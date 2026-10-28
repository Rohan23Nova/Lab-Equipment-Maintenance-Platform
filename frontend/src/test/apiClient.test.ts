import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiClientError } from '@/lib/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches system status and parses successful response', async () => {
    const mockStatusResponse = {
      success: true,
      message: 'System operational',
      data: {
        application: 'LabLedger Platform',
        version: '0.1.0-SNAPSHOT',
        status: 'UP',
        serverTimeUtc: '2026-10-28T15:00:00Z',
        activeProfiles: ['dev'],
        database: {
          connected: true,
          product: 'PostgreSQL',
          version: '16.4',
        },
      },
      timestamp: '2026-10-28T15:00:00Z',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockStatusResponse,
    } as unknown as Response);

    const result = await apiClient.getSystemStatus();
    expect(result.data.application).toBe('LabLedger Platform');
    expect(result.data.database.connected).toBe(true);
  });

  it('parses RFC 7807 ProblemDetail on HTTP 400 validation error', async () => {
    const problemDetail = {
      type: 'https://labledger.university.edu/errors/validation-failed',
      title: 'Validation Failed',
      status: 400,
      detail: 'Request validation failed for one or more fields.',
      invalidParams: [
        { field: 'email', rejectedValue: 'bad', reason: 'Must be a valid email address' },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => problemDetail,
    } as unknown as Response);

    await expect(apiClient.post('/users', { email: 'bad' })).rejects.toThrow(ApiClientError);

    try {
      await apiClient.post('/users', { email: 'bad' });
    } catch (err: unknown) {
      const error = err as ApiClientError;
      expect(error.problem.status).toBe(400);
      expect(error.problem.invalidParams).toHaveLength(1);
      expect(error.problem.invalidParams?.[0].field).toBe('email');
    }
  });
});
