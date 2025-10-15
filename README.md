# Eventpass

This is a full-stack application for managing event tickets.

## Running the project

1.  **Start the services:**

    ```bash
    docker-compose up -d
    ```

2.  **Run the backend:**

    ```bash
    go run apps/backend/main.go
    ```

3.  **Run the frontend:**

    ```bash
    npm install --prefix apps/frontend
    npm run --prefix apps/frontend dev
    ```

## Login

To log in to the application, use the following credentials:

*   **Email:** `admin@eventpass.pro`
*   **Password:** `password`
