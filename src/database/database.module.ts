import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseEnvBool } from './utils/parse-env-bool';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Default off: env is always a string; `"false"` was truthy before parseEnvBool.
        // Turn on only when DB_SYNCHRONIZE=true (e.g. empty local DB).
        const syncDefault = false;
        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT') ?? configService.get<number>('DB_PORT') ?? 3306),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: parseEnvBool(
            configService.get<string>('DB_SYNCHRONIZE'),
            syncDefault,
          ),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
