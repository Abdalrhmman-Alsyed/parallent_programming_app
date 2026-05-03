import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(10000),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timed out'));
        }
        return throwError(() => error);
      }),
    );
  }
}
