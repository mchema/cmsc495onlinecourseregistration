# cmsc495registrationsystem

## CMSC 495 Group Delta Course Registration System

This project currently exposes a REST API for authentication, admin user management, and course catalog management. This README is written for frontend integration and reflects the backend behavior that is actually mounted and tested right now.

## Backend Status

Implemented and available:
- Authentication and JWT session flow
- First-login password-change enforcement
- Admin user management
- Public course catalog read endpoints
- Admin course CRUD

Not currently mounted in the API:
- Sections
- Enrollments
- Prerequisites

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

### Current Backend Limitation

The frontend should not assume these APIs are available yet:
- sections
- enrollments
- prerequisites

If those screens exist in the frontend, they should be treated as not yet integrated.

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
