🚀 EventPass Pro — Monorepo Execution Plan (Final Version)

(AI-Ready, With Phase 0 Bootstrap)



⚙️ PHASE 0 — AI Runtime Foundation & Monorepo Bootstrap

🧠 Goal: make the AI capable of tracking, resuming, and updating progress from the very beginning — and create the minimal monorepo skeleton so the AI can run autonomously.

0.1 Create packages/ai-memory and essential files

packages/ai-memory/ai-rules.json — AI operational behavior

packages/ai-memory/plan-template.json — canonical full plan

packages/ai-memory/plan-memory.json — runtime state file

packages/ai-memory/memory-handler.ts — safe read/write + history

packages/ai-memory/backups/ — backup snapshots

0.2 ai-rules.json (AI operational definition)

File: packages/ai-memory/ai-rules.json

{
  "version": "1.0",
  "memory_file": "packages/ai-memory/plan-memory.json",
  "template_file": "packages/ai-memory/plan-template.json",
  "phase_transition": {
    "require_complete_previous": true,
    "auto_advance_when": ["scripted", "unit_tests_passed"],
    "manual_confirm_for": ["db_migration", "production_deploy"]
  },
  "memory_sync": {
    "auto_write_on_step_complete": true,
    "backup_interval_minutes": 5,
    "backup_path": "packages/ai-memory/backups/"
  },
  "error_handling": {
    "retry_limit": 3,
    "retry_backoff_seconds": 30,
    "on_persistent_error": "pause_and_notify"
  },
  "cli_behavior": {
    "show_progress": true,
    "allow_resume": true,
    "allow_force_advance": false
  },
  "logging": {
    "level": "info",
    "event_emit_channel": "ai-events"
  }
}

0.3 plan-template.json → plan-memory.json

plan-template.json — static canonical definition of all phases/steps.

plan-template.json

{
  "project": "EventPass Pro",
  "version": "1.0",
  "current_phase": 0,
  "current_step": "0.1",
  "status": "in-progress",
  "history": [],
  "phases": {
    "0": {
      "title": "AI Runtime Foundation & Monorepo Bootstrap",
      "status": "in-progress",
      "steps": {
        "0.1": {"title": "Create ai-memory files", "status": "pending"},
        "0.2": {"title": "ai-rules.json (AI operational definition)", "status": "pending"},
        "0.3": {"title": "plan-template.json -> plan-memory.json", "status": "pending"},
        "0.4": {"title": "Memory Handler (memory-handler.ts)", "status": "pending"},
        "0.5": {"title": "CLI Tooling (eventpass ai ...)", "status": "pending"},
        "0.6": {"title": "Minimal Monorepo Skeleton", "status": "pending"}
      }
    },
    "1": {
      "title": "Monorepo & Development Environment",
      "status": "pending",
      "steps": {
        "1.1": {"title": "Initialize root workspace", "status": "pending"},
        "1.2": {"title": "Directories & readme", "status": "pending"},
        "1.3": {"title": "Dev Docker Compose", "status": "pending"},
        "1.4": {"title": "Developer scripts", "status": "pending"}
      }
    },
    "2": {
      "title": "Backend Core Initialization",
      "status": "pending",
      "steps": {
        "2.1": {"title": "Initialize Go module (apps/backend)", "status": "pending"},
        "2.2": {"title": "SQL schema & sqlc", "status": "pending"},
        "2.3": {"title": "Basic REST scaffolding", "status": "pending"},
        "2.4": {"title": "Local migration flow", "status": "pending"}
      }
    },
    "3": {
      "title": "Auth, Tenant Isolation & Security",
      "status": "pending",
      "steps": {
        "3.1": {"title": "Authentication", "status": "pending"},
        "3.2": {"title": "Middleware", "status": "pending"},
        "3.3": {"title": "Rate limiting & HTTPS", "status": "pending"},
        "3.4": {"title": "Audit logging", "status": "pending"}
      }
    },
    "4": {
      "title": "Invitee Management & QR Codes",
      "status": "pending",
      "steps": {
        "4.1": {"title": "Upload invitees (CSV/Excel)", "status": "pending"},
        "4.2": {"title": "Generate QR codes with HMAC signatures", "status": "pending"},
        "4.3": {"title": "Secure QR reprint + audit", "status": "pending"},
        "4.4": {"title": "Invitee state transitions", "status": "pending"}
      }
    },
    "5": {
      "title": "Event Entry & Gift Management",
      "status": "pending",
      "steps": {
        "5.1": {"title": "QR Scan endpoint /scan/:qr", "status": "pending"},
        "5.2": {"title": "Duplicate prevention (Redis atomic key)", "status": "pending"},
        "5.3": {"title": "Gift claim locking (single-claim enforcement)", "status": "pending"},
        "5.4": {"title": "Live dashboard via Redis PubSub / WebSockets", "status": "pending"}
      }
    },
    "6": {
      "title": "High-Concurrency Workers & LibSQL Fallback",
      "status": "pending",
      "steps": {
        "6.1": {"title": "RabbitMQ queues & workers", "status": "pending"},
        "6.2": {"title": "Expiration logic (order.created -> order.expired)", "status": "pending"},
        "6.3": {"title": "LibSQL failover wrapper + sync worker", "status": "pending"},
        "6.4": {"title": "Conflict resolution (timestamp-based)", "status": "pending"}
      }
    },
    "7": {
      "title": "Analytics, Monitoring & Notifications",
      "status": "pending",
      "steps": {
        "7.1": {"title": "TimescaleDB continuous aggregates", "status": "pending"},
        "7.2": {"title": "Prometheus metrics + Grafana dashboards", "status": "pending"},
        "7.3": {"title": "Email (SMTP/SendGrid) + WhatsApp/Twilio notifications", "status": "pending"},
        "7.4": {"title": "Export reports (CSV/PDF)", "status": "pending"}
      }
    },
    "8": {
      "title": "Security, Compliance & Production Hardening",
      "status": "pending",
      "steps": {
        "8.1": {"title": "TLS & rate limiting", "status": "pending"},
        "8.2": {"title": "GDPR (anonymization + soft delete)", "status": "pending"},
        "8.3": {"title": "Multi-stage Dockerfiles for apps", "status": "pending"},
        "8.4": {"title": "GitHub Actions CI/CD (pipelines, tests, push, deploy)", "status": "pending"}
      }
    },
    "9": {
      "title": "AI Tracking & Self-Reporting",
      "status": "pending",
      "steps": {
        "9.1": {"title": "Continuous AI updates", "status": "pending"},
        "9.2": {"title": "Progress reports", "status": "pending"},
        "9.3": {"title": "Auto-learning heuristics", "status": "pending"}
      }
    }
  }
}


