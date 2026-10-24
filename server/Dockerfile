
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies, including Prisma CLI for client generation
COPY package.json package-lock.json ./
RUN npm ci


# Copy Prisma schema and configuration
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client without using real database credentials
RUN DATABASE_URL="postgresql://user:password@localhost:5432/build_placeholder" npx prisma generate

# Copy application source
COPY src ./src

# Remove development-only dependencies from the production installation
RUN npm prune --omit=dev


# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only the files needed to run the API
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/generated ./generated

# Run as the non-root user provided by the official Node image
USER node

EXPOSE 5000

CMD ["npm", "start"]
