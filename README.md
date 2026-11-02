# FindIt – Complete Lost & Found Platform

FindIt is a centralized, responsive lost-and-found web application built with React, Express, MongoDB, and JWT authentication. It enables users to report lost belongings, post found items, browse and filter listings, search by keywords/location, submit recovery claims, and manage reports through user and moderator dashboards.

---

## 1. Technology Stack

- **Frontend:** React 19 with Vite, Lucide Icons, React Router v7
- **Backend:** Node.js & Express.js (Express 5 compatible)
- **Database:** MongoDB with Mongoose (Atlas & local support)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **API Client:** Axios with request & response interceptors
- **Deployment:** Render, Railway, Vercel, Netlify, Docker compatible

---

## 2. Project Folder Structure

```text
findit/
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── CategoryIcon.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── BrowseItems.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── ItemDetails.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ModeratorDashboard.jsx
│   │   │   ├── MyClaims.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ReportItem.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   │   └── _redirects
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── claimController.js
│   │   │   └── itemController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── authorize.js
│   │   ├── models/
│   │   │   ├── Claim.js
│   │   │   ├── ClaimMessage.js
│   │   │   ├── ItemReport.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   └── itemRoutes.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── test-runner.js
├── docs/
│   ├── API_DOCUMENTATION.md
│   └── TEST_CASES.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Database Models

### 1. `User`
- `name` (String, required, max 80 chars)
- `email` (String, required, unique, lowercase, indexed)
- `passwordHash` (String, required, omitted from queries by default with `select: false`)
- `role` (String, enum: `['user', 'moderator']`, default: `'user'`)
- `createdAt` (Date, default: Date.now)

### 2. `ItemReport`
- `ownerId` (ObjectId referencing User, required, indexed)
- `reportType` (String, enum: `['Lost', 'Found']`, required, indexed)
- `title` (String, required, max 120 chars)
- `category` (String, required, max 60 chars)
- `description` (String, required, max 2000 chars)
- `eventDate` (Date, required)
- `locationText` (String, required, max 200 chars)
- `imageUrl` (String, optional URL)
- `status` (String, enum: `['Under Review', 'Resolved', 'Removed']`, default: `'Under Review'`, indexed)
- `createdAt` (Date, default: Date.now)

### 3. `Claim` & `ClaimMessage`
- `itemReportId` (ObjectId referencing ItemReport, required, indexed)
- `claimantId` (ObjectId referencing User, required, indexed)
- `message` (String, required, 10–1000 chars)
- `status` (String, enum: `['Pending', 'Approved', 'Rejected']`, default: `'Pending'`)
- `createdAt` (Date, default: Date.now)

---

## 4. API Endpoints

### Authentication
- `POST /api/auth/register`: Public registration (assigns `user` role)
- `POST /api/auth/register-moderator`: Authorized registration with access key
- `POST /api/auth/login`: Authenticate and receive JWT token
- `GET /api/auth/me`: Fetch authenticated user profile

### Item Reports
- `GET /api/items`: List reports with query filters (`search`, `category`, `location`, `type`, `status`)
- `POST /api/items`: Create report (authenticated; initial status `Under Review`)
- `GET /api/items/:id`: Fetch report details by ID
- `PATCH /api/items/:id`: Update report (owner can edit details; moderator can update status)
- `DELETE /api/items/:id`: Delete report (owner or moderator only)

### Claims
- `POST /api/items/:id/claims`: Submit a recovery claim for an item
- `GET /api/items/:id/claims`: View claims on an item
- `GET /api/items/claims/:claimId/messages`: Access recovery conversation
- `POST /api/items/claims/:claimId/messages`: Send follow-up conversation message

### Personal Dashboard
- `GET /api/me/items`: List all reports created by the current user
- `GET /api/me/claims`: List all claims submitted by the current user

---

## 5. Quick Start & Execution

### Option 1: Unified Project Root Scripts
From the repository root directory:

```bash
# Install dependencies for both client and server
npm run postinstall

# Run backend development server
npm run dev

# Run automated end-to-end API tests (15 suites)
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

### Option 2: Individual Development

**Terminal 1 (Backend API):**
```bash
cd server
npm install
npm run dev
```
*API runs on `http://localhost:5000/api`*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm install
npm run dev
```
*Client runs on `http://localhost:5173`*

---

## 6. Running Automated Tests

```bash
npm test
```

Expected output:
```text
✓ Health check returns 200 and ok
✓ Registration returns 201 & forces role "user"
✓ Duplicate email registration returns 409
✓ Login validation & 401 on wrong credentials
✓ Lost and Found item creation with ownerId binding
✓ Search and combined filtering (type, category, location)
✓ Claim submission and validation
✓ Dashboard private data scoping
✓ Ownership tampering protection (403 on other users' items)
✓ Moderator privileges for status management (Under Review, Resolved, Removed)
✓ Owner item deletion
ALL 15 TEST SUITES PASSED CLEANLY AND FULLY!
```