On first run, eventpass ai start copies template → memory file.

plan-memory.json becomes the live state (AI updates it continuously).

Example snippet:

{
  "project": "EventPass Pro",
  "version": "1.0",
  "current_phase": 0,
  "current_step": "0.1",
  "status": "in-progress",
  "phases": {
    "0": {
      "title": "AI Runtime Foundation & Monorepo Bootstrap",
      "status": "in-progress",
      "steps": {
        "0.1": {"title": "Create ai-memory files", "status": "done"},
        "0.2": {"title": "Initialize memory handler", "status": "pending"}
      }
    }
  },
  "history": []
}

0.4 Memory Handler (memory-handler.ts)

Implements atomic read/write & history logging.

Functions:

loadMemory()

saveStepComplete(stepId, meta)

getNextPendingStep()

resume()

backup()

Behavior:

Locks file during write.

Backs up every X minutes (from ai-rules.json).

Appends timestamped entries to history[].

0.5 CLI Tooling (eventpass ai ...)

Commands:

eventpass ai start       # initialize plan-memory.json from template
eventpass ai progress    # show current phase/step
eventpass ai next        # suggest next actionable item
eventpass ai confirm <id> # mark manual step complete
eventpass ai run-step <id> # run a scripted step


The CLI calls memory-handler and obeys ai-rules.json.



🧠 AI Bootstrap Flow (Execution Summary)

CI runs eventpass ai start.

AI copies plan-template.json → plan-memory.json.

AI loads ai-rules.json, begins from current_phase (usually 0).

AI reads each step; if scripted, executes it; if manual, waits for eventpass ai confirm <id>.

On success, AI marks step “done”, logs timestamp + history, and auto-advances.

Backups every 5 minutes or on critical step.

Errors trigger retry or pause per rules.

When final phase completes, AI archives history and generates summary report.


0.6 Minimal Monorepo Skeleton

Create empty directories:

apps/backend
apps/frontend
apps/workers
packages/shared
packages/configs
infra/docker


