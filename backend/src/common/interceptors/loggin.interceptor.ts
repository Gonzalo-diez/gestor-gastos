import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const t0 = Date.now();
    return next.handle().pipe(tap(() => console.log(`${req.method} ${req.url} ${Date.now()-t0}ms`)));
  }
}