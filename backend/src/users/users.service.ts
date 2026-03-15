import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['listings'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'passwordHash', 'locationArea', 'lat', 'lng', 'skills', 'status', 'preferences', 'previousRole', 'createdAt'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.userRepo.update(id, data);
    return this.findOne(id);
  }
}
