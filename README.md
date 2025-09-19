# NestJS Todo API


# Docker 

docker rm -f $(docker ps -aq) - Remove all containers

This is a simple API for managing a to-do list, built with NestJS, TypeORM, and PostgreSQL. It includes user authentication (JWT), role-based authorization, and database seeding for an admin user.

## Features

-   **User Management**: User registration and login.
-   **Authentication**: JWT-based authentication using Passport.
-   **Authorization**: Role-based access control (users vs. admins).
-   **Todo CRUD**: Full Create, Read, Update, Delete operations for todos.
-   **Database**: PostgreSQL with TypeORM.
-   **Validation**: DTO validation with `class-validator`.
-   **Documentation**: API documentation with Swagger.
-   **Database Seeding**: A script to create a default admin user.

---

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm
-   Docker and Docker Compose

### 1. Installation & Setup

1.  **Clone the repository** (if you haven't already).

2.  **Create a `.env` file** in the `nestjs-api` directory by copying the example:
    ```bash
    cp nestjs-api/.env.example nestjs-api/.env
    ```
    *This file holds your database credentials and admin user details for seeding.*

3.  **Install dependencies**:
    ```bash
    npm install --prefix nestjs-api
    ```

### 2. Running the Application with Docker

The easiest way to get the application and database running is with Docker Compose.

1.  **Start the services**:
    ```bash
    docker-compose up -d
    ```
    *This command will build and start the PostgreSQL database and Adminer (a database management tool).*

2.  **Run the NestJS application**:
    ```bash
    npm run --prefix nestjs-api start:dev
    ```

    You will see a log message confirming the server is running:
    ```
    [Nest] ... LOG [Bootstrap]
        Server is running on http://localhost:3000
        Docs -  http://localhost:3000/docs
        Adminer - http://localhost:8081
    ```

### 3. Seed the Database

To create the initial admin user, run the seeding script in a separate terminal.

```bash
npm run --prefix nestjs-api seed
```

This will create an administrator with the credentials specified in your `.env` file (`ADMIN_USERNAME` and `ADMIN_PASSWORD`). The default password for the admin is `admin`.

---

## 🔑 Authentication Flow

The authentication logic is straightforward and token-based.

1.  **Get an Access Token**:
    -   To get a token, you must send a `POST` request to the **public** `/auth/login` endpoint with a valid `username` and `password`.
    -   The server validates the credentials and returns a JWT `access_token`.

2.  **Access Protected Routes**:
    -   To access protected endpoints (e.g., creating a todo or viewing all users), you must include the token in the `Authorization` header of your request.
    -   The format must be: `Bearer <your_access_token>`.

### Example with `requests.http`

The included `requests.http` file automates this flow.

1.  Run the **`loginAdmin`** or **`loginUser`** request to get a token. The token is automatically stored in a variable (`@adminToken` or `@userToken`).
2.  Run any subsequent request (e.g., **`getAllUsers`**). The stored token will be automatically included in the `Authorization` header.

This ensures that you authenticate once to get a token, and then use that token for all protected actions, which is a standard and secure practice.
