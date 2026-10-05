import { prisma } from '../../shared/db/prisma.js';

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  image: true,
  location: true,
  createdAt: true,
};

export function findAuthUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: authUserSelect });
}
