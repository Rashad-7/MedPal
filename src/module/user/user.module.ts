import { Global, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { GlobalAuthModule } from 'src/common/modules/auth.global.module';
import { ValidateHeaderMeddelware } from 'src/common/middleware/services/validateHeader.middleware';
import { setDefaulteLangauge } from 'src/common/middleware/func/setLangauge.func';
import { CloudService } from 'src/common/multer/cloud.service';
import { UserRepositoryService } from 'src/DB/repository/user.repository.service';
import { DoctorRepositoryService } from 'src/DB/repository/doctor.repository.service';
import { doctorModel } from 'src/DB/model/doctor.model';
import { UserModel } from 'src/DB/model/User.model';
import { ReqRepositoryService } from 'src/DB/repository/req.repository.service';
import { RequestModel } from 'src/DB/model/Req.model';
import { PatientModel } from 'src/DB/model/patient.model';
import { PatientRepositoryService } from 'src/DB/repository/patient.repository.service';

@Module({
  imports:[doctorModel,UserModel,RequestModel,PatientModel],
  controllers: [UserController],
  providers: [UserService,CloudService,UserRepositoryService,DoctorRepositoryService,ReqRepositoryService,PatientRepositoryService],
})
export class UserModule {
   configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(setDefaulteLangauge,ValidateHeaderMeddelware)
      .forRoutes({path:'user/profile',method:RequestMethod.GET});
  }
}
