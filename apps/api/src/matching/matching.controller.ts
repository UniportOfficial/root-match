import { Body, Controller, Post } from '@nestjs/common';
import { seconds, Throttle } from '@nestjs/throttler';
import type { FactoryRecommendation } from '@rootmatching/shared';
import { QuoteRequestDraftDto } from './dto/quote-request-draft.dto';
import { AiMatchingService } from './services/ai-matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly aiMatching: AiMatchingService) {}

  @Post('recommend')
  @Throttle({ expensive: { limit: 5, ttl: seconds(60) } })
  async recommend(
    @Body() body: QuoteRequestDraftDto,
  ): Promise<FactoryRecommendation[]> {
    return this.aiMatching.matchFactories(body);
  }
}
