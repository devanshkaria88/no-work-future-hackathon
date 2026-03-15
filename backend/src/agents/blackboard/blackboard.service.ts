import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BlackboardSection,
  BlackboardState,
  BlackboardEvent,
} from './blackboard.types';
import { BlackboardGateway } from './blackboard.gateway';

@Injectable()
export class BlackboardService {
  private readonly logger = new Logger(BlackboardService.name);
  private readonly state: BlackboardState = {
    userProfiles: new Map(),
    opportunities: [],
    activeListings: [],
    demandSignals: [],
    matches: [],
    negotiations: new Map(),
    transactions: [],
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly gateway: BlackboardGateway,
  ) {}

  write(section: BlackboardSection, data: any): void {
    this.logger.log(`Writing to blackboard: ${section}`);

    switch (section) {
      case BlackboardSection.USER_PROFILES:
        this.state.userProfiles.set(data.id, data);
        break;
      case BlackboardSection.OPPORTUNITIES:
        this.state.opportunities.push(data);
        break;
      case BlackboardSection.ACTIVE_LISTINGS:
        this.state.activeListings.push(data);
        break;
      case BlackboardSection.DEMAND_SIGNALS:
        this.state.demandSignals.push(data);
        break;
      case BlackboardSection.MATCHES:
        this.state.matches.push(data);
        break;
      case BlackboardSection.NEGOTIATIONS:
        this.state.negotiations.set(data.id, data);
        break;
      case BlackboardSection.TRANSACTIONS:
        this.state.transactions.push(data);
        break;
    }

    const event: BlackboardEvent = {
      section,
      action: 'write',
      data,
      timestamp: new Date(),
    };

    // Notify orchestrator asynchronously
    this.eventEmitter.emit('blackboard.change', event);

    // Broadcast to frontend via WebSocket
    this.gateway.broadcastBlackboardChange(event);
  }

  update(section: BlackboardSection, id: string, updates: any): void {
    this.logger.log(`Updating blackboard: ${section} / ${id}`);

    if (
      section === BlackboardSection.USER_PROFILES ||
      section === BlackboardSection.NEGOTIATIONS
    ) {
      const map = this.state[section] as Map<string, any>;
      const existing = map.get(id);
      if (existing) {
        map.set(id, { ...existing, ...updates });
      }
    } else {
      const arr = this.state[section] as any[];
      const idx = arr.findIndex((item: any) => item.id === id);
      if (idx !== -1) {
        arr[idx] = { ...arr[idx], ...updates };
      }
    }

    const event: BlackboardEvent = {
      section,
      action: 'update',
      data: { id, ...updates },
      timestamp: new Date(),
    };

    this.eventEmitter.emit('blackboard.change', event);
    this.gateway.broadcastBlackboardChange(event);
  }

  read(section: BlackboardSection, filter?: Record<string, any>): any {
    const sectionData = this.state[section];

    if (sectionData instanceof Map) {
      if (filter?.id) {
        return sectionData.get(filter.id);
      }
      return Array.from(sectionData.values());
    }

    if (!filter) return sectionData;

    return (sectionData as any[]).filter((item: any) =>
      Object.entries(filter).every(([key, value]) => item[key] === value),
    );
  }

  getSnapshot(): Record<string, any> {
    return {
      userProfiles: Array.from(this.state.userProfiles.values()),
      opportunities: this.state.opportunities,
      activeListings: this.state.activeListings,
      demandSignals: this.state.demandSignals,
      matches: this.state.matches,
      negotiations: Array.from(this.state.negotiations.values()),
      transactions: this.state.transactions,
    };
  }

  clear(section: BlackboardSection): void {
    this.logger.log(`Clearing blackboard section: ${section}`);

    switch (section) {
      case BlackboardSection.USER_PROFILES:
        this.state.userProfiles.clear();
        break;
      case BlackboardSection.NEGOTIATIONS:
        this.state.negotiations.clear();
        break;
      default:
        (this.state[section] as any[]).length = 0;
        break;
    }

    const event: BlackboardEvent = {
      section,
      action: 'clear',
      data: null,
      timestamp: new Date(),
    };

    this.eventEmitter.emit('blackboard.change', event);
    this.gateway.broadcastBlackboardChange(event);
  }

  clearAll(): void {
    Object.values(BlackboardSection).forEach((section) => this.clear(section));
  }
}
