import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ErrorFilter<T> implements ExceptionFilter {
  readonly logger = new Logger(ErrorFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();

    // check the httpStatus code and add custom logic if you want
    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const httpMessage = exception.message ? exception.message : "Internal server error";

    this.logger.error(exception);


    response
    .status(httpStatus)
    .json({
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      message: httpMessage,
      path: request.url,
    });
  }
}
