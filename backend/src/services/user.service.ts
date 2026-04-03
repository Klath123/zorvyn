import { RoleName, UserStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/response';

export class UserService {
  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: { include: { role: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
        roles: u.userRoles.map((ur) => ur.role.name),
        createdAt: u.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new AppError('User not found.', 404);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(id: string, data: { name?: string; status?: UserStatus; role?: RoleName }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found.', 404);

    await prisma.$transaction(async (tx) => {
      if (data.name || data.status) {
        await tx.user.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.status && { status: data.status }),
          },
        });
      }

      if (data.role) {
        // Get or create the new role
        const newRole = await tx.role.upsert({
          where: { name: data.role },
          update: {},
          create: { name: data.role, description: `${data.role} role` },
        });

        // Replace all roles with the new one
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({ data: { userId: id, roleId: newRole.id } });
      }
    });

    return this.getUserById(id);
  }
}

export const userService = new UserService();
