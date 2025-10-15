# Dockerfile for the frontend application (Monorepo-Aware)

# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copy the package.json and package-lock.json for the frontend app
COPY ./apps/frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the entire project context
# This is necessary because the vite build might need access to other files
COPY . .

# Run the build script for the frontend, which is specified in its own package.json
# Vite will correctly handle the paths for the build output.
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built static files from the builder stage to the Nginx server directory
# The output from 'vite build' is placed in the 'dist' folder by default
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
