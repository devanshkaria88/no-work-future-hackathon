import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('api')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('matches/:userId')
  async getMatches(@Param('userId') userId: string) {
    return this.matchesService.findMatchesByUser(userId);
  }

  @Get('negotiations/:id')
  async getNegotiation(@Param('id') id: string) {
    return this.matchesService.findNegotiation(id);
  }

  @Get('negotiations/:id/transcript')
  async getTranscript(@Param('id') id: string) {
    return this.matchesService.findNegotiationTranscript(id);
  }

  @Post('negotiations/:id/approve')
  async approveNegotiation(
    @Param('id') id: string,
    @Body() body: { userId: string; approved: boolean },
  ) {
    return this.matchesService.approveNegotiation(
      id,
      body.userId,
      body.approved,
    );
  }

  @Post('negotiations/:id/intervene')
  async intervene(
    @Param('id') id: string,
    @Body() body: { userId: string; message: string },
  ) {
    // For hackathon: just acknowledge the intervention
    return { received: true, negotiationId: id, message: body.message };
  }
}
