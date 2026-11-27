# BookLoop REST API Documentation

This document provides a comprehensive specification of all backend REST API endpoints available in the **BookLoop College Library Management System** (`server`).

- **Base URL**: `http://localhost:5000` (or `https://<your-server-domain>`)
- **API Prefix**: `/api`
- **Data Format**: `application/json`
- **Authentication**: JWT Bearer token via `Authorization: Bearer <token>` or active Neon Managed Better Auth session.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [System Health](#2-system-health)
3. [User & Student Profile Endpoints](#3-user--student-profile-endpoints)
4. [Book Catalog & Inventory Endpoints](#4-book-catalog--inventory-endpoints)
5. [Borrow Requests & Circulation Desk](#5-borrow-requests--circulation-desk)
6. [Active Loans & Returns Workflow](#6-active-loans--returns-workflow)
7. [Book Donations & Impact Score System](#7-book-donations--impact-score-system)
8. [Waiting Queue Priority Engine](#8-waiting-queue-priority-engine)

---

## 1. Authentication & Authorization

Endpoints use Role-Based Access Control (RBAC):
- **Public**: No authentication required.
- **Authenticated**: Requires a valid user session or Bearer token.
- **Student**: Actions restricted to verified student accounts (`STUDENT` role).
- **Librarian**: Administrative library actions restricted to the Library Authority (`LIBRARIAN` role).

Headers for protected endpoints:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 2. System Health

### `GET /api/health`
Checks the operational status of the server and connectivity to NeonDB PostgreSQL.

- **Access**: Public
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "database": "NeonDB PostgreSQL (Connected)",
  "timestamp": "2026-11-27T16:00:00.000Z"
}
```

---

## 3. User & Student Profile Endpoints

### `POST /api/auth/register`
Enrolls a new student into the college library system. Automatically assigns the **`STUDENT`** role and creates an initial student profile with 0 Impact Points.

- **Access**: Public
- **Request Body**:
```json
{
  "fullName": "Maya Patel",
  "email": "maya.patel@college.edu",
  "password": "securePassword123",
  "studentId": "CS-2024-055",
  "department": "Computer Science & Engineering",
  "academicYear": "2nd Year",
  "semester": "3rd Semester",
  "collegeAffiliation": "School of Engineering & Technology",
  "neonUserId": "645c7b33-0411-499a-9f6a-2e5c41ba1543" // Optional Neon Auth UUID
}
```
- **Response**: `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "645c7b33-0411-499a-9f6a-2e5c41ba1543",
    "name": "Maya Patel",
    "email": "maya.patel@college.edu",
    "role": "STUDENT",
    "isProfileComplete": true
  },
  "profile": {
    "id": "prof-uuid",
    "userId": "645c7b33-0411-499a-9f6a-2e5c41ba1543",
    "studentId": "CS-2024-055",
    "department": "Computer Science & Engineering",
    "academicYear": "2nd Year",
    "semester": "3rd Semester",
    "collegeAffiliation": "School of Engineering & Technology",
    "impactScore": 0,
    "totalDonations": 0,
    "activeBorrowingsCount": 0
  }
}
```

---

### `POST /api/auth/login`
Authenticates an existing user and returns their verified server role (`STUDENT` or `LIBRARIAN`).

- **Access**: Public
- **Request Body**:
```json
{
  "email": "student@college.edu",
  "password": "password123"
}
```
- **Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "user-uuid",
    "name": "Maya Patel",
    "email": "maya.patel@college.edu",
    "role": "STUDENT",
    "isProfileComplete": true
  },
  "profile": { ... }
}
```

---

### `POST /api/auth/sync`
Synchronizes identity information from Neon Managed Better Auth with the application database.

- **Access**: Public / Internal
- **Request Body**:
```json
{
  "email": "alex.rivera@college.edu",
  "name": "Alex Rivera",
  "neonUserId": "user-uuid"
}
```
- **Response**: `200 OK` (User and profile object with JWT token).

---

### `GET /api/auth/me`
Fetches the currently authenticated user's session, profile details, and role.

- **Access**: Authenticated
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "user": {
    "id": "user-uuid",
    "name": "Alex Rivera",
    "email": "alex.rivera@college.edu",
    "role": "STUDENT",
    "isProfileComplete": true
  },
  "profile": { ... }
}
```

---

### `PUT /api/auth/profile/:id`
Updates academic profile information for a student.

- **Access**: Authenticated (Owner student)
- **Request Body**:
```json
{
  "studentId": "CS-2024-055",
  "department": "Computer Science & Engineering",
  "academicYear": "3rd Year",
  "semester": "5th Semester",
  "collegeAffiliation": "Main Campus"
}
```
- **Response**: `200 OK` (Updated StudentProfile record).

---

## 4. Book Catalog & Inventory Endpoints

### `GET /api/books`
Returns the library catalog with physical copy counts and real-time availability.

- **Access**: Public
- **Query Parameters**:
  - `search` (optional): Filter by title, author, category, or ISBN.
  - `category` (optional): Filter by book subject (e.g. `Computer Science`).
  - `status` (optional): `AVAILABLE`, `UNAVAILABLE`, `LOW_STOCK`.
  - `source` (optional): `LIBRARY` or `DONATION`.
- **Response**: `200 OK`
```json
[
  {
    "id": "book-1",
    "title": "Introduction to Algorithms (4th Edition)",
    "author": "Thomas H. Cormen et al.",
    "isbn": "978-0262046305",
    "category": "Computer Science",
    "description": "Comprehensive textbook on algorithms...",
    "totalCopies": 4,
    "availableCopies": 2,
    "source": "LIBRARY",
    "status": "AVAILABLE",
    "copies": [
      {
        "id": "copy-1-1",
        "copyNumber": "CL-CS-001A",
        "status": "AVAILABLE",
        "condition": "EXCELLENT"
      }
    ]
  }
]
```

---

### `GET /api/books/:id`
Fetches detailed information for a specific book title.

- **Access**: Public
- **Response**: `200 OK` (Book record).

---

### `GET /api/books/:id/copies`
Lists individual physical copies, physical barcodes (`copyNumber`), status, and physical wear condition.

- **Access**: Public / Authenticated
- **Response**: `200 OK` (Array of `BookCopy` records).

---

### `POST /api/books`
Adds a new book title to inventory and generates physical barcode copy records.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "title": "Artificial Intelligence: A Modern Approach",
  "author": "Stuart Russell, Peter Norvig",
  "isbn": "978-0134610992",
  "category": "Computer Science",
  "description": "Standard university AI textbook.",
  "totalCopies": 3,
  "coverImage": "https://example.com/cover.jpg",
  "source": "LIBRARY"
}
```
- **Response**: `201 Created`

---

## 5. Borrow Requests & Circulation Desk

### `GET /api/borrow/requests`
Retrieves borrowing requests. Librarians see all requests; students can filter by their ID.

- **Access**: Authenticated
- **Query Parameters**:
  - `studentId` (optional): Filter requests by student user ID.
  - `status` (optional): `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`.
- **Response**: `200 OK`
```json
[
  {
    "id": "req-1",
    "studentId": "user-stu-1",
    "studentName": "Alex Rivera",
    "bookId": "book-1",
    "bookTitle": "Introduction to Algorithms",
    "status": "ACCEPTED",
    "pickupWindowHours": 48,
    "pickupDeadline": "2026-11-29T16:00:00.000Z",
    "impactScoreAtRequest": 24
  }
]
```

---

### `POST /api/borrow/requests`
Submits a book borrow request for an in-stock title.

- **Access**: **Student Only** (`STUDENT` role)
- **Request Body**:
```json
{
  "bookId": "book-1",
  "studentId": "user-stu-1"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Borrowing request submitted to librarian!",
  "request": { "id": "req-new", "status": "PENDING" }
}
```

---

### `POST /api/borrow/requests/:id/accept`
Approves a pending borrow request, sets a reservation pickup window, and reserves an available physical copy.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Request Body**:
```json
{
  "pickupWindowHours": 48,
  "notes": "Reserved at Front Desk Counter A"
}
```
- **Response**: `200 OK`
```json
{
  "success": true
}
```

---

### `POST /api/borrow/requests/:id/reject`
Rejects a borrow request with explanatory notes.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Request Body**:
```json
{
  "notes": "Student currently has reached maximum active borrowing quota."
}
```
- **Response**: `200 OK`

---

### `POST /api/borrow/requests/:id/cancel`
Allows a student to cancel their own pending or accepted borrow request. Automatically frees any reserved copy.

- **Access**: Authenticated (Student owner)
- **Request Body**:
```json
{
  "studentId": "user-stu-1"
}
```
- **Response**: `200 OK`

---

### `POST /api/borrow/requests/:id/issue`
Marks the physical book handed over to the student, transitioning the request to `COMPLETED` and creating an active loan transaction.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Request Body**:
```json
{
  "borrowDurationDays": 14
}
```
- **Response**: `200 OK`

---

## 6. Active Loans & Returns Workflow

### `GET /api/borrow/transactions`
Retrieves loan records and overdue statuses.

- **Access**: Authenticated
- **Query Parameters**:
  - `studentId` (optional): Filter loans by student ID.
  - `status` (optional): `ISSUED`, `RETURNED`, `OVERDUE`.
- **Response**: `200 OK`
```json
[
  {
    "id": "trans-1",
    "requestId": "req-1",
    "studentId": "user-stu-1",
    "studentName": "Alex Rivera",
    "bookTitle": "Introduction to Algorithms",
    "copyNumber": "CL-CS-001D",
    "issueDate": "2026-11-20T10:00:00.000Z",
    "expectedReturnDate": "2026-12-04T10:00:00.000Z",
    "status": "ISSUED"
  }
]
```

---

### `POST /api/borrow/transactions/:id/return`
Processes the physical return of a book:
1. Marks transaction as `RETURNED` and copies as `AVAILABLE`.
2. Automatically triggers the **Waiting Queue Evaluation Engine**:
   - Finds the highest priority student in the queue.
   - Auto-allocates the freed copy to `#1 priority` student with a 24h pickup reservation.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Response**: `200 OK`
```json
{
  "success": true
}
```

---

## 7. Book Donations & Impact Score System

### `GET /api/donations`
Lists student donation submissions.

- **Access**: Authenticated
- **Query Parameters**:
  - `studentId` (optional): Filter by student.
  - `status` (optional): `PENDING`, `APPROVED`, `REJECTED`.
- **Response**: `200 OK`
```json
[
  {
    "id": "don-1",
    "studentId": "user-stu-1",
    "studentName": "Alex Rivera",
    "title": "Design Patterns",
    "author": "Erich Gamma et al.",
    "condition": "EXCELLENT",
    "status": "APPROVED",
    "pointsAwarded": 10
  }
]
```

---

### `POST /api/donations`
Submits a book for library donation with book condition statements and photograph previews.

- **Access**: **Student Only** (`STUDENT` role)
- **Request Body**:
```json
{
  "studentId": "user-stu-1",
  "title": "Deep Learning with Python",
  "author": "François Chollet",
  "isbn": "978-1617294433",
  "category": "Computer Science",
  "description": "Great book with code examples for Keras.",
  "condition": "EXCELLENT",
  "images": ["https://images.unsplash.com/photo-1544947950-fa07a98d237f"]
}
```
- **Response**: `201 Created`

---

### `POST /api/donations/:id/approve`
Approves a student donation through an atomic transaction:
1. Marks donation as `APPROVED`.
2. Awards Impact Points based on verified condition:
   - **EXCELLENT**: `+10 points`
   - **GOOD**: `+7 points`
   - **ACCEPTABLE**: `+4 points`
3. Increments student's `impactScore` and `totalDonations`.
4. Creates new catalog entry with source `DONATION` and donor attribution.
5. Records immutable audit entry in `impact_score_transactions`.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Request Body**:
```json
{
  "verifiedCondition": "EXCELLENT",
  "notes": "Verified in mint physical condition.",
  "targetCategory": "Computer Science"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "pointsAwarded": 10
}
```

---

### `POST /api/donations/:id/reject`
Rejects a book donation that does not meet library condition guidelines.

- **Access**: **Librarian Only** (`LIBRARIAN` role required)
- **Request Body**:
```json
{
  "notes": "Excessive water damage to binding."
}
```
- **Response**: `200 OK`

---

## 8. Waiting Queue Priority Engine

When copies of a book are unavailable, students enter the waiting queue. The queue sorts dynamically using a **two-tier sorting rule**:
$$\text{Priority Rank} = \operatorname{sort}\Big(\text{Impact Score } \downarrow, \; \text{Request Timestamp } \uparrow\Big)$$

### `GET /api/queue`
Retrieves queue entries across books or for a specific book.

- **Access**: Authenticated
- **Query Parameters**:
  - `bookId` (optional): Filter queue for a specific book.
  - `studentId` (optional): Filter queue entries for a student.
- **Response**: `200 OK`
```json
[
  {
    "id": "q-1",
    "studentId": "user-stu-1",
    "studentName": "Alex Rivera",
    "bookId": "book-2",
    "bookTitle": "Operating System Concepts",
    "queuePosition": 1,
    "impactScoreSnapshot": 24,
    "requestTimestamp": "2026-11-26T22:50:00.000Z",
    "status": "WAITING"
  }
]
```

---

### `POST /api/queue`
Enters a student into the waiting queue for an out-of-stock book.

- **Access**: **Student Only** (`STUDENT` role)
- **Request Body**:
```json
{
  "bookId": "book-2",
  "studentId": "user-stu-1"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "position": 1,
  "message": "Joined queue at Priority #1 (Impact Score: 24)"
}
```

---

### `DELETE /api/queue/:id`
Leaves the waiting queue for a book.

- **Access**: Authenticated (Student owner)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Removed from waiting queue"
}
```

---

## 9. Error Codes & Format

When an error occurs, responses return standard HTTP error codes:

| Status Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Invalid input parameters | Missing required fields, copies already available, duplicate queue entry. |
| **`401 Unauthorized`** | Authentication required | Missing or invalid Bearer token. |
| **`403 Forbidden`** | Insufficient permissions | A student attempting to execute librarian endpoints (`requireRole(['LIBRARIAN'])`). |
| **`404 Not Found`** | Resource not found | Book, request, or transaction ID does not exist. |
| **`500 Server Error`** | Internal server error | Database connectivity issue or transaction failure. |

**Standard Error Response Body**:
```json
{
  "error": "Forbidden: Access restricted to LIBRARIAN role."
}
```
