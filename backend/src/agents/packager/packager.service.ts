import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ClaudeService } from '../../common/llm/claude.service';
import { BlackboardService } from '../blackboard/blackboard.service';
import { BlackboardGateway } from '../blackboard/blackboard.gateway';
import { PACKAGER_SYSTEM_PROMPT } from './packager.prompt';
import { PackagerOutput } from '../../common/types';

@Injectable()
export class PackagerService {
  private readonly logger = new Logger(PackagerService.name);

  constructor(
    private readonly claude: ClaudeService,
    @Inject(forwardRef(() => BlackboardService))
    private readonly blackboard: BlackboardService,
    private readonly gateway: BlackboardGateway,
  ) {}

  async draft(opportunity: any): Promise<PackagerOutput> {
    this.logger.log(`Drafting listing for opportunity: ${opportunity.title}`);

    const inputMessage = JSON.stringify({
      user: {
        name: opportunity.userProfile?.name,
        skills: opportunity.userProfile?.skills,
        previousRole: opportunity.userProfile?.previousRole,
        location: opportunity.userProfile?.locationArea,
      },
      opportunity: {
        category: opportunity.category,
        title: opportunity.title,
        demand_score: opportunity.demand_score,
        suggested_price_range: opportunity.suggested_price_range,
        best_time_windows: opportunity.best_time_windows,
        location_suggestion: opportunity.location_suggestion,
        why_this_user: opportunity.why_this_user,
      },
    });

    const result = await this.claude.chatJSON<PackagerOutput>({
      system: PACKAGER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: inputMessage }],
    });

    this.gateway.emit('agent:packager-ready', {
      userId: opportunity.userId,
      listingDraft: result.listing,
    });

    return result;
  }
}
