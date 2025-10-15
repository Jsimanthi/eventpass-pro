# Dockerfile for the Go worker application (Monorepo-Aware)

# Stage 1: Build the application
FROM golang:1.24-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy module files first to leverage Docker cache
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the entire source code into the container
# This makes all local packages available to the Go compiler
COPY . .

# Build the worker application specifically
RUN CGO_ENABLED=0 GOOS=linux go build -a -o /app/worker-app ./apps/workers

# Stage 2: Create the final, minimal image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the built binary from the builder stage
COPY --from=builder /app/worker-app .

CMD ["./worker-app"]
