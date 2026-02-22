FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Copy prisma directory for generation before all other files (cache optimization)
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the backend files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Expose the backend port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
