import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';

function makeHost(status: jest.Mock, json: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status, json: () => ({ json }) }),
      getRequest: () => ({ url: '/test' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('GlobalExceptionFilter (FIND-021)', () => {
  let filter: GlobalExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let responseMock: { status: jest.Mock; json: jest.Mock };
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    responseMock = { status: statusMock, json: jsonMock };

    host = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => ({ url: '/api/v1/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('returns correct status for HttpException', () => {
    filter.catch(new HttpException('Not Found', HttpStatus.NOT_FOUND), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('flattens validation message arrays to a single string', () => {
    const ex = new HttpException(
      { message: ['email must be valid', 'password is required'], statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(ex, host);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'email must be valid, password is required' }),
    );
  });

  it('returns 500 for unhandled errors', () => {
    filter.catch(new Error('DB connection failed'), host);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('hides internal error message in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    filter.catch(new Error('secret internal info'), host);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'An unexpected error occurred' }),
    );
    process.env.NODE_ENV = originalEnv;
  });

  it('response always includes statusCode, message, timestamp, path', () => {
    filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), host);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: expect.any(String),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        path: expect.any(String),
      }),
    );
  });
});
