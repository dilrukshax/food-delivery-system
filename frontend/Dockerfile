# Stage 1: Build Angular app
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Stage 2: Serve with Nginx
FROM nginx:1.15.8-alpine

# Remove default Nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/

# Copy built assets from builder
COPY --from=builder /usr/src/app/dist/food-ordering-frontend /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
