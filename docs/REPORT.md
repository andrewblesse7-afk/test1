# DormFlow — Project Report

**Student residence management portal**

DormFlow is a web application for a student dormitory. Students report
maintenance problems in their rooms and book shared facilities such as the
laundry room. Administrators process the requests, manage the facilities and
publish announcements.

I chose this topic because it needs both kinds of workflow the assignment asks
for: a request that moves through several states, and a booking that must not
collide with another booking. Both rules have to be enforced on the server,
which made the project interesting to build.

---

## 1. Front-end structure, styling approach and key JavaScript

### Structure

The front-end is eight static HTML pages in the `public/` folder. Express
serves them with one line, `app.use(express.static("public"))`. Each page has
its own JavaScript file, plus one shared file:

| Page | Script | Purpose |
|---|---|---|
| `index.html` | — | landing page |
| `login.html` / `register.html` | `login.js` / `register.js` | authentication forms |
| `requests.html` | `requests.js` | submit and list maintenance requests |
| `bookings.html` | `bookings.js` | facilities, booking form, my bookings |
| `activity.html` | `activity.js` | requests, bookings and status history |
| `announcements.html` | `announcements.js` | announcements, admin form |
| `admin.html` | `admin.js` | dashboard with counters and filters |
| all pages | `auth.js` | token handling and navigation bar |

I did not use a front-end framework. The assignment asks for HTML, CSS and
JavaScript, and writing plain JavaScript meant I could explain every line of
the project.

### Styling approach

All styling is in one file, `public/css/style.css`. The colours are defined once
as CSS variables in `:root`, so the whole theme can be changed in one place.

The layout is mobile-first: the basic rules describe the narrow screen, and one
media query at `640px` improves the layout on wider screens. For example the
navigation bar is a vertical column by default and becomes a horizontal row
above that width. Cards, status badges and form styles are shared classes that
all pages reuse, which keeps the file small.

### Key JavaScript functionality

**Token handling (`auth.js`).** After login the token is stored in
`localStorage`, so it survives a page reload. The helper `authHeaders()` builds
the `Authorization: Bearer <token>` header that every protected request needs.
The function `showCurrentUser()` asks `/api/auth/me`, replaces the Login and
Register links with the user's name and a Logout link, and adds the Admin link
only when the role is `admin`.

**Page guard.** Each protected page starts with the same check: if there is no
token, the browser is sent to the login page. If a request answers `401`, the
token is removed and the user is sent to the login page as well.

**Rendering.** Lists are built with `document.createElement` and `textContent`
instead of `innerHTML`. This matters for safety: a student could type HTML tags
into a request description, and with `textContent` the text is always shown as
text and never executed.

**Dates in the booking form.** The form has separate date and time fields, but
the database stores real dates. The script joins them and converts the result:

```js
const startAt = new Date(`${date}T${bookingForm.startTime.value}`);
// ...
body: JSON.stringify({ startAt: startAt.toISOString(), ... })
```

The browser reads the typed value as local time and `toISOString()` sends it as
UTC, so the time is not shifted when the server stores it.

---

## 2. Database schema and data models

The project uses MongoDB with Mongoose. There are five models.

| Model | Main fields |
|---|---|
| `User` | `name`, `email` (unique), `passwordHash`, `roomNumber`, `role` |
| `MaintenanceRequest` | `resident` → User, `roomNumber`, `category`, `description`, `priority`, `status`, `adminComment`, `statusHistory[]` |
| `Facility` | `name`, `description`, `location`, `capacity`, `available`, `slotMinutes`, `pricePerSlot` |
| `Booking` | `userId` → User, `facilityId` → Facility, `startAt`, `endAt`, `status` |
| `Announcement` | `title`, `content`, `category`, `createdBy` → User |

All models use `{ timestamps: true }`, which adds `createdAt` and `updatedAt`
automatically. Fields with a fixed set of values, such as `status`, `category`
and `role`, use `enum`, so the database refuses a value that is not in the list.

### Design decisions

