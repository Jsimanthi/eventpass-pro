# Dockerfile for the Go reprinter application (Monorepo-Aware)

# Stage 1: Build the application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy the Go module files from the project root
COPY go.mod go.sum ./

# Download all dependencies for the monorepo
RUN go mod download

# Copy the source code for the reprinter application
COPY ./apps/reprinter/ ./apps/reprinter/

# Build the reprinter application specifically
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/reprinter-app ./apps/reprinter

# Stage 2: Create the final, minimal image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the built binary from the builder stage
COPY --from=builder /app/reprinter-app .

# The command to run the reprinter service
CMD ["./reprinter-app"]
