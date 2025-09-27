# Use Node.js 18 slim image as base
FROM node:18-slim

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV PORT=8080 \
    NODE_ENV=production

# Expose port 8080
EXPOSE 8080

# Command to run the application
CMD ["node", "main.js"]