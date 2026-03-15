import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';
import { DemandSignal } from '../demand/entities/demand-signal.entity';
import { Match } from '../matches/entities/match.entity';
import { Negotiation } from '../matches/entities/negotiation.entity';
import { Booking } from '../matches/entities/booking.entity';
import { BlackboardService } from '../agents/blackboard/blackboard.service';
import { BlackboardSection } from '../agents/blackboard/blackboard.types';

interface SeedListing {
  title: string;
  description: string;
  area: string;
  category: string;
  pricePence: number;
  minimumPricePence: number;
  capacity: number;
  lat: number;
  lng: number;
  tags: string[];
  included: string[];
  skills: string[];
  userName: string;
  previousRole: string;
}

interface SeedDemand {
  query: string;
  area: string;
  budgetMaxPence: number;
  radiusMeters: number;
  lat: number;
  lng: number;
  userName: string;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(DemandSignal)
    private readonly demandRepo: Repository<DemandSignal>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Negotiation)
    private readonly negotiationRepo: Repository<Negotiation>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly blackboard: BlackboardService,
  ) {}

  async seed(): Promise<{ users: number; listings: number; demands: number }> {
    this.logger.log('Seeding database with London demo data...');

    const listings = this.getSeedListings();
    const demands = this.getSeedDemands();

    const createdUsers: User[] = [];
    const createdListings: Listing[] = [];
    const createdDemands: DemandSignal[] = [];

    // Create seller users + listings
    for (const seed of listings) {
      const user = await this.userRepo.save(
        this.userRepo.create({
          name: seed.userName,
          locationArea: seed.area,
          lat: seed.lat,
          lng: seed.lng,
          skills: seed.skills,
          status: 'active',
          previousRole: seed.previousRole,
        }),
      );
      createdUsers.push(user);

      const listing = await this.listingRepo.save(
        this.listingRepo.create({
          userId: user.id,
          title: seed.title,
          description: seed.description,
          pricePence: seed.pricePence,
          minimumPricePence: seed.minimumPricePence,
          capacity: seed.capacity,
          category: seed.category,
          lat: seed.lat,
          lng: seed.lng,
          tags: seed.tags,
          included: seed.included,
          status: 'active',
        }),
      );
      createdListings.push(listing);

      this.blackboard.write(BlackboardSection.ACTIVE_LISTINGS, {
        ...listing,
        user,
      });
    }

    // Create buyer users + demand signals
    for (const seed of demands) {
      const user = await this.userRepo.save(
        this.userRepo.create({
          name: seed.userName,
          locationArea: seed.area,
          lat: seed.lat,
          lng: seed.lng,
          skills: [],
          status: 'searching',
        }),
      );
      createdUsers.push(user);

      const signal = await this.demandRepo.save(
        this.demandRepo.create({
          userId: user.id,
          query: seed.query,
          budgetMaxPence: seed.budgetMaxPence,
          lat: seed.lat,
          lng: seed.lng,
          radiusMeters: seed.radiusMeters,
          status: 'active',
        }),
      );
      createdDemands.push(signal);

      this.blackboard.write(BlackboardSection.DEMAND_SIGNALS, {
        ...signal,
        user,
      });
    }

    this.logger.log(
      `Seeded: ${createdUsers.length} users, ${createdListings.length} listings, ${createdDemands.length} demands`,
    );

    return {
      users: createdUsers.length,
      listings: createdListings.length,
      demands: createdDemands.length,
    };
  }

  async reset(): Promise<void> {
    this.logger.log('Resetting database...');
    await this.bookingRepo.delete({});
    await this.negotiationRepo.delete({});
    await this.matchRepo.delete({});
    await this.demandRepo.delete({});
    await this.listingRepo.delete({});
    await this.userRepo.delete({});
    this.blackboard.clearAll();
    this.logger.log('Database reset complete');
  }

  private getSeedListings(): SeedListing[] {
    return [
      {
        title: 'South Indian Cooking Experience',
        description:
          'A hands-on 2-hour session in a real Shoreditch kitchen. Learn to make crispy dosa, aromatic sambar, and fresh coconut chutney from scratch. All ingredients and equipment provided.',
        area: 'Shoreditch, E2',
        category: 'food',
        pricePence: 3000,
        minimumPricePence: 2200,
        capacity: 4,
        lat: 51.5235,
        lng: -0.0776,
        tags: ['cooking', 'south_indian', 'hands-on', 'beginner_friendly'],
        included: [
          'All ingredients',
          'Recipe cards',
          'Chai tea and snacks',
        ],
        skills: ['cooking', 'south_indian_cuisine'],
        userName: 'Maria Santos',
        previousRole: 'Sous Chef',
      },
      {
        title: 'Beginner Guitar in Camden',
        description:
          'Patient, fun guitar lessons for absolute beginners. Learn your first chords, strumming patterns, and a full song in just one session. Acoustic guitar provided if needed.',
        area: 'Camden, NW1',
        category: 'music',
        pricePence: 2500,
        minimumPricePence: 1800,
        capacity: 2,
        lat: 51.5392,
        lng: -0.1426,
        tags: ['guitar', 'beginner', 'music_lesson', 'acoustic'],
        included: ['Guitar provided', 'Chord chart', 'Practice playlist'],
        skills: ['guitar', 'music_teaching'],
        userName: 'James Wilson',
        previousRole: 'Session Musician',
      },
      {
        title: 'Bike Repair Clinic',
        description:
          'Bring your bike and learn to fix it yourself. Covers punctures, brake adjustment, gear tuning, and chain maintenance. Walk away knowing how to keep your bike running smoothly.',
        area: 'Hackney, E8',
        category: 'repair',
        pricePence: 1500,
        minimumPricePence: 1100,
        capacity: 6,
        lat: 51.5432,
        lng: -0.0556,
        tags: ['bike', 'repair', 'maintenance', 'practical'],
        included: ['All tools', 'Lubricant', 'Patch kit to take home'],
        skills: ['bike_repair', 'mechanical'],
        userName: 'Kwame Asante',
        previousRole: 'Bicycle Mechanic',
      },
      {
        title: 'Conversational Japanese',
        description:
          'Relaxed conversation practice in Japanese over coffee. Perfect for intermediate learners who want real-world practice. We cover everyday topics, slang, and cultural context.',
        area: 'Angel, N1',
        category: 'language',
        pricePence: 2000,
        minimumPricePence: 1500,
        capacity: 3,
        lat: 51.5322,
        lng: -0.1058,
        tags: ['japanese', 'conversation', 'language', 'intermediate'],
        included: ['Coffee', 'Vocab list', 'Cultural notes handout'],
        skills: ['japanese', 'language_teaching'],
        userName: 'Yuki Tanaka',
        previousRole: 'Translation Agency',
      },
      {
        title: 'Photography Walk: Street Art',
        description:
          'Explore East London street art with a professional photographer. Learn composition, lighting, and how to tell stories with your camera. Covers Brick Lane, Shoreditch, and Bethnal Green.',
        area: 'Brick Lane, E1',
        category: 'creative',
        pricePence: 1800,
        minimumPricePence: 1300,
        capacity: 8,
        lat: 51.5215,
        lng: -0.0716,
        tags: [
          'photography',
          'street_art',
          'walking_tour',
          'east_london',
        ],
        included: [
          'Photo editing tips sheet',
          'Best spots map',
          'Group photo review after',
        ],
        skills: ['photography', 'art_history'],
        userName: 'Sarah Chen',
        previousRole: 'Freelance Photographer',
      },
      {
        title: 'Intro to Python Coding',
        description:
          'Learn Python from scratch in a relaxed, jargon-free session. Build a small project by the end. Perfect for career changers, curious minds, or anyone who thinks coding is scary.',
        area: 'Shoreditch, EC2',
        category: 'tech',
        pricePence: 3500,
        minimumPricePence: 2500,
        capacity: 4,
        lat: 51.5244,
        lng: -0.0838,
        tags: ['python', 'coding', 'beginner', 'career_change'],
        included: [
          'Laptop provided if needed',
          'Code templates',
          'Follow-up resources list',
        ],
        skills: ['python', 'software_engineering', 'teaching'],
        userName: 'Priya Patel',
        previousRole: 'Junior Developer',
      },
      {
        title: 'Sourdough Baking Masterclass',
        description:
          'From starter to loaf — learn the ancient art of sourdough baking. You\'ll take home your own loaf and a portion of my 3-year-old starter. All organic, all local ingredients.',
        area: 'Brixton, SW9',
        category: 'food',
        pricePence: 2800,
        minimumPricePence: 2000,
        capacity: 5,
        lat: 51.4613,
        lng: -0.1156,
        tags: ['baking', 'sourdough', 'organic', 'artisan'],
        included: [
          'All ingredients (organic)',
          'Sourdough starter to take home',
          'Fresh bread to take home',
        ],
        skills: ['baking', 'sourdough'],
        userName: 'Tom Fletcher',
        previousRole: 'Bakery Assistant',
      },
      {
        title: 'Yoga in the Park',
        description:
          'Gentle vinyasa flow in beautiful Victoria Park. All levels welcome. Bring a mat or borrow one of mine. End with a guided meditation by the lake.',
        area: 'Victoria Park, E9',
        category: 'wellness',
        pricePence: 1200,
        minimumPricePence: 800,
        capacity: 12,
        lat: 51.5362,
        lng: -0.0377,
        tags: ['yoga', 'outdoor', 'beginner_friendly', 'meditation'],
        included: [
          'Mat loan available',
          'Water provided',
          'Post-session stretch guide',
        ],
        skills: ['yoga', 'meditation', 'fitness'],
        userName: 'Emma Richardson',
        previousRole: 'Gym Instructor',
      },
      {
        title: 'CV & Interview Coaching',
        description:
          'One-on-one session with an ex-recruiter. Complete CV overhaul, LinkedIn optimization, and mock interview with feedback. Tailored to your target industry.',
        area: 'Farringdon, EC1',
        category: 'career',
        pricePence: 4000,
        minimumPricePence: 3000,
        capacity: 1,
        lat: 51.5204,
        lng: -0.1052,
        tags: ['cv', 'interview', 'career', 'coaching'],
        included: [
          'CV rewrite',
          'LinkedIn profile review',
          'Mock interview recording',
          'Follow-up email support',
        ],
        skills: ['recruitment', 'coaching', 'career_advice'],
        userName: 'David Kim',
        previousRole: 'Senior Recruiter',
      },
      {
        title: 'Dog Walking & Basic Training',
        description:
          'Professional dog walking with training tips included. Your dog gets exercise and socialization, you get a calmer, better-behaved companion. Group or solo walks available.',
        area: 'Hampstead, NW3',
        category: 'pets',
        pricePence: 1500,
        minimumPricePence: 1000,
        capacity: 4,
        lat: 51.5564,
        lng: -0.1782,
        tags: ['dog_walking', 'pet_care', 'training', 'outdoor'],
        included: [
          'Treats',
          'Training tips card',
          'Post-walk report',
        ],
        skills: ['dog_training', 'animal_care'],
        userName: 'Lucy Morgan',
        previousRole: 'Veterinary Assistant',
      },
    ];
  }

  private getSeedDemands(): SeedDemand[] {
    return [
      {
        query: 'unique food experience for date night',
        area: 'Shoreditch',
        budgetMaxPence: 4000,
        radiusMeters: 1000,
        lat: 51.5246,
        lng: -0.0794,
        userName: 'Alex Thompson',
      },
      {
        query: 'someone to fix my bike wheel',
        area: 'Hackney',
        budgetMaxPence: 2000,
        radiusMeters: 2000,
        lat: 51.545,
        lng: -0.054,
        userName: 'Nina Okafor',
      },
      {
        query: 'learn to cook something new',
        area: 'Bethnal Green',
        budgetMaxPence: 3500,
        radiusMeters: 1500,
        lat: 51.527,
        lng: -0.055,
        userName: 'Chris Evans',
      },
      {
        query: 'guitar lessons for absolute beginner',
        area: 'Kentish Town',
        budgetMaxPence: 3000,
        radiusMeters: 2000,
        lat: 51.5503,
        lng: -0.1406,
        userName: 'Fatima Al-Hassan',
      },
      {
        query: 'help with garden, willing to pay',
        area: 'Dalston',
        budgetMaxPence: 5000,
        radiusMeters: 1000,
        lat: 51.5462,
        lng: -0.0752,
        userName: 'Robert Singh',
      },
      {
        query: 'coding tutor for my teenager',
        area: 'Islington',
        budgetMaxPence: 4000,
        radiusMeters: 3000,
        lat: 51.5362,
        lng: -0.1033,
        userName: 'Helen Park',
      },
      {
        query: 'furniture assembly help needed',
        area: 'Peckham',
        budgetMaxPence: 3000,
        radiusMeters: 1500,
        lat: 51.4735,
        lng: -0.0689,
        userName: 'Marcus Brown',
      },
      {
        query: 'walking buddy or group activity',
        area: 'Clapham',
        budgetMaxPence: 1500,
        radiusMeters: 2000,
        lat: 51.4618,
        lng: -0.1384,
        userName: 'Sophie Turner',
      },
    ];
  }
}
