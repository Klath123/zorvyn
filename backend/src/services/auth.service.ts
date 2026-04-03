import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/response';
import { AuthPayload } from '../types';
import { RoleName } from '@prisma/client';

export class AuthService {
  async register(email: string, password: string, name: string, roleName: RoleName = 'VIEWER') {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Ensure role exists
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });

    // Create user and assign role in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, name },
      });

      await tx.userRole.create({
        data: { userId: newUser.id, roleId: role.id },
      });

      return newUser;
    });

    const token = this.generateToken({ userId: user.id, email: user.email, roles: [roleName] });

    return {
      user: { id: user.id, email: user.email, name: user.name, roles: [roleName] },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      // Use same error to prevent user enumeration
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const token = this.generateToken({ userId: user.id, email: user.email, roles });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        roles,
      },
      token,
    };
  }

  private generateToken(payload: AuthPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('JWT secret not configured.', 500);

    return jwt.sign(payload, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();
