# 🚀 EventPass Pro

A world-class, enterprise-grade event management system built with modern technologies and best practices. This monorepo contains a complete event management platform with advanced features like real-time analytics, QR code management, GDPR compliance, and comprehensive monitoring.

## 🌟 Features

### Core Functionality
- **Event Management**: Create, update, and manage events with full CRUD operations
- **Invitee Management**: Upload invitees via CSV, generate secure QR codes with HMAC signatures
- **Real-time Check-ins**: QR code scanning with duplicate prevention and live WebSocket updates
- **Gift Management**: Single-claim gift system with atomic operations
- **User Authentication**: JWT-based auth with bcrypt password hashing

### Advanced Features
- **Real-time Dashboard**: Live check-in monitoring with WebSocket integration and data visualization
- **GDPR Compliance**: Complete data anonymization and audit trails
- **Multi-tenant Architecture**: Secure tenant isolation with RBAC
- **Background Processing**: RabbitMQ-based workers for high-concurrency operations
- **Database Replication**: Read replica support for scaling

### Enterprise Infrastructure
- **Comprehensive Monitoring**: Prometheus metrics, Grafana dashboards, and alerting
- **Centralized Logging**: Elasticsearch + Fluentd for log aggregation
- **Object Storage**: MinIO for QR code storage and management
- **Time-series Analytics**: TimescaleDB for historical data and trends
- **TLS Encryption**: Production-ready HTTPS with self-signed certificates

## 🏗️ Architecture

This is a sophisticated monorepo with the following structure:

```
eventpass-pro/
├── apps/
│   ├── backend/          # Go (Gin) API server
│   ├── frontend/         # React + TypeScript SPA
│   ├── workers/          # Background job processors
│   └── reprinter/        # QR code regeneration service
├── packages/
│   └── ai-memory/        # AI project tracking and memory management
├── monitoring/           # Prometheus, Grafana, logging configs
└── infra/               # Docker, scripts, and deployment configs
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Go 1.21+
- Node.js 18+
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd eventpass-pro
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start All Services
```bash
# Start the complete infrastructure stack
docker-compose up -d

# The following services will be available:
# - PostgreSQL + TimescaleDB (port 5432)
# - Redis (port 6379)
# - RabbitMQ (ports 5672, 15672)
# - MinIO (ports 9000, 9001)
# - Prometheus (port 9090)
# - Grafana (port 3001)
# - Elasticsearch (port 9200)
# - Fluentd (port 24224)
```

### 4. Run Database Migrations
```bash
# Apply all database migrations
cd apps/backend
go run main.go migrate up
```

### 5. Start Backend Services
```bash
# Terminal 1: Start the main API server
cd apps/backend
go run main.go

# Terminal 2: Start background workers
cd apps/workers
go run main.go

# Terminal 3: Start QR reprinter service
cd apps/reprinter
go run main.go
```

### 6. Start Frontend Development Server
```bash
cd apps/frontend
npm install
npm run dev
```

## 🌐 Access Points

Once everything is running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: https://localhost:8080
- **Grafana**: http://localhost:3001 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadminpassword)
- **RabbitMQ Management**: http://localhost:15672 (user/password)

## 🔐 Default Credentials

- **Frontend Login**:
  - Email: `admin@eventpass.pro`
  - Password: `password`

- **Grafana**: `admin` / `admin`

## 📊 Monitoring & Observability

The system includes comprehensive monitoring:

- **Metrics**: Prometheus collects metrics from all services
- **Dashboards**: Pre-configured Grafana dashboards for system overview, business metrics, and API performance
- **Alerting**: Prometheus alerting rules for critical system events
- **Logging**: Centralized logging with Elasticsearch and Fluentd

## 🔧 Development

### Project Structure
- **Backend**: Go with Gin framework, sqlc for type-safe SQL queries
- **Frontend**: React 18 with TypeScript, Vite for building
- **Database**: PostgreSQL with TimescaleDB extension for time-series data
- **Message Queue**: RabbitMQ for reliable background processing
- **Cache/Session Store**: Redis for performance optimization
- **Object Storage**: MinIO for file/Qr code storage

### Key Technologies
- **Backend**: Go, Gin, PostgreSQL, Redis, RabbitMQ, MinIO
- **Frontend**: React, TypeScript, Vite, WebSocket, Chart.js
- **Infrastructure**: Docker, Prometheus, Grafana, Elasticsearch
- **Security**: JWT, bcrypt, HMAC, TLS, GDPR compliance

## 🚀 Production Deployment

This system is production-ready with:

- **Multi-stage Dockerfiles** for optimized images
- **Health checks** and proper service dependencies
- **Environment-based configuration**
- **Comprehensive logging and monitoring**
- **Security hardening** with TLS and rate limiting
- **GDPR compliance** with data anonymization

## 🤝 Contributing

1. Follow the established patterns in the codebase
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all services build and tests pass

## 📝 License

This project is proprietary software. All rights reserved.

---

**EventPass Pro** - Enterprise Event Management Redefined 🎯
