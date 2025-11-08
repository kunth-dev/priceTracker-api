# Production runtime for Node.js application

FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies including tsx for running TypeScript
# Note: In some Docker environments, you may need to disable strict-ssl if you encounter
# "self-signed certificate in certificate chain" errors. Comment out the first line below
# if you don't face SSL issues in your environment:
# RUN npm config set strict-ssl false
RUN npm install --omit=dev && \
    npm install tsx && \
    npm cache clean --force

# Copy source code and configuration
COPY --chown=nodejs:nodejs tsconfig.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs drizzle.config.ts ./

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api', (r) => {process.exit(r.statusCode === 404 ? 0 : 1)})"

# Start application using tsx to run TypeScript directly
CMD ["npx", "tsx", "src/server.ts"]
