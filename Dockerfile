# Multi-stage build for RaiAI API
FROM node:20-alpine AS build

# Set build arguments with defaults
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG VERSION=0.0.0

# Set environment variables
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set build arguments for labels
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG VERSION=0.0.0

# Add labels for traceability
LABEL org.opencontainers.image.title="RaiAI Farming API"
LABEL org.opencontainers.image.description="AI-powered farming assistant API for Thailand"
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.revision=$GIT_COMMIT
LABEL org.opencontainers.image.created=$BUILD_TIME
LABEL org.opencontainers.image.source="https://github.com/your-org/rai-ai"
LABEL org.opencontainers.image.vendor="RaiAI"

# Set environment variables
ENV NODE_ENV=production
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV REGION=thailand
ENV API_BASE_URL=https://api.raiai.app

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S raiai -u 1001

# Change ownership of the app directory
RUN chown -R raiai:nodejs /app
USER raiai

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"]
