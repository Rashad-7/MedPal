/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setDefaulteLangauge } from './common/middleware/func/setLangauge.func';

async function bootstrap() {
  const port: number | string = process.env.PORT! ;
  const app = await NestFactory.create(AppModule);
  // app.use(setDefaulteLangauge)
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();