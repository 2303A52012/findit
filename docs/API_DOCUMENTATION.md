# FindIt API Documentation

FindIt is a RESTful API powering the Lost & Found platform.

**Base URL:** `http://localhost:5000/api`

---

## 1. Authentication Headers

All protected endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 2. Authentication Endpoints

### 2.1 Citizen / User Registration
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public
- **Description:** Registers a standard community user. Always assigns `role: "user"`.
- **Request Body:**
  ```json
  {
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "password123"
  }
  ```
- **Validation Rules:**
  - `name`: String, 2 to 80 characters, required.
  - `email`: Valid email format, normalized, required, unique.
  - `password`: String, minimum 6 characters, required.
- **Success Response:** `201 Created`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": {
      "id": "67219abc...",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "user",
      "createdAt": "2026-10-30T10:00:00.000Z"
    }
  }
  ```

### 2.2 Administrator / Staff Registration
- **Method:** `POST`
- **Path:** `/api/auth/register-moderator`
- **Access:** Restricted (Requires Administrator Access Key)
- **Description:** Registers a facility staff member or moderator account. Assigns `role: "moderator"`.
- **Request Body:**
  ```json
  {
    "name": "Officer Davis",
    "email": "davis@findit.org",
    "password": "password123",
    "adminSecretCode": "admin123"
  }
  ```
- **Validation Rules:**
  - `name`: String, 2 to 80 characters, required.
  - `email`: Valid email format, normalized, required, unique.
  - `password`: String, minimum 6 characters, required.
  - `adminSecretCode`: Required string matching the configured `process.env.MODERATOR_SECRET_KEY`.
- **Success Response:** `201 Created` (returns JWT and user profile with `role: "moderator"`).
- **Error Responses:**
  - `403 Forbidden`: Invalid or missing administrator access code.

### 2.3 User & Administrator Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "alice@example.com",
    "password": "password123"
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": {
      "id": "67219abc...",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "user",
      "createdAt": "2026-10-30T10:00:00.000Z"
    }
  }
  ```

---

## 3. Item Reports Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/items` | Public | List reports; supports `search`, `category`, `location`, `type`, and `status` |
| POST | `/api/items` | Authenticated | Create report (status starts as `Under Review`) |
| GET | `/api/items/:id` | Public | Fetch report details by ID |
| PATCH | `/api/items/:id` | Owner / Moderator | Edit details (Owner) or update `status` (Moderator only) |
| DELETE | `/api/items/:id` | Owner / Moderator | Delete report |

---

## 4. Claims Endpoints

- **`POST /api/items/:id/claims`**: Authenticated user submits a verification claim with message (10–1000 characters). Initial status is `Pending`.

---

## 5. Personal Dashboard Endpoints

- **`GET /api/me/items`**: Authenticated user retrieves their owned item reports.
- **`GET /api/me/claims`**: Authenticated user retrieves their submitted recovery claims.

---

## 6. Health Check Endpoint

- **`GET /api/health`**: Returns `200 OK` with `{ "status": "ok" }`.
