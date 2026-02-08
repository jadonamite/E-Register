Here is a comprehensive **Project Takeover Document** for the **E-Register** system. You can save this as `README.md` in your repository or hand it over as a formal PDF/Notion document to any new developer or stakeholder.

---

# 📘 Project Takeover: E-Register System

**Version:** 1.0.0
**Status:** Production-Ready Beta
**Last Updated:** February 2026

---

## 1. Executive Summary

**E-Register** is a modern, full-stack church management application designed to track membership databases, monitor real-time attendance, and provide high-level executive analytics for church leadership.

The system replaces manual paper registers with a digital, mobile-responsive dashboard that supports "Time Travel" (editing past records) and "Retention Tracking" (identifying members at risk of leaving).

---

## 2. Technical Stack

### **Frontend**

* **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion
* **Icons:** Phosphor Icons (React)
* **UI Architecture:** Bento Grid / Masonry Layouts

### **Backend**

* **Runtime:** Node.js (via Next.js API Routes)
* **Database:** MongoDB (Atlas Cloud)
* **ORM:** Mongoose
* **API Architecture:** RESTful JSON endpoints

---

## 3. Architecture Overview

### **Folder Structure**

```bash
src/
├── app/
│   ├── (dash)/          # Dashboard Layouts
│   │   ├── pfcc/        # The "Attendance Marking" Interface
│   │   └── exec/        # The "Executive Analytics" Interface
│   ├── api/             # Backend Routes
│   │   ├── members/     # CRUD for Members
│   │   ├── attendance/  # Attendance Logging (POST/DELETE)
│   │   └── analytics/   # Executive Data Aggregation
├── components/
│   ├── exec/            # Modular Dashboard Components (Charts, Grids)
│   ├── MemberList.tsx   # The main attendance list UI
│   └── AddMemberModal.tsx
├── hooks/
│   └── use-members.ts   # Custom hook handling all data logic & state
├── lib/
│   └── db.ts            # Singleton MongoDB Connection
└── models/
    └── Member.ts        # Mongoose Schema definition

```

---

## 4. Database Schema

The database consists of a single primary collection: `members`.

**Model: `Member**`
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated unique ID. |
| `name` | String | Full Name. |
| `phone` | String | Unique Identifier (Prevent duplicates). |
| `cell` | String | The fellowship cell (e.g., "Marvelous"). |
| `attendance` | Array | A history log of all attendances. |
| `createdAt` | Date | Used to calculate "First Timer" status. |

**Attendance Sub-Document Structure:**

```typescript
{
  date: Date,          // e.g., 2026-02-08
  serviceType: String, // "Sunday" or "Mid-Week"
  status: String       // "Present"
}

```

---

## 5. API Documentation

### **1. Member Management**

* **`GET /api/members`**: Fetches all members sorted alphabetically.
* **`POST /api/members`**: Creates a new member.
* *Payload:* `{ name, phone, cell, churchDept, schoolDept, level }`



### **2. Attendance Logic**

* **`POST /api/attendance`**: Marks a member as **Present**.
* *Payload:* `{ memberId, serviceType, date }`
* *Logic:* Prevents duplicates for the same day/service.


* **`DELETE /api/attendance`**: Marks a member as **Absent** (Undo).
* *Payload:* `{ memberId, serviceType, date }`



### **3. Analytics Engine**

* **`GET /api/analytics`**: Computes all KPIs for the Executive Dashboard.
* *Returns:* Total count, First Timers (last 30 days), Retention Risk list (absent 2+ weeks), Cell Distribution stats, and Attendance Trends.



---

## 6. Key Features & Logic

### **A. Time Travel (Date Picker)**

The application does not just assume "Today." The `useMembers` hook accepts a `selectedDate`.

* If the Admin selects *Last Sunday*, the UI re-calculates the `signedInIds` based on attendance records matching that specific past date.
* Marking attendance while in "Past Mode" saves the record with that past date.

### **B. Retention Risk Algorithm**

The system automatically flags members as "At Risk" if:

1. They have attendance records in the past.
2. Their *most recent* attendance date is older than **14 days**.

### **C. First Timer Logic**

"New Members" are calculated dynamically by comparing the `createdAt` timestamp of the member profile against the current date (Window: 30 Days).

---

## 7. Installation & Setup

1. **Clone the Repository:**
```bash
git clone [repo-url]
cd e-register

```


2. **Install Dependencies:**
```bash
npm install

```


3. **Environment Configuration:**
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/?retryWrites=true&w=majority

```


4. **Run Development Server:**
```bash
npm run dev

```


Access the app at `http://localhost:3000`.

---

## 8. Known Issues & Roadmap

### **Immediate To-Dos**

* **Authentication:** Currently, all routes (`/pfcc`, `/exec`) are public. NextAuth.js should be implemented to secure the Executive Dashboard.
* **PDF Export:** The "Export Data" button on the dashboard is currently a placeholder. Needs a library like `jspdf` to generate reports.

### **Future Improvements**

* **Cell Leader View:** A restricted view where Cell Leaders can only see *their* members.
* **SMS Integration:** Clicking "Contact" on the Retention List should open WhatsApp or send an SMS API request.

---

**Handover Approved By:** Jadonamite (Lead Developer)
**Date:** February 7, 2026