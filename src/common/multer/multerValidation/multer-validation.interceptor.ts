import { BadRequestException, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

export class MulterValidationInterceptor implements NestInterceptor {
  public mainKey: string;

  constructor(mainKey?: string) {
    this.mainKey = mainKey || 'file';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    console.log('Checking files for key:', this.mainKey);

    const hasSingleFile = !!req.file;
    const hasFiles = !!req.files && Object.values(req.files).length > 0;
    const hasMainKeyFiles = !!req.files?.[this.mainKey]?.length;

    if (!hasSingleFile && !hasFiles && !hasMainKeyFiles) {
      throw new BadRequestException(`missing file: ${this.mainKey}`);
    }

    return next.handle();
  }
}
