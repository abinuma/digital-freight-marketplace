import { z } from 'zod';

const conversationId = z.uuid();

export const conversationMessagesSchema = {
  params: z.object({ conversationId }),
};

export const conversationBidsSchema = {
  params: z.object({ conversationId }),
};

export const createMessageSchema = {
  params: z.object({ conversationId }),
  body: z.object({
    content: z.string().trim().min(1).max(5000),
  }),
};

export const startConversationSchema = {
  body: z.union([
    z.object({ transporterId: z.uuid() }).strict(),
    z.object({ shipperId: z.uuid() }).strict(),
  ]),
};
