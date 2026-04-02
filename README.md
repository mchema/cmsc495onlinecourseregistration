# cmsc495registrationsystem

## CMSC 495 Group Delta Course Registration System

This project currently exposes a REST API for authentication, admin user management, course catalog management, section management, prerequisite management, semester management, and enrollment workflows. This README is written for frontend integration and reflects the backend behavior that is actually mounted and tested right now.

## Backend Status

Implemented and available:

- Authentication and JWT session flow
- First-login password-change enforcement
- Admin user management
- Public course catalog read endpoints
- Admin course CRUD
- Public section read endpoints
- Admin section CRUD
- Public prerequisite read endpoints
- Admin prerequisite management
- Public semester read endpoints
- Admin semester create/delete
- Enrollment creation, update, and admin delete
- Waitlist placement and automatic promotion when seats open
- Professor/admin section access-code management
- Access-code based enrollment promotion
- API test runner coverage for the full mounted backend

## Local Run

Install dependencies:

```bash
npm install
```

Create and seed the database:

```bash
npm run db:reset
```

Start the backend:

```bash
npm start
```

Default API base URL:

```text
http://127.0.0.1:3000
```

## Required Environment Variables

Backend server:

- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Optional API test overrides:

- `API_TEST_BASE_URL`
- `API_TEST_SERVER_ENTRY`
- `API_TEST_READY_TIMEOUT_MS`
- `API_TEST_ADMIN_EMAIL`
- `API_TEST_ADMIN_PASSWORD`

## Seed Data

The database now seeds from `database/seeding_data.sql`.

Seed data includes:

- admin, professor, and student users
- current and historical semesters
- current and historical sections
- prerequisite relationships
- historical and active enrollments for transcript and prerequisite scenarios
- section access codes

Seeded admin login:

```text
Email: horne_chri87@gmail.com
Password: R@k4RGAd9j9CcV@rfvCzX3CeLZo-
```

## Authentication Model

The backend uses Bearer JWT authentication.

Send the token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

## First-Login Behavior

Newly created users are flagged as first-login users.

