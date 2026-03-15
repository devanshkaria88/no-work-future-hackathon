import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ClaudeService } from '../../common/llm/claude.service';
import { BlackboardService } from '../blackboard/blackboard.service';
import { BlackboardSection } from '../blackboard/blackboard.types';
import { BlackboardGateway } from '../blackboard/blackboard.gateway';
import { SCOUT_SYSTEM_PROMPT } from './scout.prompt';
import { OpportunityAssessment } from '../../common/types';

@Injectable()
export class ScoutService {
  private readonly logger = new Logger(ScoutService.name);

  constructor(
    private readonly claude: ClaudeService,
    @Inject(forwardRef(() => BlackboardService))
    private readonly blackboard: BlackboardService,
    private readonly gateway: BlackboardGateway,
  ) {}

  async analyze(userProfile: any): Promise<OpportunityAssessment> {
    this.logger.log(`Analyzing opportunities for user: ${userProfile.name}`);

    const existingListings = this.blackboard.read(
      BlackboardSection.ACTIVE_LISTINGS,
    );
    const demandSignals = this.blackboard.read(
      BlackboardSection.DEMAND_SIGNALS,
    );

    const inputMessage = JSON.stringify({
      user: {
        skills: userProfile.skills,
        location: {
          area: userProfile.locationArea,
          lat: userProfile.lat,
          lng: userProfile.lng,
        },
        previousRole: userProfile.previousRole,
      },
      nearby_listings: existingListings,
      recent_demand_signals: demandSignals,
      current_day: new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    const result = await this.claude.chatJSON<OpportunityAssessment>({
      system: SCOUT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: inputMessage }],
    });

    // Write each opportunity to the blackboard
    for (const opp of result.opportunities) {
      this.blackboard.write(BlackboardSection.OPPORTUNITIES, {
        ...opp,
        userId: userProfile.id,
        userProfile,
      });
    }

    this.gateway.emit('agent:scout-found', {
      userId: userProfile.id,
      opportunityCount: result.opportunities.length,
    });

    return result;
  }
}
