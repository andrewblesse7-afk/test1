# DormFlow — Student Residence Management Portal

DormFlow is a web application for a student residence. Students can report
maintenance problems in their rooms and book shared facilities such as the
laundry or the study room. Administrators process the requests, manage the
facilities and publish announcements.

The project is a student assignment. It is not prepared for production use.

## Main features

- Landing page that explains what the portal does.
- Registration and login with a password that is stored only as a hash.
- Students submit maintenance requests through a form and follow their status.
- Administrators move a request through its life cycle. The server checks every
  status change against a table of allowed transitions.
- Every status change is written to a history that is never edited or deleted.
- Students book a facility for a time slot. Overlapping bookings are rejected,
  both by a check in the code and by a unique index in the database.
- A booking can be cancelled, which frees the slot again.
- Activity page with the student's own requests, upcoming bookings, past
  bookings and the latest status changes.
- Admin dashboard with counters, a table of requests and filters by status,
  by category and a text search.
- Announcements written by administrators and read by everyone.

## Technologies

| Part | Technology |
|---|---|
| Front-end | HTML, CSS, plain JavaScript with `fetch` (no framework) |
| Back-end | Node.js 20, Express 5 |
| Database | MongoDB with Mongoose 9 |
| Authentication | JSON Web Tokens (`jsonwebtoken`), password hashing with `bcrypt` |
| Configuration | `dotenv` |
| Deployment | Dockerfile |

## Installation

You need Node.js 20 or newer and a running MongoDB.

```bash
git clone <repository-url>
cd dormflow
npm install
```

Copy the example configuration and fill in your own values:

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

## Environment variables

`.env` is never committed. `.env.example` shows which variables are needed.

| Variable | Meaning | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://localhost:27017/dormflow` |
| `JWT_SECRET` | Secret used to sign tokens | any long random string |

## Run commands

```bash
npm start     # start the server
npm run dev   # start with automatic restart while editing
npm run seed  # fill the database with demo data
```

The application is then available at `http://localhost:3000`.

**Warning:** `npm run seed` **deletes everything** in the database before it
writes the demo data. Only run it on a database you do not need.

## Test accounts

These accounts are created by `npm run seed`. All of them use the password
`password123`.

| Email | Role | Room |
|---|---|---|
| `admin@dormflow.test` | admin | — |
| `anna@dormflow.test` | student | 204 |
| `bob@dormflow.test` | student | 112 |
| `clara@dormflow.test` | student | 305 |

## User roles

**Student**
- Sees and edits only their own requests and bookings.
- Can cancel an own request while it is still `Submitted`.
- Reads facilities and announcements.

**Administrator**
- Sees all requests and bookings.
- Changes request statuses and writes comments.
- Creates, edits and deletes facilities and announcements.
- Sees the admin dashboard.

The limits are applied in the database queries inside the controllers, not by
hiding elements on the page. A student cannot read another student's data even
by calling the API directly.

## API overview

All routes except registration and login need the header
`Authorization: Bearer <token>`.

### Authentication

| Method | URL | Access |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any logged in user |

### Maintenance requests

| Method | URL | Access |
|---|---|---|
| GET | `/api/requests` | student: own, admin: all |
| POST | `/api/requests` | student |
| GET | `/api/requests/:id` | owner or admin |
| PATCH | `/api/requests/:id` | owner or admin (never changes the status) |
| DELETE | `/api/requests/:id` | owner or admin |
| PATCH | `/api/requests/:id/status` | admin; a student may only cancel an own request |

Filters for the list: `?status=&category=&priority=&roomNumber=&q=&page=&limit=`
The `q` parameter searches in the description and in the room number.

### Facilities

| Method | URL | Access |
|---|---|---|
| GET | `/api/facilities` | any logged in user |
| GET | `/api/facilities/:id` | any logged in user |
| POST | `/api/facilities` | admin |
| PATCH | `/api/facilities/:id` | admin |
| DELETE | `/api/facilities/:id` | admin |

### Bookings

| Method | URL | Access |
|---|---|---|
| GET | `/api/bookings` | student: own, admin: all |
| POST | `/api/bookings` | student |
| GET | `/api/bookings/:id` | owner or admin |
| DELETE | `/api/bookings/:id` | owner or admin (cancels, keeps the record) |

### Announcements

| Method | URL | Access |
|---|---|---|
| GET | `/api/announcements` | any logged in user |
| GET | `/api/announcements/:id` | any logged in user |
| POST | `/api/announcements` | admin |
| PATCH | `/api/announcements/:id` | admin |
| DELETE | `/api/announcements/:id` | admin |

### Status codes used

`200` success, `201` created, `400` invalid data, `401` no or invalid token,
`403` logged in but not allowed, `404` not found, `409` conflict (invalid status
transition, slot already booked, email already registered).

### Request status workflow

```
Submitted   → Reviewed, Rejected, Cancelled
Reviewed    → In Progress, Rejected
In Progress → Completed
Completed   → (final)
Rejected    → (final)
Cancelled   → (final)
```

The server checks the transition against this table. A transition that is not
in the table is answered with `409` and the request keeps its old status.

## Screenshots

Screenshots are stored in `docs/screenshots/`.

| File | Page |
|---|---|
| `landing.png` | Landing page |
| `requests.png` | Maintenance requests with the form and the list |
| `bookings.png` | Facilities and the booking form |
| `activity.png` | Student activity page |
| `admin.png` | Admin dashboard with counters and filters |
| `mobile.png` | Landing page on a narrow screen |

## Repository structure

```
dormflow/
├── controllers/     logic for each part of the API
│   ├── announcementController.js
│   ├── authController.js
│   ├── bookingController.js
│   ├── facilityController.js
│   └── requestController.js
├── middleware/
│   ├── auth.js            checks the token, loads the user
│   ├── errorHandler.js    turns errors into proper status codes
│   └── requireAdmin.js    allows administrators only
├── models/          Mongoose schemas
│   ├── Announcement.js
│   ├── Booking.js
│   ├── Facility.js
│   ├── MaintenanceRequest.js
│   └── User.js
├── routes/          URL to controller function
├── public/          pages served to the browser
│   ├── css/style.css
│   ├── js/          one script per page, plus auth.js
│   └── *.html
├── docs/            assignment and development plan
├── server.js        entry point
├── seed.js          demo data
├── Dockerfile
└── .env.example
```

## Docker

```bash
docker build -t dormflow .
docker run -p 3000:3000 --env-file .env dormflow
```

If MongoDB runs on the host machine, the container cannot reach it through
`localhost`, because inside a container `localhost` is the container itself.
Use `mongodb://host.docker.internal:27017/dormflow` in the `.env` file instead.

## Known limitations

- The project is a study assignment and is not prepared for production use.
- The Docker image has not been built and started yet, because the environment
  used during development could not download base images. The Dockerfile itself
  follows the standard steps and the application was verified to run with
  production dependencies only.
- There are no automated tests. The API was checked with manual requests.
- A token stays valid for seven days and cannot be revoked before it expires.
- Facilities have a `pricePerSlot` field, but no payment is implemented, so
  every booking is free.
- The list of requests is not paginated in the interface, although the API
  supports `page` and `limit`.
- Uploading a photo of the problem is not supported.

## Possible improvements

- Mock payment for facilities that have a price.
- Photo upload for maintenance requests.
- Automated API tests.
- Email notification when the status of a request changes.
- Pagination controls in the admin dashboard.
