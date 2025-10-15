# Use a Golang base image
FROM golang:1.21-alpine

# Set the working directory
WORKDIR /app

# Copy the Go modules files
COPY go.mod go.sum ./

# Download the Go modules
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application
RUN go build -o /app/reprinter ./apps/reprinter

# Copy the wait script
COPY wait-for-services.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wait-for-services.sh

# The command to run the application (will be overridden in docker-compose.yml)
CMD ["/app/reprinter"]
