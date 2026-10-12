import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return db.orm.public.User
      .where({ email })
      .first();
  }

  async createUser(name: string, email: string, passwordHash: string) {
    return db.orm.public.User
      .create({
        name,
        email,
        passwordHash,
      });
  }
  
  async findById(id: number) {
  return db.orm.public.User
    .where({ id })
    .first();
 }
}