import { Body, Controller, Post } from '@nestjs/common';
import type {
  FactoryRecommendation,
  QuoteRequestDraft,
} from '@rootmatching/shared';
import { AiMatchingService } from './services/ai-matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly aiMatching: AiMatchingService) {}

  @Post('recommend')
  async recommend(
    @Body() request: QuoteRequestDraft,
  ): Promise<FactoryRecommendation[]> {
    return this.aiMatching.matchFactories(request);
  }
}