🧩 Monorepo Structure (Reference)
eventpass-pro/
├── apps/
│   ├── backend/                # Go (Gin) services
│   ├── frontend/               # Next.js + React + TS
│   ├── workers/                # Go background workers
│   └── utils/                  # CLI utilities
│
├── packages/
│   ├── shared/                 # Shared DTOs, validation, helpers
│   ├── configs/                # Env templates & docker fragments
│   └── ai-memory/              # ai-rules.json, plan-memory.json, memory handler
│
├── infra/
│   ├── docker/                 # docker-compose.yml, prod configs, Nginx
│   ├── migrations/             # SQL migrations (Postgres & Timescale)
│   └── monitoring/             # Prometheus / Grafana configs
│
├── docs/
├── .env
├── go.work
├── package.json
├── turbo.json (optional)
└── README.md

Commit them to git — this confirms Phase 0 completion.

✅ Deliverable:
AI is now self-aware, logging its steps, and can continue autonomously.

🧱 PHASE 1 — Monorepo & Development Environment

1.1 Initialize root workspace

go work init ./apps/backend ./apps/workers

Add package.json and optional turbo.json.

1.2 Directories & readme

Ensure all app and package directories exist.

Include README.md with build instructions.

1.3 Dev Docker Compose

infra/docker/docker-compose.yml → services:

postgres (with Timescale)

redis

rabbitmq

prometheus + grafana

optional libsql

1.4 Developer scripts

infra/scripts/dev-up.sh

infra/scripts/dev-down.sh

infra/scripts/reset-db.sh

✅ Deliverable: fully bootstrapped monorepo dev environment.

🛠 PHASE 2 — Backend Core Initialization

2.1 Initialize Go module (apps/backend)

go mod init github.com/org/eventpass-pro/backend

Install Gin, pgx, redis, amqp, prometheus, sqlc.

2.2 SQL schema & sqlc

Create migrations: users, events, invitees, gifts, audit_logs, gift_logs.

Generate types via sqlc.

2.3 Basic REST scaffolding

cmd/api/main.go with routes: /health, /metrics, /auth, /invitees, /scan, /gift, /events.

2.4 Local migration flow

Migration runner + shell script in infra/scripts/migrate.sh.

✅ Deliverable: backend API + migrations functional.

🔐 PHASE 3 — Auth, Tenant Isolation & Security

3.1 Authentication

signup, signin, refresh endpoints (bcrypt + JWT).

3.2 Middleware

tenantMiddleware + rbacMiddleware.

3.3 Rate limiting & HTTPS

Redis rate limiter.

Security headers, Nginx reverse proxy.

3.4 Audit logging

Middleware logs all state-changes to audit_logs.

✅ Deliverable: secure auth + tenant isolation working.

🎟 PHASE 4 — Invitee Management & QR Codes

4.1 Upload invitees (CSV/Excel)
4.2 Generate QR codes with HMAC signatures
4.3 Secure QR reprint + audit
4.4 Invitee state transitions (pending, checked_in, gift_claimed)

✅ Deliverable: full invitee flow with QR tracking.

🚪 PHASE 5 — Event Entry & Gift Management

5.1 QR Scan endpoint /scan/:qr
5.2 Duplicate prevention (Redis atomic key)
5.3 Gift claim locking (single-claim enforcement)
5.4 Live dashboard via Redis PubSub / WebSockets

✅ Deliverable: reliable on-site entry + gift system.

⚡ PHASE 6 — High-Concurrency Workers & LibSQL Fallback

6.1 RabbitMQ queues & workers
6.2 Expiration logic (order.created → order.expired)
6.3 LibSQL failover wrapper + sync worker
6.4 Conflict resolution (timestamp-based)

✅ Deliverable: async processing + DB failover safety.

📊 PHASE 7 — Analytics, Monitoring & Notifications

7.1 TimescaleDB continuous aggregates
7.2 Prometheus metrics + Grafana dashboards
7.3 Email (SMTP/SendGrid) + WhatsApp/Twilio notifications
7.4 Export reports (CSV/PDF)

✅ Deliverable: insights + alerts + analytics ready.

🧱 PHASE 8 — Security, Compliance & Production Hardening

8.1 TLS & rate limiting
8.2 GDPR (anonymization + soft delete)
8.3 Multi-stage Dockerfiles for apps
8.4 GitHub Actions CI/CD (pipelines, tests, push, deploy)

✅ Deliverable: hardened builds and deployment pipeline.

🤖 PHASE 9 — AI Tracking & Self-Reporting

(This phase extends Phase 0’s foundation; not for initial bootstrapping.)

9.1 Continuous AI updates

AI appends every completed step to plan-memory.json.history.

9.2 Progress reports

Generate summaries: completed phases, durations, errors.

9.3 Auto-learning heuristics

Adjust retry rules (but require manual approval for production).

✅ Deliverable: self-updating AI project memory and reports.



