import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';
import { DemandSignal } from '../../demand/entities/demand-signal.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: 'listingId' })
  listing: Listing;

  @Column()
  listingId: string;

  @ManyToOne(() => DemandSignal)
  @JoinColumn({ name: 'demandId' })
  demand: DemandSignal;

  @Column()
  demandId: string;

  @Column('decimal', { precision: 4, scale: 2 })
  confidence: number;

  @Column('text', { nullable: true })
  reasoning: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
