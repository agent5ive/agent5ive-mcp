FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the server
CMD ["node", "index.js", "--http"]
