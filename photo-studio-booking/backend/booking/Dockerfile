# STAGE 1: Build stage using Node.js to install dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# STAGE 2: Run stage using Alpine, but with a minimal Node.js installation
FROM node:20-alpine

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory that will be accessible by the non-root user
WORKDIR /home/appuser/app

# Copy node_modules and source code from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Make sure all source files are copied (explicitly listing directories)
COPY src/ ./src/
COPY package.json .
COPY .env .

# Set permissions
RUN chown -R appuser:appgroup /home/appuser/app

# Set environment variables
ENV NODE_ENV=production

# Expose the port
EXPOSE 4000

# Switch to non-root user
USER appuser

# Start the service
CMD ["node", "src/index.js"]