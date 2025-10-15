{ pkgs, ... }:
{
  channel = "stable-24.05"; # or "unstable"

  packages = [
    pkgs.go_1_22
    pkgs.gopls
    pkgs.go-tools
    pkgs.gotools
    pkgs.delve
    pkgs.docker-compose
    pkgs.minio-client
    pkgs.nodejs_20
    pkgs.nodePackages.ts-node
    pkgs.sqlc
    pkgs.go-migrate
    pkgs.redis
    pkgs.rabbitmq-c
    pkgs.gnumake
    pkgs.postgresql
  ];

  env = {
    DATABASE_URL = "postgres://user:password@localhost:5432/eventpass_dev?sslmode=disable";
    REPLICA_DATABASE_URL = "postgres://user:password@localhost:5433/eventpass_replica?sslmode=disable";
    MINIO_ENDPOINT = "localhost:9003";
    MINIO_ACCESS_KEY_ID = "minioadmin";
    MINIO_SECRET_ACCESS_KEY = "minioadminpassword";
    MINIO_BUCKET_NAME = "eventpass";
    HMAC_SECRET = "super-secret-hmac-key";
    BASE_URL = "http://localhost:8080";
    REDIS_URL = "redis://localhost:6379/0";
    RABBITMQ_URL = "amqp://user:password@localhost:5472/";
  };

  services.docker = {
    enable = true;
  };

  idx = {
    extensions = [
      "golang.go"
    ];

    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        go-mod-tidy = "go mod tidy";
        # Force-recreate to avoid port conflicts with previous runs.
        docker-compose-up = "cd apps/backend && docker-compose up -d --force-recreate";
        run-migrations = "migrate -path apps/backend/db/migrations -database \"$DATABASE_URL\" up";
        sqlc-generate = "sqlc generate -f apps/backend/sqlc.yaml";
      };

      # Runs every time the workspace is (re)started
      onStart = {
        # Force-recreate to avoid port conflicts with previous runs.
        docker-compose-up = "cd apps/backend && docker-compose up -d --force-recreate";
        run-migrations = "migrate -path apps/backend/db/migrations -database \"$DATABASE_URL\" up";
        sqlc-generate = "sqlc generate -f apps/backend/sqlc.yaml";
      };
    };

    previews = {
      enable = true;
      previews = {
        backend = {
          command = ["go" "run" "./apps/backend"];
          manager = "web";
        };
        frontend = {
          command = ["npm" "run" "dev" "--prefix" "apps/frontend"];
          manager = "web";
        };
        minioconsole = {
          command = ["echo" "MinIO console running on http://localhost:9004"];
          manager = "web";
        };
        worker = {
          command = ["go" "run" "./apps/workers"];
          manager = "web";
        };
        reprinter = {
          command = ["go" "run" "./apps/reprinter"];
          manager = "web";
        };
        rabbitmq = {
          command = ["echo" "RabbitMQ management UI running on http://localhost:15672"];
          manager = "web";
        };
      };
    };
  };
}
