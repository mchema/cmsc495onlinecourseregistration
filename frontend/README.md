# Online Course Registration System - Frontend

This directory contains the React frontend for Group Delta's Online Course Registration System. The frontend provides role-based interfaces for students and administrators and communicates with the Express backend through a centralized API layer.

## Overview

The frontend is built with React and Vite and is responsible for:

- user login and first-time password change
- protected route enforcement
- student course browsing and enrollment actions
- student schedule and completed-courses views
- administrator management views for users, sections, and enrollments

The application uses a shared authentication context and route protection to ensure that only authorized users can access the appropriate pages.

## Tech Stack

- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS utility classes
- Context API for authentication state

## Prerequisites

Before running the frontend, make sure you have:

- Node.js 18 or later
- npm
- the backend API running locally
- the project database configured and seeded through the backend setup

## Installation

From the `frontend/` directory, install dependencies:

```bash
npm install
```

## Running the Frontend

Start the development server:

```bash
npm run dev
```

The frontend will run at:

```bash
http://localhost:5173
```

## Backend Connection

During local development, the frontend communicates with the backend running at:

```bash
http://localhost:3000
```

Make sure the backend server is running before testing login, enrollment, admin management, or completed-course workflows.

## Key Features

## Student Features
   - secure login
   - first-login password change
   - course catalog browsing
   - section enrollment
   - course drop
   - current schedule view
   - completed courses view
   - prerequisite enforcement with user-friendly feedback

## Administrator Features
   - user management
   - paginated user list
   - role updates
   - section creation and editing
   - enrollment management
   - course completion updates for student progression

## Folder Structure

```Bash
frontend/
├── public/                  # Static assets
├── src/
│   ├── api/                 # Axios client and resource-specific API helpers
│   ├── components/          # Shared UI and layout components
│   ├── context/             # Global authentication/session context
│   ├── pages/               # Student and admin page views
│   ├── App.jsx              # Main application shell
│   └── main.jsx             # Frontend entry point
├── .env                     # Local frontend environment values if used
├── index.html               # Vite HTML entry
├── package.json             # Frontend dependencies and scripts
└── vite.config.js           # Vite configuration
```

## Important Pages

Typical frontend pages include:

    - `LoginPage.jsx`
    - `ChangePassword.jsx`
    - `CourseCatalog.jsx`
    - `StudentDashboard.jsx`
    - `CompletedCourses.jsx`
    - `AdminDashboard.jsx`
    - `ManageUsers.jsx`
    - `ManageSections.jsx`
    - `ManageEnrollments.jsx`

## Authentication and Routing

Authentication state is managed through AuthContext. Protected routes redirect users based on session status and role.

Examples:

    - unauthenticated users are redirected to /login
    - first-login users are redirected to the password-change page
    - student-only and admin-only pages are separated through protected route checks

## API Layer

All frontend requests are routed through the src/api/ directory. This keeps HTTP logic out of page components and improves maintainability.

Examples include:

- auth.js
- admin.js
- catalog.js
- enrollment.js
- client.js

## Available Scripts

Run the frontend locally:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run linting if configured:

```bash
npm run lint
```

## Typical Local Workflow
1.tart MySQL and confirm the database is seeded.
2.Start the backend from the project root or backend directory.
3.Start the frontend from the frontend/ directory with npm run dev.
4.Open http://localhost:5173.
5.Test student and administrator workflows through the browser.

## Notes
- This frontend depends on the backend being available for live authentication and workflow testing.
- Session behavior, enrollment validation, prerequisite checks, and admin actions are enforced by the backend and surfaced through the frontend UI.
- For final demonstration, verify the following workflows before presenting:
    - admin login
    - student first login and password change
    - course enrollment
    - prerequisite failure messaging
    - drop and re-enroll behavior
    - admin completion workflow
    - completed-course visibility

## Team

Group Delta
CMSC 495
Mark Chema
Timashly Cabrera