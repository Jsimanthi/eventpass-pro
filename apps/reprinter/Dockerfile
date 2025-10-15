# Dockerfile for the Go reprinter application

# Start with a Go base image for building the application
FROM golang:1.21-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Copy the source code into the container
COPY . .

# Download Go module dependencies
RUN go mod tidy

# Build the Go application
RUN go build -o /reprinter-app .

# Start a new, minimal stage for the final image
FROM alpine:latest

# Set the working directory
WORKDIR /

# Copy the built application from the builder stage
COPY --from=builder /reprinter-app /reprinter-app

# Define the command to run the application
ENTRYPOINT ["/reprinter-app"]
