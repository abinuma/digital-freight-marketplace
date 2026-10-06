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

export async function completeUserProfile(id, input) {
  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: { phone: true, role: true },
  });
  if (!currentUser) return null;

  const data = {};
  if (currentUser.phone === null) data.phone = input.phone;
  if (currentUser.role === null) data.role = input.role;
  if (Object.keys(data).length === 0) return { alreadyComplete: true, user: null };

  const result = await prisma.user.updateMany({
    where: { id, phone: currentUser.phone, role: currentUser.role },
    data,
  });
  if (result.count !== 1) return { conflict: true, user: null };

  return { alreadyComplete: false, user: await findAuthUserById(id) };
}
