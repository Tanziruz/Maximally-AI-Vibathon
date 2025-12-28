FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm install

# Copy source code
COPY backend ./backend

# Build TypeScript
RUN cd backend && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY backend/package*.json ./
RUN npm install --production

# Copy built files
COPY --from=builder /app/backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
