import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.listings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('int')
  pricePence: number;

  @Column('int', { nullable: true })
  minimumPricePence: number;

  @Column('int')
  capacity: number;

  @Column('int', { default: 0 })
  booked: number;

  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 7 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  lng: number;

  @Column('simple-json', { nullable: true })
  tags: string[];

  @Column('simple-json', { nullable: true })
  included: string[];

  @Column({ type: 'timestamp', nullable: true })
  timeSlot: Date;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
