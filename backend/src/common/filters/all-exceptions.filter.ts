import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message =
          (Array.isArray(resObj.message)
            ? resObj.message.join('; ')
            : (resObj.message as string)) ||
          (resObj.errorMessage as string) ||
          exception.message;
        details = resObj.details ?? null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Never log or expose sensitive credentials
    this.logger.error(
      `HTTP ${status} on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      errorMessage: message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
