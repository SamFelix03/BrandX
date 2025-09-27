# Use Node.js 18 slim image as base
FROM node:18-slim

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker cache)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Expose port 8080
EXPOSE 8080

# Command to run the Express server
CMD ["node", "main.js"]