import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ProxyService } from './proxy.service';
import { Role, UserPayload } from '@app/common';

const mockHttpService = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

const mockUser: UserPayload = {
  sub: '42',
  email: 'a@a.com',
  role: Role.RECRUITER,
};

describe('ProxyService', () => {
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    jest.clearAllMocks();
  });

  describe('HTTP method routing', () => {
    it('calls httpService.get for GET requests', async () => {
      mockHttpService.get.mockReturnValue(of({ data: { ok: true } }));

      const result: unknown = await service.forward(
        'GET',
        'http://svc/resource',
        null,
      );

      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true });
    });

    it('calls httpService.post for POST requests and passes body', async () => {
      mockHttpService.post.mockReturnValue(of({ data: { id: 1 } }));

      const result: unknown = await service.forward(
        'POST',
        'http://svc/resource',
        {
          name: 'job',
        },
      );

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      const [url, body] = mockHttpService.post.mock.calls[0] as [
        string,
        unknown,
        unknown,
      ];
      expect(url).toBe('http://svc/resource');
      expect(body).toEqual({ name: 'job' });
      expect(result).toEqual({ id: 1 });
    });

    it('calls httpService.patch for PATCH requests and passes body', async () => {
      mockHttpService.patch.mockReturnValue(of({ data: { updated: true } }));

      await service.forward('PATCH', 'http://svc/resource', {
        status: 'active',
      });

      expect(mockHttpService.patch).toHaveBeenCalledTimes(1);
      const [, body] = mockHttpService.patch.mock.calls[0] as [
        string,
        unknown,
        unknown,
      ];
      expect(body).toEqual({ status: 'active' });
    });

    it('calls httpService.delete for DELETE requests', async () => {
      mockHttpService.delete.mockReturnValue(of({ data: null }));

      await service.forward('DELETE', 'http://svc/resource', null);

      expect(mockHttpService.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('header forwarding', () => {
    it('includes user identity headers when user is provided', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      await service.forward('GET', 'http://svc/resource', null, mockUser);

      const [[, config]] = mockHttpService.get.mock.calls as [
        [unknown, { headers: Record<string, string> }],
      ];
      expect(config.headers['x-user-id']).toBe('42');
      expect(config.headers['x-user-email']).toBe('a@a.com');
      expect(config.headers['x-user-role']).toBe(Role.RECRUITER);
    });

    it('omits user identity headers when user is not provided', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      await service.forward('GET', 'http://svc/resource', null);

      const [[, config]] = mockHttpService.get.mock.calls as [
        [unknown, { headers: Record<string, string> }],
      ];
      expect(config.headers['x-user-id']).toBeUndefined();
      expect(config.headers['x-user-email']).toBeUndefined();
      expect(config.headers['x-user-role']).toBeUndefined();
    });

    it('includes x-correlation-id header when correlationId is provided', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      await service.forward(
        'GET',
        'http://svc/resource',
        null,
        undefined,
        'corr-123',
      );

      const [[, config]] = mockHttpService.get.mock.calls as [
        [unknown, { headers: Record<string, string> }],
      ];
      expect(config.headers['x-correlation-id']).toBe('corr-123');
    });

    it('omits x-correlation-id header when correlationId is not provided', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      await service.forward('GET', 'http://svc/resource', null);

      const [[, config]] = mockHttpService.get.mock.calls as [
        [unknown, { headers: Record<string, string> }],
      ];
      expect(config.headers['x-correlation-id']).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('re-throws HttpException with same status and body when downstream returns an error response', async () => {
      const downstreamError = {
        response: { data: { message: 'Not found' }, status: 404 },
      };
      mockHttpService.get.mockReturnValue(throwError(() => downstreamError));

      await expect(
        service.forward('GET', 'http://svc/resource', null),
      ).rejects.toThrow(HttpException);

      await expect(
        service.forward('GET', 'http://svc/resource', null),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('throws BadGatewayException when the downstream service is unreachable', async () => {
      const networkError = new Error('ECONNREFUSED');
      mockHttpService.get.mockReturnValue(throwError(() => networkError));

      await expect(
        service.forward('GET', 'http://svc/resource', null),
      ).rejects.toThrow(BadGatewayException);
    });
  });
});
