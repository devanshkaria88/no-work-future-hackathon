import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column()
  locationArea: string;

  @Column('decimal', { precision: 10, scale: 7 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  lng: number;

  @Column('simple-json')
  skills: string[];

  @Column({ default: 'exploring' })
  status: string;

  @Column('simple-json', { nullable: true })
  preferences: Record<string, any> | null;

  @Column({ nullable: true })
  previousRole: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Listing, (listing) => listing.user)
  listings: Listing[];
}
