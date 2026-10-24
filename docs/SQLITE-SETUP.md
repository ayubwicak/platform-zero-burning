# SQLite Setup (Development)

## Why SQLite?

PostgreSQL authentication was blocking development. SQLite provides:
- ✅ No password required
- ✅ Instant setup
- ✅ File-based database
- ✅ Full SQL support for development
- ✅ Compatible with existing code

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install sqlite3 better-sqlite3 --save
```

### 2. Setup Database

```bash
# Create database & seed with admin user
node setup-sqlite.js
```

### 3. Start Backend

```bash
npm start
```

Backend akan connect ke `src/zero_burning.db` ✅

## Login Credentials

**Admin Account:**
- Email: `admin@zeroburning.id`
- Password: `admin123`

**Test Account:**
- Email: `otp-test@test.com`
- Password: `petani123`

## How It Works

### SQLite Adapter

File: `src/config/db-sqlite.js`

Provides Pool-like interface compatible with existing PostgreSQL code:
- `query(sql, params)` - executes queries
- Supports SELECT, INSERT, UPDATE, DELETE
- Automatically converts `$1, $2` params to `?`

### Setup Script

File: `setup-sqlite.js`

1. Creates SQLite database at `src/zero_burning.db`
2. Runs schema (tables, indexes)
3. Seeds admin & test users with bcrypt hashed passwords

## Database File

Location: `backend/src/zero_burning.db`

SQLite format, can be inspected with:
```bash
sqlite3 backend/src/zero_burning.db ".tables"
```

## Testing APIs

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zeroburning.id","password":"admin123"}'

# Create field
curl -X POST http://localhost:3000/api/fields \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lahan Test",
    "area": 5000,
    "category": "padi",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "address": "Jl. Test"
  }'
```

## Switching Back to PostgreSQL

When PostgreSQL authentication is fixed:

1. Update `backend/src/config/db.js`:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
module.exports = pool;
```

2. Setup PostgreSQL database & run schema
3. Migrate data if needed from SQLite

## Limitations

- SQLite is single-file, good for development only
- Not recommended for production
- Should switch to PostgreSQL for multi-user/concurrent access

## Files Changed

- `backend/src/config/db.js` - Uses SQLite instead of PostgreSQL
- `backend/src/config/db-sqlite.js` - SQLite Pool adapter
- `backend/setup-sqlite.js` - Database setup & seeding

## Next Steps

1. ✅ Frontend login testing
2. ✅ Test all API endpoints
3. ⏳ Resolve PostgreSQL auth issue for production setup
