import { MulterValidationInterceptor } from './multer-validation.interceptor';

describe('MulterValidationInterceptor', () => {
  it('should be defined', () => {
    expect(new MulterValidationInterceptor()).toBeDefined();
  });
});
