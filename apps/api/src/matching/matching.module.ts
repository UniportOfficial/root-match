import { Module } from '@nestjs/common';
import { AiMatchingService } from './services/ai-matching.service';
import { VectorSearchService } from './services/vector-search.service';

@Module({
  providers: [VectorSearchService, AiMatchingService],
  exports: [AiMatchingService],
})
export class MatchingModule {}
