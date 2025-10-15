# Dockerfile for the Go worker application (Monorepo-Aware)

# Stage 1: Build the application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy the Go module files from the project root
COPY go.mod go.sum ./

# Download all dependencies for the monorepo
RUN go mod download

# Copy the source code for the worker application
COPY ./apps/workers/ ./apps/workers/

# Build the worker application specifically
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/worker-app ./apps/workers

# Stage 2: Create the final, minimal image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the built binary from the builder stage
COPY --from=builder /app/worker-app .

# The command to run the worker service
CMD ["./worker-app"]
