import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './module/auth/auth.controller';
import { AuthModule } from './module/auth/auth.module';
import { resolve } from 'node:path';
import { log } from 'node:console';
import { UserController } from './module/user/user.controller';
import { UserModule } from './module/user/user.module';
import { GlobalAuthModule } from './common/modules/auth.global.module';
import { PatientModule } from './module/patient/patient.module';
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath:resolve("./config/.env.dev"),isGlobal: true }),
     MongooseModule.forRoot(process.env.DB_URL!),
     GlobalAuthModule,
     AuthModule,
     UserModule,
     PatientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
