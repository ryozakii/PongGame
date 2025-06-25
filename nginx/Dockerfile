# # Frontend build stage
# FROM node:18-alpine AS builder

# WORKDIR /app

# # Copy package files
# COPY frontend/package*.json ./
# RUN npm ci

# # Copy source files
# COPY frontend/ .

# # Build the application
# RUN npm run build

# # Nginx stage
# FROM nginx:alpine

# # SSL setup
# RUN apk add --no-cache openssl && \
#     mkdir -p /etc/nginx/ssl && \
#     openssl req -x509 -nodes -days 365 \
#     -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
#     -addext "subjectAltName=DNS:localhost" \
#     -newkey rsa:2048 \
#     -keyout /etc/nginx/ssl/nginx.key \
#     -out /etc/nginx/ssl/nginx.crt

# # Copy Nginx config
# COPY nginx/conf.d/default.conf /etc/nginx/conf.d/

# # Copy built frontend files
# COPY --from=builder /app/out /usr/share/nginx/html


# EXPOSE 80 443

# CMD ["nginx", "-g", "daemon off;"]


# Frontend build stage
# FROM node:18-alpine AS builder

# WORKDIR /app

# # Copy package files
# COPY frontend/package*.json ./
# RUN npm ci

# # Copy source files
# COPY frontend/ .

# # Build the application (builds the Next.js app for server-side rendering)
# # RUN rm -rf .next
# RUN npm run build

# # Install production dependencies
# # RUN npm install --production

# Nginx stage
FROM nginx:alpine

# SSL setup (self-signed certificates, replace with real ones for production)
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
    -addext "subjectAltName=DNS:localhost" \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt

# Copy Nginx config
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/
# COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
# COPY --from=builder /app/public /usr/share/nginx/html

# Expose HTTP and HTTPS ports
EXPOSE 443

# Start Nginx and proxy to Next.js app (running on port 3000)
CMD ["nginx", "-g", "daemon off;"]