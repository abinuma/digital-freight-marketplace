import { prisma } from '../../shared/db/prisma.js';

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
};

export async function findUsers({ q, role, status, skip, take }) {
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ] } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: adminUserSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
}

export function updateUserStatus(id, status, suspensionReason) {
  return prisma.user.update({
    where: { id },
    data: { status, suspensionReason },
    select: adminUserSelect,
  });
}

export async function getUserMetrics(since) {
  const [totalUsers, byRole, newRegistrationsLast30Days] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
  ]);
  return {
    totalUsers,
    usersByRole: Object.fromEntries([
      ['SHIPPER', 0], ['TRANSPORTER', 0], ['ADMIN', 0], ['UNASSIGNED', 0],
      ...byRole.map(({ role, _count }) => [role ?? 'UNASSIGNED', _count._all]),
    ]),
    newRegistrationsLast30Days,
  };
}
