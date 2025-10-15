# Use a Golang base image
FROM golang:1.24-alpine

# Set the working directory
WORKDIR /app

# Install openssl, which is needed for generating self-signed certs for local dev
RUN apk add --no-cache openssl

# Copy the Go modules files
COPY go.mod go.sum ./

# Download the Go modules
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application
RUN go build -o /app/backend ./apps/backend

# Copy the wait script
COPY wait-for-services.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wait-for-services.sh

# The command to run the application (will be overridden in docker-compose.yml)
CMD ["/app/backend"]
