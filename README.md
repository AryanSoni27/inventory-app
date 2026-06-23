# 📦 Inventory Management System

A full-stack inventory management application built with **Spring Boot** (backend) and **Next.js** (frontend).

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript    |
| Backend    | Spring Boot 3.2, Java 17           |
| Database   | MySQL 8.0                          |
| Auth       | JWT (JSON Web Tokens)              |
| Styling    | Tailwind CSS                       |
| Deployment | Docker & Docker Compose            |

## Features

- 🔐 JWT-based authentication with role-based access (Admin / Staff)
- 📦 Full CRUD for inventory items
- 📊 Stock add / remove transactions with audit trail
- 👥 User management (Admin only)
- 📱 Responsive, modern UI

## Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/AryanSoni27/inventory-app.git
cd inventory-app

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api

## Local Development

### Backend
```bash
cd inventory-backend
./mvnw spring-boot:run
```
> Requires Java 17+ and MySQL running on localhost:3306

### Frontend
```bash
cd inventory-frontend
npm install
npm run dev
```

## Default Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |

## Project Structure

```
inventory-app/
├── inventory-backend/       # Spring Boot REST API
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── inventory-frontend/      # Next.js UI
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # Multi-container orchestration
├── .env.example             # Environment variable template
└── README.md
```

## License

This project is for educational/personal use.
