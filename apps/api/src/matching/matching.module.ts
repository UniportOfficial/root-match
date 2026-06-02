import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { AiMatchingService } from './services/ai-matching.service';
import { VectorSearchService } from './services/vector-search.service';

@Module({
  controllers: [MatchingController],
  providers: [VectorSearchService, AiMatchingService],
  exports: [AiMatchingService],
})
export class MatchingModule {}