**The password is never stored.** Only the bcrypt hash is saved. The field is
declared with `select: false`, which means normal queries do not load it at all,
so it cannot end up in an API response by accident. The login controller asks
for it explicitly with `.select("+passwordHash")`.

**The owner is a reference, not a name.** `resident` and `userId` are
`ObjectId` references to `User`. In the first version `resident` was a plain
string with the student's name, but a name cannot be used to check ownership
reliably, so it was replaced once the user model existed.

**Status history is embedded in the request.** `statusHistory` is an array
inside the request document, not a separate collection. Each entry stores
`from`, `to`, `changedBy`, `comment` and `changedAt`. For a project of this size
an embedded array is simpler, because the history always travels with the
request and needs no extra query.

**Bookings store real dates.** `startAt` and `endAt` are `Date` fields. I did
not use separate text fields for the date and the time, because text is awkward
to compare and breaks across time zones. A booking in the past is found with
`endAt < now`, so no extra status is needed for it.

### Indexes

```js
// User.js — declared on the field itself
email: { type: String, required: true, unique: true, lowercase: true }

// MaintenanceRequest.js
maintenanceRequestSchema.index({ status: 1, createdAt: -1 });
maintenanceRequestSchema.index({ resident: 1, createdAt: -1 });

// Booking.js
bookingSchema.index({ userId: 1, startAt: -1 });
bookingSchema.index(
  { facilityId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: "Active" } }
);
```

Without an index MongoDB reads the whole collection; with one it goes straight
to the matching documents. In each index the filtered field comes first and the
sorted field second, so one index serves both the search and the ordering.

The last index is the important one and is explained in section 3.

---

## 3. Server-side controllers, routes and API endpoints

### Structure

The server is organised in four layers:

```
routes/       which URL and method belongs to which function
middleware/   checks that run before the controller
controllers/  the logic and the database calls
models/       how the data is stored
```

`server.js` only wires everything together: it parses JSON, connects to
MongoDB, serves the static files, mounts the five routers and ends with the
`404` handler and the error handler.

There are three middleware functions:

- **`auth.js`** reads the `Authorization` header, verifies the token signature
  with the secret from `.env`, loads the user from the database and puts it into
  `req.user`. Without a valid token the answer is `401`.
- **`requireAdmin.js`** runs after it and answers `403` when the role is not
  `admin`. The difference matters: `401` means "I do not know who you are",
  `403` means "I know you, but this is not allowed".
- **`errorHandler.js`** turns errors into proper status codes in one place: a
  malformed id becomes `400`, a validation error becomes `400` with the message
  from the model, a duplicate key becomes `409`, and anything unexpected stays a
  `500` with the details written only to the server log.

A route is protected simply by putting the middleware in front of the
controller:

```js
router.post("/", requireAdmin, createFacility);
```

### Access control

Students must not see other students' data. This is done **in the database
query inside the controller**, not by hiding elements on the page:

```js
const filter = req.user.role === "admin" ? {} : { resident: req.user._id };
```

Filters from the address bar are added to this object, so the ownership limit
is never lost when a student uses the search. Another student's request cannot
be reached even by calling the API directly; the answer is `403`.

The owner of a new record is always taken from the token
(`resident: req.user._id`) and never from the request body, so a request cannot
be created in somebody else's name.

### Request workflow

The status is not changed by the normal `PATCH /api/requests/:id`. It has its
own endpoint, `PATCH /api/requests/:id/status`, and the server decides with a
transition table:

```js
const allowedTransitions = {
  Submitted:     ["Reviewed", "Rejected", "Cancelled"],
  Reviewed:      ["In Progress", "Rejected"],
  "In Progress": ["Completed"],
  Completed: [], Rejected: [], Cancelled: [],
};
```

An empty list means the status is final, so a completed request can never go
back to the beginning. A transition that is not in the table is answered with
`409` and the request keeps its old status. Only an administrator may change the
status; a student may only cancel an own request while it is still `Submitted`.

Every successful change appends one entry to the history in the same database
operation:

