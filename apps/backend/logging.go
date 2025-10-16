package main

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"time"

	"eventpass.pro/apps/backend/db"
	"github.com/google/uuid"
)

// LogConfig holds configuration for the logging system
type LogConfig struct {
	Level      string `json:"level"`
	Format     string `json:"format"` // json or text
	Output     string `json:"output"` // stdout, stderr, or file path
	AddSource  bool   `json:"add_source"`
	EnableTracing bool `json:"enable_tracing"`
}

// Context keys for logging
type contextKey string

const (
	requestIDKey contextKey = "request_id"
	userIDKey    contextKey = "user_id"
	traceIDKey   contextKey = "trace_id"
)

const (
	RequestIDKey contextKey = "request_id"
	UserIDKey    contextKey = "user_id"
	TraceIDKey   contextKey = "trace_id"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	RequestID string                 `json:"request_id,omitempty"`
	UserID    string                 `json:"user_id,omitempty"`
	TraceID   string                 `json:"trace_id,omitempty"`
	Service   string                 `json:"service"`
	Version   string                 `json:"version"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Duration  string                 `json:"duration,omitempty"`
	File      string                 `json:"file,omitempty"`
	Line      int                    `json:"line,omitempty"`
	Function  string                 `json:"function,omitempty"`
}

// Global logger instance
var Logger *slog.Logger

// Initialize logging system
func InitLogging(config LogConfig) error {
	var handler slog.Handler
	var writer io.Writer

	// Set output destination
	switch config.Output {
	case "stdout":
		writer = os.Stdout
	case "stderr":
		writer = os.Stderr
	default:
		// For file output, create or append to file
		file, err := os.OpenFile(config.Output, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			return fmt.Errorf("failed to open log file: %w", err)
		}
		writer = file
	}

	// Set log level
	level := slog.LevelInfo
	switch config.Level {
	case "debug":
		level = slog.LevelDebug
	case "info":
		level = slog.LevelInfo
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	// Create handler options
	opts := &slog.HandlerOptions{
		Level: level,
		AddSource: config.AddSource,
	}

	// Choose format
	if config.Format == "json" {
		handler = slog.NewJSONHandler(writer, opts)
	} else {
		handler = slog.NewTextHandler(writer, opts)
	}

	Logger = slog.New(handler)

	// Add service context
	Logger = Logger.With(
		"service", "eventpass-backend",
		"version", "1.0.0",
	)

	return nil
}

// Context management functions
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, traceIDKey, traceID)
}

func GetRequestID(ctx context.Context) string {
	if requestID, ok := ctx.Value(requestIDKey).(string); ok {
		return requestID
	}
	return ""
}

func GetUserID(ctx context.Context) string {
	if userID, ok := ctx.Value(userIDKey).(string); ok {
		return userID
	}
	return ""
}

func GetTraceID(ctx context.Context) string {
	if traceID, ok := ctx.Value(traceIDKey).(string); ok {
		return traceID
	}
	return ""
}

// GenerateRequestID generates a new request ID
func GenerateRequestID() string {
	return uuid.New().String()
}

// GenerateTraceID generates a new trace ID
func GenerateTraceID() string {
	return uuid.New().String()
}

// Logging helper functions
func LogDebug(ctx context.Context, msg string, args ...slog.Attr) {
	logWithContext(ctx, slog.LevelDebug, msg, args...)
}

func LogInfo(ctx context.Context, msg string, args ...slog.Attr) {
	logWithContext(ctx, slog.LevelInfo, msg, args...)
}

func LogWarn(ctx context.Context, msg string, args ...slog.Attr) {
	logWithContext(ctx, slog.LevelWarn, msg, args...)
}

func LogError(ctx context.Context, msg string, err error, args ...slog.Attr) {
	logErrorWithContext(ctx, slog.LevelError, msg, err, args...)
}

func LogFatal(ctx context.Context, msg string, args ...slog.Attr) {
	logWithContext(ctx, slog.LevelError, msg, args...)
	os.Exit(1)
}

// Core logging function
func logWithContext(ctx context.Context, level slog.Level, msg string, args ...slog.Attr) {
	if Logger == nil {
		// Fallback to standard log if logger not initialized
		fmt.Printf("[%s] %s\n", level.String(), msg)
		return
	}

	// Base attributes
	attrs := []slog.Attr{
		slog.String("request_id", GetRequestID(ctx)),
		slog.String("user_id", GetUserID(ctx)),
		slog.String("trace_id", GetTraceID(ctx)),
	}

	// Add additional fields from args if provided
	attrs = append(attrs, args...)

	Logger.LogAttrs(ctx, level, msg, attrs...)
}

func logErrorWithContext(ctx context.Context, level slog.Level, msg string, err error, args ...slog.Attr) {
	if Logger == nil {
		// Fallback to standard log if logger not initialized
		fmt.Printf("[%s] %s: %v\n", level.String(), msg, err)
		return
	}

	attrs := []slog.Attr{
		slog.String("request_id", GetRequestID(ctx)),
		slog.String("user_id", GetUserID(ctx)),
		slog.String("trace_id", GetTraceID(ctx)),
		slog.String("error", err.Error()),
	}

	// Add additional fields from args if provided
	attrs = append(attrs, args...)

	Logger.LogAttrs(ctx, level, msg, attrs...)
}

// Request logging middleware
func requestLoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Generate request ID and trace ID
		requestID := GenerateRequestID()
		traceID := GenerateTraceID()

		// Add to context
		ctx := r.Context()
		ctx = WithRequestID(ctx, requestID)
		ctx = WithTraceID(ctx, traceID)
		ctx = WithUserID(ctx, getUserIDFromRequest(ctx, r))

		// Create response writer wrapper
		ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Log incoming request
		LogInfo(ctx, "HTTP request started",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("remote_addr", r.RemoteAddr),
			slog.String("user_agent", r.UserAgent()),
		)

		// Process request
		next.ServeHTTP(ww, r.WithContext(ctx))

		// Log response
		duration := time.Since(start)
		LogInfo(ctx, "HTTP request completed",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status_code", ww.statusCode),
			slog.String("duration", duration.String()),
		)

		// Record metrics
		RecordHTTPRequest(r.Method, r.URL.Path, ww.statusCode, duration)
	})
}

// Helper function to extract user ID from request context
func getUserIDFromRequest(ctx context.Context, _ *http.Request) string {
	// Try to get user from context (set by auth middleware)
	if user, ok := ctx.Value(userContextKey).(db.User); ok {
		if user.ID.Valid {
			return uuid.UUID(user.ID.Bytes).String()
		}
	}
	return ""
}

// Database operation logging
func LogDatabaseOperation(ctx context.Context, operation, table string, duration time.Duration, err error) {
	if err != nil {
		LogError(ctx, "Database operation failed",
			err,
			slog.String("operation", operation),
			slog.String("table", table),
			slog.String("duration", duration.String()),
		)
	} else {
		LogDebug(ctx, "Database operation completed",
			slog.String("operation", operation),
			slog.String("table", table),
			slog.String("duration", duration.String()),
		)
	}

	RecordDatabaseOperation(operation, table, duration)
}

// External service operation logging
func LogRedisOperation(ctx context.Context, operation string, duration time.Duration, err error) {
	if err != nil {
		LogError(ctx, "Redis operation failed",
			err,
			slog.String("operation", operation),
			slog.String("duration", duration.String()),
		)
		RecordRedisOperation(operation, "error")
	} else {
		LogDebug(ctx, "Redis operation completed",
			slog.String("operation", operation),
			slog.String("duration", duration.String()),
		)
		RecordRedisOperation(operation, "success")
	}
}

func LogMinIOOperation(ctx context.Context, operation string, duration time.Duration, err error) {
	if err != nil {
		LogError(ctx, "MinIO operation failed",
			err,
			slog.String("operation", operation),
			slog.String("duration", duration.String()),
		)
		RecordMinIOOperation(operation, "error")
	} else {
		LogDebug(ctx, "MinIO operation completed",
			slog.String("operation", operation),
			slog.String("duration", duration.String()),
		)
		RecordMinIOOperation(operation, "success")
	}
}

func LogRabbitMQOperation(ctx context.Context, operation string, err error) {
	if err != nil {
		LogError(ctx, "RabbitMQ operation failed",
			err,
			slog.String("operation", operation),
		)
		RecordRabbitMQPublish("error")
	} else {
		LogDebug(ctx, "RabbitMQ operation completed",
			slog.String("operation", operation),
		)
		RecordRabbitMQPublish("success")
	}
}

// Business event logging
func LogUserRegistration(ctx context.Context, email string) {
	LogInfo(ctx, "User registration completed",
		slog.String("email", email),
	)
	RecordUserRegistration()
}

func LogEventCreation(ctx context.Context, eventID int32, title string) {
	LogInfo(ctx, "Event created",
		slog.Int("event_id", int(eventID)),
		slog.String("title", title),
	)
	RecordEventCreation()
}

func LogQRCodeScan(ctx context.Context, qrCode string, status string, eventID int32) {
	LogInfo(ctx, "QR code scanned",
		slog.String("qr_code", qrCode),
		slog.String("status", status),
		slog.Int("event_id", int(eventID)),
	)
	RecordQRCodeScan(status)
	if status == "success" {
		RecordCheckIn(eventID)
	}
}

func LogInviteeUpload(ctx context.Context, eventID int32, count int) {
	LogInfo(ctx, "Invitees uploaded",
		slog.Int("event_id", int(eventID)),
		slog.Int("count", count),
	)
	RecordInviteeUpload(eventID)
}

func LogReprintRequest(ctx context.Context, inviteeID int32, userID string) {
	LogInfo(ctx, "Reprint request created",
		slog.Int("invitee_id", int(inviteeID)),
		slog.String("user_id", userID),
	)
	RecordReprintRequest(inviteeID)
}

func LogAnonymization(ctx context.Context, dataType string, id int32) {
	LogInfo(ctx, "GDPR anonymization completed",
		slog.String("type", dataType),
		slog.Int("id", int(id)),
	)
	RecordAnonymization(dataType)
}

// System event logging
func LogSystemStartup(ctx context.Context) {
	LogInfo(ctx, "EventPass Pro backend started",
		slog.String("version", "1.0.0"))
}

func LogSystemShutdown(ctx context.Context) {
	LogInfo(ctx, "EventPass Pro backend shutting down")
}

func LogCronJobStart(ctx context.Context, jobName string) {
	LogInfo(ctx, "Cron job started",
		slog.String("job", jobName),
	)
}

func LogCronJobComplete(ctx context.Context, jobName string, duration time.Duration, count int) {
	LogInfo(ctx, "Cron job completed",
		slog.String("job", jobName),
		slog.String("duration", duration.String()),
		slog.Int("processed_count", count),
	)
}

// WebSocket logging
func LogWebSocketConnection(ctx context.Context, action string) {
	LogInfo(ctx, "WebSocket connection",
		slog.String("action", action),
	)
	RecordWebSocketConnection(action)
}

// Error logging with stack trace
func LogErrorWithStack(ctx context.Context, msg string, err error) {
	// Get stack trace
	pc := make([]uintptr, 10)
	n := runtime.Callers(2, pc)
	frames := runtime.CallersFrames(pc[:n])

	stackTrace := ""
	for {
		frame, more := frames.Next()
		stackTrace += fmt.Sprintf("%s:%d %s\n", frame.File, frame.Line, frame.Function)
		if !more {
			break
		}
	}

	LogError(ctx, msg, err,
		slog.String("stack_trace", stackTrace),
	)
}
