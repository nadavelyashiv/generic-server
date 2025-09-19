# Production Dockerfile using ts-node
FROM node:20-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Install dumb-init and OpenSSL dependencies for Prisma
RUN apk add --no-cache dumb-init openssl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci && npm cache clean --force

# Copy source code and configuration
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the application with ts-node
CMD ["dumb-init", "npx", "ts-node", "-r", "tsconfig-paths/register", "src/app.ts"]