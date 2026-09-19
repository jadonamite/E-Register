# E-Register

Attendance and membership tracking for a church, replacing the paper register.

Two interfaces sit on the same data. `/pfcc` is the attendance list someone marks during a service. `/exec` is the analytics view for leadership: headcount, first timers, who has stopped showing up, how the cells compare.

## What it does that a paper register cannot

**Marking attendance for a past date.** The `useMembers` hook takes a `selectedDate` rather than assuming today. Pick last Sunday and the signed-in list recalculates against that date's records; marking someone present then writes the record with that date, not the current one. Registers get filled in late, so the app has to let you.

**Flagging people before they drift.** A member is at risk once they have attendance history and their most recent record is more than 14 days old. Two conditions, both necessary. Someone who has never attended is not drifting, they are new.

**First timers.** Anyone whose profile was created in the last 30 days, computed at read time rather than stored, so it never goes stale.

## Stack

Next.js 14 on the App Router, TypeScript, Tailwind, Framer Motion, Phosphor icons. The API is Next.js route handlers returning JSON. Data lives in MongoDB Atlas through Mongoose.

## Data model

One collection, `members`, with attendance kept as a subdocument array rather than its own collection. Reads are almost always "this member and their history", so keeping them together avoids a join on the hot path.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | |
| `phone` | String | Unique. This is what stops duplicate profiles. |
| `cell` | String | Fellowship cell, for example "Marvelous" |
| `attendance` | Array | Every attendance record for this member |
| `createdAt` | Date | Drives first-timer status |

Each attendance entry:

```typescript
{
  date: Date,          // 2026-02-08
  serviceType: String, // "Sunday" or "Mid-Week"
  status: String       // "Present"
}
```

## API

`GET /api/members` returns everyone, sorted alphabetically.

`POST /api/members` creates one. Body: `{ name, phone, cell, churchDept, schoolDept, level }`.

`POST /api/attendance` marks present. Body: `{ memberId, serviceType, date }`. Marking the same member twice for one day and service is rejected rather than duplicated.

`DELETE /api/attendance` undoes that, with the same body.

`GET /api/analytics` computes the dashboard in one pass: total members, first timers in the last 30 days, the at-risk list, cell distribution, attendance trend.

## Running it

```bash
git clone https://github.com/jadonamite/E-Register
cd E-Register
npm install
```

Create `.env`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
```

```bash
npm run dev
```

Then `http://localhost:3000`.

## Not done yet

**There is no authentication.** `/pfcc` and `/exec` are both public, which means anyone with the URL can read the membership list and the analytics. That is fine on localhost and not fine deployed. NextAuth is the intended fix and it is the first thing to do before this handles real congregation data.

The Export Data button on the dashboard does nothing yet; it needs a PDF library wired in.

Two things worth building after that: a cell leader view scoped to that leader's own members, and making Contact on the at-risk list actually open WhatsApp or fire an SMS rather than sitting there.

## Structure

```
src/
├── app/
│   ├── (dash)/
│   │   ├── pfcc/        attendance marking
│   │   └── exec/        analytics
│   └── api/
│       ├── members/
│       ├── attendance/
│       └── analytics/
├── components/
│   ├── exec/            charts and dashboard grids
│   ├── MemberList.tsx
│   └── AddMemberModal.tsx
├── hooks/
│   └── use-members.ts   data fetching and state
├── lib/
│   └── db.ts            connection singleton
└── models/
    └── Member.ts
```

MIT licensed.
