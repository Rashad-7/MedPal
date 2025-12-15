
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';

@Injectable()
export class WatchInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next
      .handle()
      .pipe(
timeout(500),         catchError(err => {
        if (err instanceof TimeoutError) {
        return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
    }),
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
    );
}
}