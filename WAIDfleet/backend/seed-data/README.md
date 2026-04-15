# MongoDB Seed Data

This folder contains ready-to-import JSON files for your MongoDB database.

---

## Files

| File | Collection | Description |
|---|---|---|
| `users.json` | `users` | Regular users (admin, driver, client) |
| `adminusers.json` | `adminusers` | Admin portal users (super_admin, operations, finance, support) |

---

## Default Credentials

### `users` collection

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | admin@waidfleet.com | Admin@123 | admin |
| John Driver | driver@waidfleet.com | Driver@123 | driver |
| Jane Client | client@waidfleet.com | Client@123 | client |

### `adminusers` collection

| Name | Email | Password | Role |
|---|---|---|---|
| Super Admin | admin@waidfleet.com | Admin@123 | super_admin |
| Operations Manager | ops@waidfleet.com | Admin@123 | operations |
| Finance Manager | finance@waidfleet.com | Admin@123 | finance |
| Support Agent | support@waidfleet.com | Admin@123 | support |

> ⚠️ **Change all passwords immediately after importing into a production database.**

---

## How to Import

### Option 1 — `mongoimport` CLI (recommended)

Replace `YOUR_DB_NAME` with your actual database name (check your `MONGO_URI` in `.env`).

```bash
# Import regular users
mongoimport --uri "mongodb://localhost:27017/YOUR_DB_NAME" \
  --collection users \
  --file seed-data/users.json \
  --jsonArray

# Import admin portal users
mongoimport --uri "mongodb://localhost:27017/YOUR_DB_NAME" \
  --collection adminusers \
  --file seed-data/adminusers.json \
  --jsonArray
```

If your MongoDB has authentication:

```bash
mongoimport --uri "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/YOUR_DB_NAME" \
  --collection users \
  --file seed-data/users.json \
  --jsonArray
```

### Option 2 — MongoDB Compass (GUI)

1. Open **MongoDB Compass** and connect to your database.
2. Select (or create) your database, then click the target collection (`users` or `adminusers`).
3. Click **Add Data → Import JSON or CSV file**.
4. Select the corresponding `.json` file and click **Import**.

### Option 3 — Run the existing seed script

The project already includes a seed script that creates the default admin automatically:

```bash
cd WAIDfleet/backend
node seedUser.js
```

---

## Notes

- Passwords in the JSON files are already **bcrypt-hashed** — do **not** hash them again.
- The `users` collection is used for general authentication.
- The `adminusers` collection is the **primary auth model** for the admin portal.
- Both collections use the same `admin@waidfleet.com` / `Admin@123` credentials by default.
