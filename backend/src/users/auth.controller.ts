import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
    },
  ) {
    if (!body.email || !body.password || !body.name) {
      throw new HttpException(
        'Email, password, and name are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.usersService.findByEmail(body.email);
    if (existing) {
      throw new HttpException('Email already registered', HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await this.usersService.create({
      email: body.email,
      passwordHash,
      name: body.name,
      locationArea: 'Shoreditch, E2',
      lat: 51.5235,
      lng: -0.0735,
      skills: [],
      status: 'exploring',
    });

    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  }

  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    if (!body.email || !body.password) {
      throw new HttpException(
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.usersService.findByEmail(body.email);
    if (!user || !user.passwordHash) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  }
}
