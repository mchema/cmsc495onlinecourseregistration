# Course Registration System

Course Registration System is a CMSC 495 Group Delta project for managing users, courses, prerequisites, semesters, sections, and enrollments. The repository contains the backend API, the frontend client, database schema/seed data, and a published OpenAPI contract.

## API Documentation

[API Documentation](https://avraham-adi.github.io/cmsc495registrationsystem/#/) hosted on GitHub Pages.

## Notes

- The backend was updated to use server-side sessions instead of JWT to strengthen security.
- The [OpenAPI contract](https://avraham-adi.github.io/cmsc495registrationsystem/#/) is the API source of truth.

## Repository Layout

- `backend/`: Express backend and session-based authentication
- `frontend/`: Vite/React frontend
- `database/`: schema and seed SQL
- `scripts/`: setup, schema, seed, reset, and test helpers
- `docs/`: static Swagger UI site for GitHub Pages
- `OpenAPI.yaml`: source-of-truth API contract

## Prerequisites

- Node.js 18+
- npm
- MySQL 8+

## Environment

Create a local `.env` file in the repository root.

Required values:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME=sid`
- `NODE_ENV=development`

If you need a starting point, copy `.env.example` and update it to match the current session-based setup.

## Install

```bash
npm install
```

## Database Setup

Create the schema and seed the database:

```bash
npm run db:reset
```

This uses:

- [database/schema.sql](/Users/adiavraham/Documents/UMGC/CMSC495/cmsc495registrationsystem/cmsc495registrationsystem/database/schema.sql)
- [database/seeding_data.sql](/Users/adiavraham/Documents/UMGC/CMSC495/cmsc495registrationsystem/cmsc495registrationsystem/database/seeding_data.sql)

You can also run the setup helper:

```bash
npm run setup
```

## Run The Backend

```bash
npm start
```

Default backend URL:

```text
http://127.0.0.1:3000
```

Health check:

```text
GET /api/health
```

## Run The Frontend

Start the frontend from the frontend/ directory:

```bash
cd frontend
npm run dev
```

Default frontend URL:

```bash
http://localhost:5173
```

## API Test Suite

This project includes a contract-aligned automated API test suite that exercises the backend end to end against the live HTTP server and supplements that with focused service/domain unit-style checks.

Running `npm test` resets the database, starts the server, executes all suites, and generates a Markdown report at `Test Report.md`.

Suite Coverage:
- session-based authentication, session rotation, logout invalidation, and stale-session rejection
- first-login password-change gating across protected route families
- positive and negative validation for admin, course, prerequisite, semester, section, and enrollment workflows
- role-based authorization and ownership restrictions
- enrollment lifecycle behavior including waitlisting, promotion, drops, deletes, prerequisite enforcement, and access-code handling
- concurrency-sensitive behavior such as simultaneous enrollments, profile updates, role changes, and access-code operations
- regression checks for error response shape, service-layer guards, domain normalization, and transactional role updates

### Typical Local Workflow
1. Confirm MySQL is running.
2. Configure the root .env file.
3. Run npm run db:reset to initialize schema and seed data.
4. Start the backend with npm start.
5. Start the frontend from frontend/ with npm run dev.
6. Open http://localhost:5173 in your browser.
7. Test student and administrator workflows.

### Implemented Workflows
The current system supports:

- secure login and logout
- first-login password change
- protected route enforcement
- course catalog browsing
- enrollment and drop workflows
- prerequisite enforcement
- re-enrollment after drop
- completed-course visibility
- administrative user management
- administrative section management
- administrative enrollment completion workflow

## Useful Commands

```bash
npm run db:schema
npm run db:seed
npm run db:reset
npm run test
npm run lint
npm run build
```
## Additional Documentation
- Frontend-specific instructions: see frontend/README.md
- API contract: see OpenAPI.yaml
- Published API docs: see GitHub Pages Swagger UI
- Project deliverables: project plan, design, test plan, source code documents and user guide

## Team

### Group Delta
CMSC 495

Team Members:

Adi Avraham
Mark Chema
Timashly Cabrera