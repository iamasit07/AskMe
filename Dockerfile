# Stage 1: Build the frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Build the backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install --legacy-peer-deps
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production image
FROM node:22-alpine
WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx

# Copy backend
COPY --from=backend-build /app/backend/package*.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules/
COPY --from=backend-build /app/backend/dist ./backend/dist/
COPY --from=backend-build /app/backend/prisma ./backend/prisma/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'LISTEN_PORT=${PORT:-80}' >> /app/start.sh && \
    echo 'export PORT=8080' >> /app/start.sh && \
    echo 'cd /app/backend && node dist/server.js & ' >> /app/start.sh && \
    echo 'sed -i "s/listen 80;/listen $LISTEN_PORT;/" /etc/nginx/http.d/default.conf' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80

ENV NODE_ENV=production

CMD ["/app/start.sh"]
