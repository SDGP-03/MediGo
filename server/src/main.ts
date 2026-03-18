import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global API prefix
    app.setGlobalPrefix('api');

    // CORS — allow the Vite dev server
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(` MediGo API running on http://localhost:${port}/api`);
}
bootstrap();