```js
{ $set: updates, $push: { statusHistory: historyEntry } }
```

`$push` only adds, so older entries cannot be lost, and no endpoint can edit or
delete them.

### Booking conflicts

Two slots overlap when the new one starts before the old one ends and ends
after the old one starts:

```js
startAt: { $lt: end }, endAt: { $gt: start }, status: "Active"
```

A check in the code is not enough, because two requests can pass it at the same
moment. The real protection is the unique index on `facilityId` and `startAt`.
Its `partialFilterExpression` covers only `Active` bookings, so a cancelled
booking leaves the index and the slot becomes free again. When the database
rejects the insert with error `11000`, the controller answers `409` instead of
`500`. Cancelling therefore only changes the status and keeps the record, which
also keeps the booking history complete.

### API endpoints

There are 23 endpoints in five groups:

| Group | Endpoints |
|---|---|
| `/api/auth` | register, login, me |
| `/api/requests` | list, create, read, update, delete, change status |
| `/api/facilities` | list, read, create, update, delete |
| `/api/bookings` | list, create, read, cancel |
| `/api/announcements` | list, read, create, update, delete |

The list of requests accepts
`?status=&category=&priority=&roomNumber=&q=&page=&limit=`, where `q` searches
in the description and the room number. The search text is escaped before it is
used in a regular expression, so a special character cannot change the query.

Status codes: `200` success, `201` created, `400` invalid data, `401` missing or
invalid token, `403` not allowed, `404` not found, `409` conflict.

---

## 4. Deployment configuration and setup instructions

### Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

The manifests are copied before the source code on purpose. Docker caches each
layer, so `npm ci` runs again only when the dependencies change and not after
every edit in an HTML file. `npm ci` installs exactly the versions from
`package-lock.json`, and `--omit=dev` leaves out packages that are not needed to
run the server. The image runs as the non-root user `node`.

`.dockerignore` keeps `node_modules`, `.git` and especially `.env` out of the
image. Secrets are passed at run time instead, so they are not baked into a file
that could be copied somewhere else. Leaving `node_modules` out also matters
because `bcrypt` is compiled for the operating system, and a copy built on
Windows would not run inside a Linux container.

### Setup instructions

```bash
git clone <repository-url>
cd dormflow
npm install
cp .env.example .env      # then fill in MONGODB_URI and JWT_SECRET
npm run seed              # optional demo data, deletes the database first
npm start                 # http://localhost:3000
```

With Docker:

```bash
docker build -t dormflow .
docker run -p 3000:3000 --env-file .env dormflow
```

If MongoDB runs on the host machine, the container cannot reach it through
`localhost`, because inside a container `localhost` is the container itself.
The connection string has to use `host.docker.internal` instead.

The demo accounts created by `npm run seed` all use the password `password123`:
`admin@dormflow.test` is the administrator and `anna@dormflow.test`,
`bob@dormflow.test` and `clara@dormflow.test` are students.

---

## 5. Source code repository

https://github.com/andrewblesse7-afk/test1

The repository contains the full commit history. The project was built in small
steps, one feature per commit, so the history shows how the application grew.

---

## Testing and limitations

The API was tested manually with `curl` and PowerShell requests, checking both
the successful answers and the error codes: a request without a token returns
`401`, a student calling an administrator route returns `403`, an invalid status
transition returns `409`, and booking the same slot twice returns `409`.

Known limitations:

- The project is a study assignment and is not prepared for production use.
- There are no automated tests; everything was checked manually.
- The Docker image was written following the standard steps, and the
  application was verified to run with production dependencies only, but the
  image itself has not been built yet.
- A token is valid for seven days and cannot be revoked earlier.
- `pricePerSlot` exists on facilities, but no payment is implemented, so all
  bookings are free.
- The admin dashboard does not show pagination controls, although the API
  supports `page` and `limit`.

Possible improvements would be a mock payment for paid facilities, photo upload
for maintenance requests, automated API tests and email notifications when a
status changes.
