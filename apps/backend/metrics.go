package main

import (
	"runtime"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// API Metrics
var (
	HttpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_http_requests_total",
			Help: "Total number of HTTP requests processed, labeled by method, endpoint and status code",
		},
		[]string{"method", "endpoint", "status_code"},
	)

	HttpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "eventpass_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	ActiveConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "eventpass_active_connections",
			Help: "Number of active connections",
		},
	)
)

// Database Metrics
var (
	DatabaseQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "eventpass_db_query_duration_seconds",
			Help:    "Database query duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"operation", "table"},
	)

	DatabaseConnections = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "eventpass_db_connections",
			Help: "Database connection pool stats",
		},
		[]string{"state"}, // idle, in_use, open
	)
)

// Business Metrics
var (
	EventsCreatedTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "eventpass_events_created_total",
			Help: "Total number of events created",
		},
	)

	InviteesUploadedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_invitees_uploaded_total",
			Help: "Total number of invitees uploaded",
		},
		[]string{"event_id"},
	)

	QRCodeScansTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_qr_scans_total",
			Help: "Total number of QR code scans",
		},
		[]string{"status"}, // success, already_claimed, invalid
	)

	CheckInsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_checkins_total",
			Help: "Total number of check-ins",
		},
		[]string{"event_id"},
	)

	UsersRegisteredTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "eventpass_users_registered_total",
			Help: "Total number of users registered",
		},
	)

	ReprintRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_reprint_requests_total",
			Help: "Total number of reprint requests",
		},
		[]string{"event_id"},
	)

	InviteesExpiredTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "eventpass_invitees_expired_total",
			Help: "Total number of expired invitees",
		},
	)

	OrdersExpiredTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "eventpass_orders_expired_total",
			Help: "Total number of expired orders",
		},
	)

	AnonymizationRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_anonymization_requests_total",
			Help: "Total number of GDPR anonymization requests",
		},
		[]string{"type"}, // user, invitee, order
	)
)

// External Service Metrics
var (
	RedisOperationsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_redis_operations_total",
			Help: "Total number of Redis operations",
		},
		[]string{"operation", "status"}, // set, get, publish, success, error
	)

	MinIOOperationsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_minio_operations_total",
			Help: "Total number of MinIO operations",
		},
		[]string{"operation", "status"}, // put_object, get_object, success, error
	)

	RabbitMQPublishesTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "eventpass_rabbitmq_publishes_total",
			Help: "Total number of RabbitMQ message publishes",
		},
		[]string{"status"}, // success, error
	)

	WebSocketConnections = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "eventpass_websocket_connections",
			Help: "Number of active WebSocket connections",
		},
		[]string{"state"}, // active, closed
	)
)

// System Metrics
var (
	GoRoutines = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "eventpass_go_routines",
			Help: "Number of goroutines",
		},
	)

	MemoryUsage = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "eventpass_memory_usage_bytes",
			Help: "Memory usage statistics",
		},
		[]string{"type"}, // alloc, total_alloc, sys, gc
	)
)

// Metric recording functions

// RecordHTTPRequest records HTTP request metrics
func RecordHTTPRequest(method, endpoint string, statusCode int, duration time.Duration) {
	statusCodeStr := strconv.Itoa(statusCode)
	HttpRequestsTotal.WithLabelValues(method, endpoint, statusCodeStr).Inc()
	HttpRequestDuration.WithLabelValues(method, endpoint).Observe(duration.Seconds())
}

// RecordDatabaseOperation records database operation metrics
func RecordDatabaseOperation(operation, table string, duration time.Duration) {
	DatabaseQueryDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// RecordEventCreation records event creation metrics
func RecordEventCreation() {
	EventsCreatedTotal.Inc()
}

// RecordInviteeUpload records invitee upload metrics
func RecordInviteeUpload(eventID int32) {
	InviteesUploadedTotal.WithLabelValues(strconv.Itoa(int(eventID))).Inc()
}

// RecordQRCodeScan records QR code scan metrics
func RecordQRCodeScan(status string) {
	QRCodeScansTotal.WithLabelValues(status).Inc()
}

// RecordCheckIn records check-in metrics
func RecordCheckIn(eventID int32) {
	CheckInsTotal.WithLabelValues(strconv.Itoa(int(eventID))).Inc()
}

// RecordUserRegistration records user registration metrics
func RecordUserRegistration() {
	UsersRegisteredTotal.Inc()
}

// RecordReprintRequest records reprint request metrics
func RecordReprintRequest(eventID int32) {
	ReprintRequestsTotal.WithLabelValues(strconv.Itoa(int(eventID))).Inc()
}

// RecordInviteeExpiration records invitee expiration metrics
func RecordInviteeExpiration() {
	InviteesExpiredTotal.Inc()
}

// RecordOrderExpiration records order expiration metrics
func RecordOrderExpiration() {
	OrdersExpiredTotal.Inc()
}

// RecordAnonymization records GDPR anonymization metrics
func RecordAnonymization(anonymizationType string) {
	AnonymizationRequestsTotal.WithLabelValues(anonymizationType).Inc()
}

// RecordRedisOperation records Redis operation metrics
func RecordRedisOperation(operation, status string) {
	RedisOperationsTotal.WithLabelValues(operation, status).Inc()
}

// RecordMinIOOperation records MinIO operation metrics
func RecordMinIOOperation(operation, status string) {
	MinIOOperationsTotal.WithLabelValues(operation, status).Inc()
}

// RecordRabbitMQPublish records RabbitMQ publish metrics
func RecordRabbitMQPublish(status string) {
	RabbitMQPublishesTotal.WithLabelValues(status).Inc()
}

// RecordWebSocketConnection records WebSocket connection metrics
func RecordWebSocketConnection(state string) {
	WebSocketConnections.WithLabelValues(state).Inc()
}

// UpdateSystemMetrics updates system-level metrics
func UpdateSystemMetrics() {
	// Update goroutines count
	GoRoutines.Set(float64(runtime.NumGoroutine()))

	// Update memory statistics
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	MemoryUsage.WithLabelValues("alloc").Set(float64(memStats.Alloc))
	MemoryUsage.WithLabelValues("total_alloc").Set(float64(memStats.TotalAlloc))
	MemoryUsage.WithLabelValues("sys").Set(float64(memStats.Sys))
	MemoryUsage.WithLabelValues("gc").Set(float64(memStats.NumGC))
}