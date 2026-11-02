# FindIt Test Cases & Verification Suite

This document defines the manual and automated verification scenarios for FindIt.

---

## Automated Test Execution

Run the complete 14-suite automated integration test runner:

```powershell
cd server
npm test
```

---

## Test Scenarios Matrix

| # | Test Case | Target / Endpoint | Input Data | Expected Output | Status |
|---|---|---|---|---|---|
| 1 | **User Registration** | `POST /api/auth/register` | Valid name, email, password | HTTP 201; returns JWT and user with role `user`. Password hash never exposed. | PASSED |
| 2 | **Prevent Duplicate Registration** | `POST /api/auth/register` | Same email as existing user | HTTP 409 Conflict. | PASSED |
| 3 | **Valid User Login** | `POST /api/auth/login` | Correct registered email & password | HTTP 200; returns JWT token and user profile. | PASSED |
| 4 | **Invalid Password Login** | `POST /api/auth/login` | Correct email, wrong password | HTTP 401 Unauthorized. | PASSED |
| 5 | **Nonexistent Email Login** | `POST /api/auth/login` | Email not in DB, any password | HTTP 401 Unauthorized. | PASSED |
| 6 | **Create Lost Report** | `POST /api/items` (auth) | Type: "Lost", Title, Description (>=10 chars), Location, Date | HTTP 201 Created; status defaults to "Under Review"; ownerId bound to user. | PASSED |
| 7 | **Create Found Report** | `POST /api/items` (auth) | Type: "Found", Title, Description, Location, Date | HTTP 201 Created. | PASSED |
| 8 | **Validation Rejection** | `POST /api/items` (auth) | Title: "", Description < 10 chars, Invalid date | HTTP 400 Bad Request with field errors. | PASSED |
| 9 | **Public Browse Listings** | `GET /api/items` | None | HTTP 200; returns newest active items (excludes Removed). | PASSED |
| 10 | **Filter by Report Type** | `GET /api/items?type=Lost` | `type=Lost` | HTTP 200; only items with `reportType: "Lost"`. | PASSED |
| 11 | **Search by Keyword** | `GET /api/items?search=wallet` | Search query string | HTTP 200; matches title, category, or location. | PASSED |
| 12 | **Search by Category** | `GET /api/items?category=Electronics` | Category filter | HTTP 200; returns items with matching category. | PASSED |
| 13 | **Search by Location** | `GET /api/items?location=Library` | Location filter | HTTP 200; returns items with matching location. | PASSED |
| 14 | **Get Item Details** | `GET /api/items/:id` | Valid existing item ID | HTTP 200; returns item populated with owner name & email. | PASSED |
| 15 | **Invalid Item ID Format** | `GET /api/items/abc-123` | Malformed ObjectId | HTTP 400 Bad Request ("Invalid item ID"). | PASSED |
| 16 | **Nonexistent Item ID** | `GET /api/items/507f1f77bcf86cd799439011` | Nonexistent ObjectId | HTTP 404 Not Found. | PASSED |
| 17 | **Submit Valid Claim** | `POST /api/items/:id/claims` (auth) | Message >= 10 characters | HTTP 201 Created; status defaults to "Pending"; claimantId bound to user. | PASSED |
| 18 | **Submit Short Claim** | `POST /api/items/:id/claims` (auth) | Message < 10 characters | HTTP 400 Bad Request. | PASSED |
| 19 | **Personal Dashboard Reports** | `GET /api/me/items` (auth) | Authenticated user token | HTTP 200; returns strictly items created by the user. | PASSED |
| 20 | **Personal Dashboard Claims** | `GET /api/me/claims` (auth) | Authenticated user token | HTTP 200; returns strictly claims submitted by the user. | PASSED |
| 21 | **Ownership Tampering (Edit)** | `PATCH /api/items/:id` (auth) | User B attempts to edit User A's item | HTTP 403 Forbidden. | PASSED |
| 22 | **Ownership Tampering (Delete)** | `DELETE /api/items/:id` (auth) | User B attempts to delete User A's item | HTTP 403 Forbidden. | PASSED |
| 23 | **Owner Report Update** | `PATCH /api/items/:id` (auth) | Owner updates title / location | HTTP 200 OK; changes saved. | PASSED |
| 24 | **Owner Status Tamper Prevention** | `PATCH /api/items/:id` (auth) | Regular user passes `status: "Resolved"` | HTTP 403 Forbidden (Only moderators can update status). | PASSED |
| 25 | **Moderator Status Update** | `PATCH /api/items/:id` (mod) | Moderator updates status to "Resolved" | HTTP 200 OK; status updated to "Resolved". | PASSED |
| 26 | **Moderator Remove Listing** | `PATCH /api/items/:id` (mod) | Moderator updates status to "Removed" | HTTP 200 OK; status updated to "Removed". | PASSED |
| 27 | **Public Browse Excludes Removed** | `GET /api/items` | None | HTTP 200; removed items are omitted from results. | PASSED |
| 28 | **Moderator View All (incl. Removed)** | `GET /api/items?includeRemoved=true` | Moderator listing | HTTP 200; includes Removed items for administrative review. | PASSED |
| 29 | **Owner Item Deletion** | `DELETE /api/items/:id` (auth) | Owner deletes their item | HTTP 204 No Content; item removed from DB. | PASSED |
| 30 | **Frontend Responsive Layout** | Desktop, Tablet, Mobile viewport | Viewport widths 390px, 768px, 1440px | Hamburger navigation, responsive grid collapse, accessible forms. | PASSED |
