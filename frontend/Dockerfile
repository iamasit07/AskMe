FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies 
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend files
COPY . .

# Accept API URL as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the Vite React app
RUN npm run build

# Use Nginx to serve the static files
FROM nginx:alpine

# Copy the built files to Nginx's html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite default Nginx configuration to support client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5173 for Nginx
EXPOSE 5173

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
