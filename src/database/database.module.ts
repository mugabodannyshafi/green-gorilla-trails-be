import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseEnvBool } from './utils/parse-env-bool';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        // Env is always a string; `"false"` must not be passed raw to TypeORM (it is truthy in JS).
        synchronize:
          configService.get<string>('NODE_ENV') === 'development'
            ? parseEnvBool(configService.get<string>('DB_SYNCHRONIZE'), true)
            : false,
        migrationsRun: configService.get<string>('NODE_ENV') === 'production' ? true : false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
