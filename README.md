# BookLoop - College Library Management System

A modern, professional, and responsive web application engineered for college library operations, book borrowing, student book donations, copy-level inventory tracking, and an automated waiting queue driven by donation-based Impact Scores.

---

## 1. Project Overview & Architecture

BookLoop is architected as a clean TypeScript monorepo with strict role-based separation:

```
bookloop/
│
├── apps/
│   ├── web/                         # React 18, Vite, Tailwind CSS, Lucide icons, React Hook Form, Zod
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/          # DashboardLayout, collapsible navigation, dark/light switcher
│   │   │   │   └── ui/              # shadcn-inspired minimal UI primitives (Button, Card, Dialog, Table, Tabs, Badge)
│   │   │   ├── context/             # AuthContext (role management & Google OAuth simulation), ThemeContext
│   │   │   ├── pages/
│   │   │   │   ├── auth/            # Login, Student Registration with college verification
│   │   │   │   ├── student/         # Student Dashboard, Book Catalog, Details, Borrowings, Queue, Donations
│   │   │   │   ├── librarian/       # Librarian Dashboard, Borrow Requests, Returns, Inventory, Students, Queue
│   │   │   │   └── shared/          # Account profile & credentials
│   │   │   ├── services/            # Abstracted LibraryService & API client
│   │   │   └── routes/              # ProtectedRoute with strict role guards
│   │   └── package.json
│   │
│   └── api/                         # Node.js, Express.js, TypeScript REST API
│       ├── src/
│       │   ├── middleware/          # JWT authentication & role-based access control (RBAC)
│       │   ├── server.ts            # REST endpoints, copy-level isolation, queue priority engine
│       │   └── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                      # Shared domain models, TypeScript interfaces, and Zod validators
│       ├── src/
│       │   ├── types/               # User, Book, BookCopy, BorrowRequest, DonationRequest, QueueEntry
│       │   ├── validators/          # Registration, Book, Donation Zod validation schemas
│       │   └── data/                # Initial seed data for development
│       └── package.json
│
├── prisma/
│   └── schema.prisma                # Relational PostgreSQL / NeonDB schema with queue composite indexes
│
├── .env.example                     # Environment variables template
├── package.json                     # Monorepo workspace orchestrator
└── README.md
```

---

## 2. User Roles & Capabilities

### A. Student Role
- **College Registration**: Collects full name, college email, Student ID / Roll Number, Department/Branch, Academic Year, Semester, and College Affiliation.
- **Book Discovery**: Browse and search library collection by title, author, category, or real-time copy availability.
- **Book Borrowing**: Request borrowing for in-stock books. View assigned physical copy number and pickup collection deadlines.
- **Waiting Queue**: When all copies of a book are issued, join the waiting queue. View real-time rank and the mathematical reason for priority.
- **Book Donation & Impact Score**:
  - Submit book donations with title, author, condition notes, and photograph preview.
  - Earn Impact Points upon librarian inspection and approval:
    - **Excellent condition:** `+10 points`
    - **Good condition:** `+7 points`
    - **Acceptable condition:** `+4 points`
  - Approved books are automatically cataloged as `DONATION` source.
- **Possession & Returns**: Track currently borrowed physical copies and return due dates.

### B. Library Authority / Librarian Role
- **Circulation Desk Management**:
  - Review pending borrowing requests.
  - Approve requests and set custom pickup reservation windows (e.g., 24h, 48h, 72h).
  - Mark physical collection as `ISSUED` when student picks up the book.
- **Returns & Re-allocation**:
  - Track on-loan books and return deadlines.
  - Mark returned copies as `AVAILABLE`.
  - Automatically evaluate waiting queues to offer newly freed copies to the `#1 priority` student.
- **Donation Inspection**:
  - Inspect student-uploaded photographs and condition statements.
  - Approve donations (awarding Impact Points to the student and adding the book into library inventory).
  - Reject donations that fail condition standards with explanatory notes.
- **Inventory Management**:
  - Add new book titles and manage physical copy barcodes/numbers.
  - Distinguish between existing library acquisitions and student-donated titles.
- **Registered Students Directory**:
  - Search and filter students by name, roll number, and department.
  - Inspect students' verified college details and cumulative donation Impact Scores.
- **System-Wide Queue Oversight**:
  - View waiting queues across unavailable books with live priority ranks.

---

## 3. Waiting Queue Priority Formula

The waiting queue balances merit-based contribution with fairness using a strict **2-tier backend sorting formula**:

$$\text{Priority Rank} = \operatorname{sort}\Big(\text{Impact Score } \downarrow, \; \text{Request Timestamp } \uparrow\Big)$$

1. **Primary Sort (Impact Score Descending)**: Students with higher donation-based Impact Scores receive priority for high-demand course literature.
2. **Secondary Sort (Request Timestamp Ascending / FCFS)**: When two students have the same Impact Score, First-Come-First-Serve determines position.
3. **Inclusivity**: Students with zero Impact Score are fully eligible and served fairly by arrival order.

---

## 4. Database Schema (NeonDB / Serverless PostgreSQL)

Defined in [`prisma/schema.prisma`](file:///c:/Users/ACER/OneDrive/Desktop/bookloop/prisma/schema.prisma):
- **`User`**: Authentication credentials, user role (`STUDENT` | `LIBRARIAN`), profile completion flag.
- **`StudentProfile`**: College affiliation, department, year, semester, student roll number, and accumulated `impactScore`.
- **`Book`**: Catalog metadata (title, author, ISBN, category, source: `LIBRARY` | `DONATION`, total vs available copies).
- **`BookCopy`**: Individual physical copies with unique copy numbers / barcodes (e.g., `CL-CS-001A`), physical condition, and copy status (`AVAILABLE` | `RESERVED` | `ISSUED`).
- **`BorrowRequest`**: Student requests, status tracking (`PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `COMPLETED`), pickup deadlines.
- **`BorrowTransaction`**: Active loans with issue date, expected return date, actual return date, and reference to the exact physical `BookCopy`.
- **`DonationRequest`**: Student donation submissions, photograph URLs, condition claimed, librarian verification notes, and points awarded.
- **`QueueEntry`**: Waiting queue entries with composite index on `[bookId, status, impactScoreSnapshot DESC, requestTimestamp ASC]`.
- **`ImpactScoreTransaction`**: Immutable ledger recording points awarded from approved donations.

---

## 5. Getting Started & Running Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the repository root
cd bookloop

# Install workspace dependencies
npm install
```

### Build the Monorepo
```bash
# Builds shared types, frontend web, and backend api
npm run build
```

### Run the Development Servers
```bash
# Start Vite frontend (port 5173)
npm run dev:web

# In a separate terminal, start Express API server (port 5000)
npm run dev:api
```

---

## 6. Evaluation & Demo Credentials

For quick evaluation, the application includes a quick role switcher in the sidebar as well as one-click login buttons on the login screen:

- **Student Demo**: `alex.rivera@college.edu` (Alex Rivera, 3rd Year CSE, Impact Score: 24 pts)
- **Librarian Demo**: `librarian@college.edu` (Dr. Sarah Jenkins, Head Librarian)
- **Email & Password**: Any email or password (`password123`) can be entered.
- **Google OAuth**: One-click Google login simulation pre-wired.
- **Light & Dark Mode**: One-click persistent theme toggle in the header and sidebar navigation.
