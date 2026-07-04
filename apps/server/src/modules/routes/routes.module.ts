import { Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { RoutesController } from './routes.controller'
import { RoutesService } from './routes.service'

@Module({
  imports: [DiscoveryModule],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
