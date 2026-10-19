import { z } from 'zod';
import { ethiopianPhoneSchema } from '../../shared/utils/ethiopianPhone.js';

const emailSchema = z.string().trim().email('Enter a valid email address').max(255);
const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Use no more than 128 characters')
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/[0-9]/, 'Add at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(128),
});

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(50),
  lastName: z.string().trim().min(1, 'Enter your last name').max(50),
  role: z.enum(['SHIPPER', 'TRANSPORTER'], { error: 'Choose how you will use EthioFreight' }),
  email: emailSchema,
  phone: ethiopianPhoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
  }
  if (`${values.firstName} ${values.lastName}`.trim().length > 100) {
    context.addIssue({ code: 'custom', path: ['lastName'], message: 'Your full name must be 100 characters or fewer' });
  }
});

export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
  }
});

export function errorsFromIssues(issues) {
  return Object.fromEntries(issues.map(({ path, message }) => [path[0], message]));
}
