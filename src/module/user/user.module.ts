import { Global, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { GlobalAuthModule } from 'src/common/modules/auth.global.module';
import { ValidateHeaderMeddelware } from 'src/common/middleware/services/validateHeader.middleware';
import { setDefaulteLangauge } from 'src/common/middleware/func/setLangauge.func';
import { CloudService } from 'src/common/multer/cloud.service';

@Module({
  imports:[],
  controllers: [UserController],
  providers: [UserService,CloudService],
})
export class UserModule {
   configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(setDefaulteLangauge,ValidateHeaderMeddelware)
      .forRoutes({path:'user/profile',method:RequestMethod.GET});
  }
}
