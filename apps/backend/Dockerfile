# Dockerfile for the Go backend application (Monorepo-Aware)

# Stage 1: Build the application
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy the Go module files from the project root
COPY go.mod go.sum ./

# Download all dependencies for the monorepo
RUN go mod download

# Copy the source code for the backend application
# This copies ONLY the backend code, not the whole project
COPY ./apps/backend/ ./apps/backend/

# Build the backend application specifically
# The build command now points to the correct package path
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/main ./apps/backend

# Stage 2: Create the final, minimal image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the built binary from the builder stage
COPY --from=builder /app/main .

# Expose the application port
EXPOSE 8080

# The command to run the backend service
CMD ["./main"]
