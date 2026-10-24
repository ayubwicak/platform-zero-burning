# URGENT: PostgreSQL Setup Instructions

## Current Status
- Backend `.env` configured: `postgresql://postgres:postgres@localhost:5432/zero_burning`
- PostgreSQL running on port 5432 ✅
- Socket available: `/var/run/postgresql/.s.PGSQL.5432` ✅
- Database `zero_burning` needs to be created ❌

## What You Need To Do (Terminal)

### Option 1: Using sudo (Recommended)

Open terminal dan run:

```bash
# Login ke PostgreSQL sebagai admin
sudo -u postgres psql

# Copy-paste semua commands dibawah di psql prompt:
```

Kemudian di dalam `psql` prompt (berakhir dengan `=#`), jalankan:

```sql
-- Create database
CREATE DATABASE zero_burning;

-- Create user with password
CREATE USER zeroburning WITH PASSWORD 'zeroburning123';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE zero_burning TO zeroburning;

-- Connect to database
\c zero_burning

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO zeroburning;

-- Exit
\q
```

### Option 2: Using Password for postgres User

Kalau postgres user sudah punya password:

```bash
psql -h localhost -U postgres -d postgres
```

Lalu jalankan SQL commands di atas.

---

## After Database Created

### 1. Initialize Schema

```bash
cd /home/ayubw/projects/platform-zero-burning

# Create tables
psql -h localhost -U postgres -d zero_burning -f database/schema.sql
```

### 2. Seed Initial Data

```bash
psql -h localhost -U postgres -d zero_burning -f database/seed.sql
```

### 3. Test Connection

```bash
# Test from terminal
psql -h localhost -U postgres -d zero_burning -c "SELECT COUNT(*) FROM users;"

# Or test backend
cd backend
npm start
```

---

## Expected Credentials After Setup

**Admin User:**
- Email: `admin@zeroburning.id`
- Password: `admin123`

**Test User:**
- Email: `otp-test@test.com`
- Password: `petani123`

---

## Troubleshooting

### If you see: "database does not exist"
→ Run: `psql -h localhost -U postgres -c "CREATE DATABASE zero_burning;"`

### If you see: "password authentication failed"
→ Check PostgreSQL has password authentication enabled in `/etc/postgresql/18/main/pg_hba.conf`

### If you see: "FATAL: Peer authentication failed"
→ Run commands with `sudo -u postgres` as shown above

---

## Quick Summary

1. **Open terminal**
2. **Run:** `sudo -u postgres psql`
3. **Copy-paste SQL commands** from Option 1 above
4. **Type:** `\q` to exit
5. **Run schema:** `psql -h localhost -U postgres -d zero_burning -f database/schema.sql`
6. **Seed data:** `psql -h localhost -U postgres -d zero_burning -f database/seed.sql`
7. **Start backend:** `cd backend && npm start`

Done! ✅

---

**Current Time:** 02:28 UTC
**Work Duration:** 4+ hours 

**Recommendation:** Complete this setup, then take a break! You've done great work today. 😴
