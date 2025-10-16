# EventPass Pro

A comprehensive event management system with QR code check-ins, real-time analytics, and GDPR compliance.

## Features

### ✅ Core Features
- **Event Management**: Create, update, and manage events
- **QR Code Generation**: Secure QR codes with HMAC signatures for invitee validation
- **Real-time Check-ins**: WebSocket-based live check-in monitoring
- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **GDPR Compliance**: Data anonymization and privacy controls
- **File Storage**: MinIO S3-compatible storage for QR codes
- **Background Processing**: RabbitMQ for notifications and message queuing
- **Caching**: Redis for performance optimization
- **Analytics**: TimescaleDB for time-series analytics
- **Monitoring**: Prometheus metrics and Grafana dashboards

### ✅ Infrastructure
- **Docker Compose**: Complete containerized deployment
- **Database Replication**: Primary-replica PostgreSQL setup
- **Load Balancing**: Nginx reverse proxy configuration
- **Logging**: Elasticsearch and FluentD integration
- **Health Monitoring**: Comprehensive logging and metrics

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd eventpass-pro
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

### 3. Start the Application
```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Grafana**: http://localhost:3001 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadminpassword)

## Development

### Backend Development
```bash
# Run backend only
docker-compose up backend --build

# View logs
docker-compose logs -f backend
```

### Frontend Development
```bash
cd apps/frontend
npm run dev
```

### Database Migrations
```bash
# Run migrations
docker-compose exec postgres psql -U eventpass_user -d eventpass_pro -f /path/to/migration.sql
```

## API Endpoints

### Public Endpoints
- `POST /users` - Create user
- `POST /login` - User login
- `GET /validate` - Validate invitee QR code
- `GET /qrcodes/{objectName}` - Serve QR code images
- `POST /scan/{qr}` - Scan QR code for check-in

### Authenticated Endpoints
- `GET /events` - List events
- `POST /events` - Create event
- `GET /events/{id}` - Get event details
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event
- `GET /events/{id}/invitees` - List invitees
- `POST /events/{id}/invitees` - Upload invitees (CSV)
- `GET /events/{id}/report` - Export invitees report
- `POST /invitees/{invitee_id}/reprint` - Request reprint
- `POST /users/{id}/anonymize` - Anonymize user data
- `POST /invitees/{id}/anonymize` - Anonymize invitee data
- `POST /orders/{id}/anonymize` - Anonymize order data

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Go/Gorilla)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │     Redis       │    │   TimescaleDB   │
│   (Real-time)   │    │   (Caching)     │    │   (Analytics)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RabbitMQ      │    │     MinIO       │    │   Elasticsearch │
│ (Notifications) │    │   (Storage)     │    │   (Logging)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Features

- **HMAC-signed QR codes** for tamper-proof validation
- **JWT authentication** with secure token management
- **bcrypt password hashing** for user credentials
- **CORS protection** with configurable origins
- **Rate limiting** for API endpoints
- **GDPR compliance** with data anonymization
- **TLS/SSL support** for secure communications

## Monitoring

- **Prometheus** metrics collection
- **Grafana** dashboards for visualization
- **Elasticsearch** log aggregation
- **FluentD** log forwarding
- **Health checks** for all services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see LICENSE file for details.
