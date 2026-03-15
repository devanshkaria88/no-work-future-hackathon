import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('negotiations')
export class Negotiation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column('simple-json', { default: '[]' })
  transcript: { from: string; text: string; timestamp: string }[];

  @Column('int', { nullable: true })
  finalPricePence: number;

  @Column('int', { nullable: true })
  quantity: number;

  @Column({ default: 'in_progress' })
  outcome: string;

  @Column({ default: false })
  buyerApproved: boolean;

  @Column({ default: false })
  sellerApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
