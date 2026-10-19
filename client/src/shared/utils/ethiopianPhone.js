import { z } from 'zod';

const ethiopianNationalNumber = /^(?:[79]\d{8}|(?:1[1-9]|[2-5]\d)\d{7})$/;

export function normalizeEthiopianPhone(value) {
  const digits = String(value).trim().replace(/\D/g, '');
  let nationalNumber = digits;

  if (digits.startsWith('251')) nationalNumber = digits.slice(3);
  else if (digits.startsWith('0')) nationalNumber = digits.slice(1);

  return `+251${nationalNumber}`;
}

export function isValidEthiopianPhone(value) {
  const input = String(value).trim();
  if (!input || !/^\+?[\d\s().-]+$/.test(input)) return false;

  const digits = input.replace(/\D/g, '');
  if (input.startsWith('+') && !digits.startsWith('251')) return false;

  let nationalNumber = digits;
  if (digits.startsWith('251')) nationalNumber = digits.slice(3);
  else if (digits.startsWith('0')) {
    if (digits.length !== 10) return false;
    nationalNumber = digits.slice(1);
  }

  return ethiopianNationalNumber.test(nationalNumber);
}

export const ethiopianPhoneSchema = z
  .string()
  .trim()
  .max(25, 'Phone number is too long')
  .refine(isValidEthiopianPhone, 'Enter a valid Ethiopian mobile')
  .transform(normalizeEthiopianPhone);
