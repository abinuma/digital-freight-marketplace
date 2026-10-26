import { prisma } from "../../shared/db/prisma.js";

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  image: true,
  location: true,
  region: true,
  zone: true,
  city: true,
  availableDays: true,
  preferredLoadTypes: true,
  lookingForLoads: true,
  availabilityUpdatedAt: true,
  createdAt: true,
};

export function findAuthUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: authUserSelect });
}

export function findAuthUserByEmail(email) {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export function findSuspendedUserForAppeal(email) {
  return prisma.user.findFirst({
    where: { email, status: "SUSPENDED" },
    select: { id: true },
  });
}

export function createSuspensionAppeal(userId, message) {
  return prisma.suspensionAppeal.create({
    data: { userId, message },
    select: { id: true, createdAt: true },
  });
}

export async function findSuspensionAppeals({ skip, take }) {
  const [appeals, total] = await Promise.all([
    prisma.suspensionAppeal.findMany({
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take,
    }),
    prisma.suspensionAppeal.count(),
  ]);
  return { appeals, total };
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
  if (Object.keys(data).length === 0)
    return { alreadyComplete: true, user: null };

  const result = await prisma.user.updateMany({
    where: { id, phone: currentUser.phone, role: currentUser.role },
    data,
  });
  if (result.count !== 1) return { conflict: true, user: null };

  return { alreadyComplete: false, user: await findAuthUserById(id) };
}

export async function saveEmailVerificationCode(email, code, expiresAt) {
  const identifier = `registration-code:${email.toLowerCase()}`;
  await prisma.verification.deleteMany({ where: { identifier } });
  return prisma.verification.create({
    data: {
      identifier,
      value: code,
      expiresAt,
    },
  });
}

export async function getEmailVerificationRecord(email) {
  const identifier = `registration-code:${email.toLowerCase()}`;
  return prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteEmailVerificationRecord(email) {
  const identifier = `registration-code:${email.toLowerCase()}`;
  return prisma.verification.deleteMany({ where: { identifier } });
}

export async function findPasswordResetToken(token) {
  if (!token) return null;
  const identifier = `reset-password:${token}`;
  return prisma.verification.findFirst({
    where: {
      identifier,
      expiresAt: { gt: new Date() },
    },
  });
}
