# Step 1: Build the application in a full Node.js 18 environment
FROM node:18 AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Step 2: Create a lightweight production image
FROM node:18-alpine

# Set environment to production
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory in the new image
WORKDIR /usr/src/app

# Copy the production build from the builder stage (including node_modules)
COPY --from=builder /usr/src/app .

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to the non-root user
USER appuser

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
