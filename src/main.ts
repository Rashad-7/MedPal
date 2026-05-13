
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setDefaulteLangauge } from './common/middleware/func/setLangauge.func';

async function bootstrap() {
  const port: number | string = process.env.PORT! ;
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: false,
  });
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();