While `firstLogin` is still true, the user may only access:

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`

All other protected routes return:

```json
{
    "error": "Password change required before accessing this resource."
}
```

After password change, the backend returns a fresh JWT and `firstLogin: false`.

## Common Response Patterns

Success responses usually return `200` or `201`.

Validation and auth errors usually return:

- `400` invalid request body/query/params
- `401` missing or invalid token / invalid login
- `403` forbidden or first-login restricted
- `404` not found
- `409` duplicate resource

Error shape:

```json
{
    "error": "Human readable message"
}
```

Notes:

- some operational errors also return a machine-readable `code`
- some validation or conflict responses also return a `details` object

## User Object Shape

Returned from auth and admin endpoints:

```json
{
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "first_login": 0,
    "role": "ADMIN",
    "role_id": 1000,
    "role_details": 1
}
```

Notes:

- `role` is one of `ADMIN`, `PROFESSOR`, `STUDENT`
- `role_details` means:
    - admin: access level number
    - professor: department string
    - student: major string

## Course Object Shape

Returned from course endpoints:

```json
{
    "course_id": 1,
    "course_code": "CMSC140",
    "title": "Introduction to Programming",
    "description": "Course description",
    "credits": 3
}
```

`GET /api/courses` returns each course plus a derived `subject` field:

```json
{
    "course_id": 1,
    "course_code": "CMSC140",
    "title": "Introduction to Programming",
    "description": "Course description",
    "credits": 3,
    "subject": "Computer Science"
}
```

## Section Object Shape

Returned from section endpoints:

```json
{
    "section_id": 5500,
    "course_id": 130,
    "semester_id": 1,
    "professor_id": 1000,
    "capacity": 24,
    "days": "MW",
    "start_time": "09:00:00",
    "end_time": "10:15:00"
}
```

## Semester Object Shape

Returned from semester endpoints:

```json
{
    "semester_id": 8,
    "term": "Fall",
    "year": 2026
}
```

## Prerequisite Object Shape

Returned from prerequisite endpoints:

```json
{
    "courseId": 15,
    "courseCode": "CMSC330",
    "title": "Advanced Programming Languages"
}
```

## Enrollment Object Shape

Returned from enrollment endpoints:

```json
{
    "enrollment_id": 91,
    "student_id": 10000000,
    "section_id": 5500,
    "status": "enrolled"
}
```

## Mounted Routes

### Health

`GET /api/health`

Response:

```json
{
    "message": "API is running"
}
```

### Auth

#### `POST /api/auth/login`

Request body:

```json
{
    "email": "user@example.com",
    "password": "Password123!"
}
```

Response:

```json
{
    "message": "Login Successful",
    "firstLogin": false,
    "token": "<jwt>",
    "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "user@example.com",
        "first_login": 0,
        "role": "ADMIN",
        "role_id": 1000,
        "role_details": 1
    }
}
```

#### `GET /api/auth/me`

Requires token.

Response:

```json
{
    "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "user@example.com",
        "first_login": 0,
        "role": "ADMIN",
        "role_id": 1000,
        "role_details": 1
    }
}
```

#### `POST /api/auth/logout`

Requires token.

Response:

```json
{
    "message": "Logout Successful"
}
```

Note:

- logout is stateless; the frontend should discard the token locally

#### `POST /api/auth/change-password`

Requires token.

Request body:

```json
{
    "newPassword": "NewPassword123!"
}
```

Response:

```json
{
    "message": "Password changed successfully.",
    "firstLogin": false,
    "token": "<jwt>",
    "user": {
        "id": 25,
        "name": "Student User",
        "email": "student@example.com",
        "first_login": 0,
        "role": "STUDENT",
        "role_id": 10000001,
        "role_details": "Computer Science"
    }
}
```

Frontend rule:

- replace the stored token with the new token returned here

#### `POST /api/auth/update-user`

Requires token.

Request body:

```json
{
    "name": "Updated Name",
    "email": "updated@example.com"
}
```

Response:

```json
{
    "message": "Updated user info successfully.",
    "token": "<jwt>",
    "user": {
        "id": 25,
        "name": "Updated Name",
        "email": "updated@example.com",
        "first_login": 0,
        "role": "STUDENT",
        "role_id": 10000001,
        "role_details": "Computer Science"
    }
}
```

Frontend rule:

- replace the stored token with the new token returned here

### Courses

#### `GET /api/courses`

Public endpoint.

Query params:

- `page` optional, positive integer, default `1`
- `limit` optional, positive integer up to `100`, default `10`
- `search` optional string
- `subject` optional 4-letter code

Supported subject codes:

- `CMSC`
- `MATH`
- `ENGL`
- `HIST`
- `PHYS`
- `CHEM`
- `NURS`
- `IFSM`

Example:

```text
GET /api/courses?page=1&limit=10&search=programming&subject=CMSC
```

Response:

```json
{
    "courses": [
        {
            "course_id": 1,
            "course_code": "CMSC140",
            "title": "Introduction to Programming",
            "description": "Course description",
            "credits": 3,
            "subject": "Computer Science"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
    }
}
```

#### `GET /api/courses/:courseId`

Public endpoint.

Response:

```json
{
    "course_id": 1,
    "course_code": "CMSC140",
    "title": "Introduction to Programming",
    "description": "Course description",
    "credits": 3
}
```

#### `POST /api/courses`

Admin only.

Request body:

```json
{
    "courseCode": "CMSC495A",
    "courseTitle": "Current Trends and Projects in Computer Science",
    "courseDescription": "Capstone course description",
    "courseCredits": 3
}
```

Rules:

- course code format: `ABCD123` or `ABCD123A`
- duplicate course codes return `409`

Response:

```json
{
    "message": "Course added successfully.",
    "course": {
        "course_id": 130,
        "course_code": "CMSC495A",
        "title": "Current Trends and Projects in Computer Science",
        "description": "Capstone course description",
        "credits": 3
    }
}
```

#### `PATCH /api/courses/:courseId`

Admin only.

Request body uses the same shape as create.

Response:

```json
{
    "message": "Course updated successfully.",
    "course": {
        "course_id": 130,
        "course_code": "CMSC495B",
        "title": "Updated Title",
        "description": "Updated description",
        "credits": 4
    }
}
```

#### `DELETE /api/courses/:courseId`

Admin only.

Response:

```json
{
    "message": "Course deleted successfully."
}
```

Important:

- a course cannot be deleted if it already has scheduled sections
- in that case the backend returns `400`

### Sections

#### `GET /api/sections`

Public endpoint.

Query params:

- `page` optional, positive integer, default `1`
- `limit` optional, positive integer up to `100`, default `10`
- `search` optional string
- `semesterId` optional positive integer
- `professorId` optional positive integer

Response:

```json
{
    "sections": [
        {
            "section_id": 5500,
            "course_id": 130,
            "semester_id": 1,
            "professor_id": 1000,
            "capacity": 24,
            "days": "MW",
            "start_time": "09:00:00",
            "end_time": "10:15:00"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
    }
}
```

Notes:

- `search` matches `section_id` and `professor_id`
- `semesterId` and `professorId` can be combined with pagination and search

#### `GET /api/courses/:courseId/sections`

Public endpoint.

Uses the same query params and response shape as `GET /api/sections`, but results are restricted to the specified course.

#### `GET /api/sections/:sectionId`

Public endpoint.

Response:

```json
{
    "message": "Section info retrieved successfully.",
    "section": {
        "section_id": 5500,
        "course_id": 130,
        "semester_id": 1,
        "professor_id": 1000,
        "capacity": 24,
        "days": "MW",
        "start_time": "09:00:00",
        "end_time": "10:15:00"
    }
}
```

#### `POST /api/courses/:courseId/sections`

Admin only.

Request body:

```json
{
    "semesterId": 1,
    "professorId": 1000,
    "capacity": 24,
    "days": "MW",
    "startTime": "09:00",
    "endTime": "10:15"
}
```

Rules:

- `semesterId`, `professorId`, and `capacity` must be positive integers
- `days` must use canonical unique day codes in order, such as `MW`, `TR`, or `MWF`
- `startTime` and `endTime` must both be provided together
- times must use `HH:MM` 24-hour input format
- `startTime` must be earlier than `endTime`
- the backend persists times to the database `TIME` columns and returns them as `HH:MM:SS`
- unknown `courseId`, `semesterId`, or `professorId` return `404`

Response:

```json
{
    "message": "Section added successfully.",
    "section": {
        "section_id": 5500,
        "course_id": 130,
        "semester_id": 1,
        "professor_id": 1000,
        "capacity": 24,
        "days": "MW",
        "start_time": "09:00:00",
        "end_time": "10:15:00"
    }
}
```

#### `PATCH /api/sections/:sectionId`

Admin only.

Request body uses the same shape and validation rules as section create.

Response:

```json
{
    "message": "Section updated successfully.",
    "section": {
        "section_id": 5500,
        "course_id": 130,
        "semester_id": 2,
        "professor_id": 1000,
        "capacity": 18,
        "days": "TR",
        "start_time": "13:30:00",
        "end_time": "14:45:00"
    }
}
```

#### `DELETE /api/sections/:sectionId`

Admin only.

Response:

```json
{
    "message": "Section removed successfully."
}
```

Important:

- a section cannot be deleted if it has enrollments
- in that case the backend returns `400`

### Admin

All admin routes require:

- valid token
- `ADMIN` role
- user must not still be in first-login state

#### `POST /api/admin/users`

Request body for admin:

```json
{
    "name": "Admin User",
    "email": "admin2@example.com",
    "userType": "ADMIN",
    "roleDetails": 1
}
```

Request body for professor:

```json
{
    "name": "Professor User",
    "email": "prof@example.com",
    "userType": "PROFESSOR",
    "roleDetails": "Computer Science"
}
```

Request body for student:

```json
{
    "name": "Student User",
    "email": "student@example.com",
    "userType": "STUDENT",
    "roleDetails": "Computer Science"
}
```

Response:

```json
{
    "message": "User created successfully."
}
```

Important:

- default password for newly created users is `name + email`
- newly created users start in first-login mode

#### `GET /api/admin/users`

Query params:

- `page` optional, default `1`
- `limit` optional, default `10`
- `search` optional string
- `role` optional: `ADMIN`, `PROFESSOR`, `STUDENT`

Response:

```json
{
    "users": [
        {
            "id": 25,
            "name": "Student User",
            "email": "student@example.com",
            "first_login": 1,
            "role": "STUDENT",
            "role_id": 10000001,
            "role_details": "Computer Science"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
    }
}
```

#### `GET /api/admin/users/:id`

Response:

```json
{
    "user": {
        "id": 25,
        "name": "Student User",
        "email": "student@example.com",
        "first_login": 1,
        "role": "STUDENT",
        "role_id": 10000001,
        "role_details": "Computer Science"
    }
}
```

#### `PATCH /api/admin/users/:id/role`

Request body:

```json
{
    "userType": "PROFESSOR",
    "roleDetails": "Computer Science"
}
```

Or:

```json
{
    "userType": "ADMIN",
    "roleDetails": 1
}
```

Response:

```json
{
    "message": "User role updated successfully."
}
```

Important protections:

- admins cannot remove their own admin role
- the system cannot remove the last remaining admin

#### `DELETE /api/admin/users/:id`

Response:

```json
{
    "message": "User removed successfully."
}
```

### Prerequisites

#### `GET /api/prerequisites/:courseId`

Public endpoint.

Response:

```json
{
    "prerequisites": [
        {
            "courseId": 15,
            "courseCode": "CMSC330",
            "title": "Advanced Programming Languages"
        }
    ]
}
```

#### `POST /api/prerequisites`

Admin only.

Request body:

```json
{
    "courseId": 20,
    "prerequisiteId": 15
}
```

Response:

```json
{
    "message": "Prerequisite added successfully."
}
```

Important:

- duplicate prerequisite links return `409`
- missing course ids return `404`
- a course cannot be its own prerequisite

#### `DELETE /api/prerequisites/:courseId/:prerequisiteId`

Admin only.

Response:

```json
{
    "message": "Prerequisite deleted successfully."
}
```

### Semesters

#### `GET /api/semesters`

Public endpoint.

Response:

```json
{
    "semesters": [
        {
            "semester_id": 8,
            "term": "Fall",
            "year": 2026
        }
    ]
}
```

#### `GET /api/semesters/:semesterId`

Public endpoint.

Response:

```json
{
    "semester": {
        "semester_id": 8,
        "term": "Fall",
        "year": 2026
    }
}
```

#### `POST /api/semesters`

Admin only.

Request body:

```json
{
    "term": "Spring",
    "year": 2027
}
```

Response:

```json
{
    "message": "Semester added successfully.",
    "semester": {
        "semester_id": 9,
        "term": "Spring",
        "year": 2027
    }
}
```

Important:

- duplicate `term` and `year` combinations return `409`

#### `DELETE /api/semesters/:semesterId`

Admin only.

Response:

```json
{
    "message": "Semester removed successfully."
}
```

Important:

- a semester cannot be deleted if sections still reference it

### Enrollments

All enrollment routes require:

- valid token
- `ADMIN` or `STUDENT` role
- user must not still be in first-login state

#### `GET /api/enrollments/:enrollmentId`

Protected endpoint.

Response:

```json
{
    "enrollment": {
        "enrollment_id": 91,
        "student_id": 10000000,
        "section_id": 5500,
        "status": "enrolled"
    }
}
```

#### `POST /api/enrollments`

Protected endpoint.

Request body:

```json
{
    "studentId": 10000000,
    "sectionId": 5500,
    "accessCode": "optional-access-code"
}
```

Behavior:

- enforces prerequisites
- enforces time-conflict validation
- enforces section capacity
- places students on a waitlist when the section is full and waitlist space exists
- can enroll directly with a valid access code

Response:

```json
{
    "message": "Enrollment created successfully.",
    "enrollment": {
        "enrollment_id": 91,
        "student_id": 10000000,
        "section_id": 5500,
        "status": "enrolled"
    }
}
```

#### `PATCH /api/enrollments/:enrollmentId`

Protected endpoint.

Request body:

```json
{
    "status": "dropped",
    "accessCode": "optional-access-code"
}
```

Behavior:

- students can drop their own enrollments with `status = "dropped"`
- dropping an enrolled student opens a seat and promotes the next waitlisted student
- access codes can promote a student from `waitlisted` to `enrolled`
- enrollment history is preserved instead of being deleted on student drop

Response:

```json
{
    "message": "Enrollment updated successfully.",
    "enrollment": {
        "enrollment_id": 91,
        "student_id": 10000000,
        "section_id": 5500,
        "status": "dropped"
    }
}
```

#### `DELETE /api/enrollments/:enrollmentId`

Admin only.

Response:

```json
{
    "message": "Enrollment removed successfully."
}
```

## API Test Runner

The API Test Runner now operates as a pure external client and does not read from or write to the database directly.

Covered areas include:

- authentication and first-login flow
- admin users
- courses
- sections and access codes
- prerequisites
- semesters
- enrollments, waitlists, and access-code promotion

Primary entry point:

- `scripts/apiTestRunner.js`

## React Notes

The frontend is planned for React and the repository already includes React, React Router, and Vite.

Suggestions for frontend usage:

- keep API calls in dedicated service modules instead of placing `fetch` calls directly in components
- centralize JWT storage and `Authorization` header handling
- route first-login users directly to a password change screen after login
- separate admin, professor, and student views by role
- treat `403`, `409`, prerequisite failures, full sections, and schedule conflicts as expected UI states
- use the seeded historical enrollment data for transcript and academic-record views

Important protections:

- admins cannot delete their own account
- the system cannot delete the last remaining admin

## Frontend Integration Notes

### Token Storage

The frontend should update stored auth state after:

- login
- password change
- profile update

Each of those routes returns a usable JWT plus the current user payload.

### Recommended Auth State Shape

```json
{
    "token": "<jwt>",
    "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "first_login": 0,
        "role": "ADMIN",
        "role_id": 1000,
        "role_details": 1
    },
    "firstLogin": false
}
```

### Route Guarding Suggestions

Frontend should treat users as:

- public user: no token
- authenticated first-login user
- authenticated standard user
- admin user

Recommended UI rules:

- if `firstLogin === true`, send user to forced password-change flow
- hide admin pages unless `user.role === 'ADMIN'`
- use the refreshed token returned by `change-password` and `update-user`

## API Testing

Run the backend integration test runner:

```bash
npm test
```

Normal successful output:

```text
All tests passed.
```

Verbose mode:

```bash
API_TEST_VERBOSE=true npm test
```
