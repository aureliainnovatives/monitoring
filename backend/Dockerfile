# Step 1: Build the application in a full Node.js environment
FROM node:18 AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies and forever
RUN npm install
RUN npm install forever -g

# Copy the rest of the application
COPY . .

# Step 2: Create a lightweight production image
FROM node:18-alpine

# Set environment to production
ENV NODE_ENV=production

# Install forever globally in the production stage
RUN npm install -g forever

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory in the new image
WORKDIR /usr/src/app

# Copy the production build from the builder stage (including node_modules)
COPY --from=builder /usr/src/app .

# Create the logs directory
RUN mkdir -p /usr/src/app/logs

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /usr/src/app /usr/src/app/logs

RUN chmod -R 755 /usr/src/app/logs


# Switch to the non-root user
USER appuser

# Expose the port your app runs on
EXPOSE 3000

# Use forever to run both scripts and append logs to separate files
CMD ["sh", "-c", "forever start -l /usr/src/app/logs/api.log -a index.js && forever start -l /usr/src/app/logs/crawler.log -a crawler.js"]
