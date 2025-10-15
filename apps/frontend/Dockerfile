# Dockerfile for the frontend application (Corrected Monorepo Build)

# Stage 1: Build the application
FROM node:20-alpine as builder

# Set the base working directory
WORKDIR /app

# Copy ONLY the package.json and package-lock.json for the frontend
COPY ./apps/frontend/package*.json ./apps/frontend/

# Set the working directory to the frontend app's folder
WORKDIR /app/apps/frontend

# Install the frontend dependencies
RUN npm install

# Go back to the root for the next copy
WORKDIR /app

# Copy the rest of the project's source code
# This is needed so that Vite can resolve any monorepo dependencies if necessary.
COPY . .

# Set the working directory back to the frontend app's folder
WORKDIR /app/apps/frontend

# Run the build script from the correct directory
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built static files from the builder stage
# The output of the build will be in /app/apps/frontend/dist
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
