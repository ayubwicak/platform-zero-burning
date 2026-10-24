# Database Setup Guide

## Quick Start

### 1. Verify PostgreSQL is Running

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or start it
sudo systemctl start postgresql
```

### 2. Create Database & User (Peer Auth - Recommended)

**Option A: Using peer authentication (no password needed)**

```bash
# Create database as postgres user
sudo -u postgres createdb zero_burning

# Grant permissions
sudo -u postgres psql -c "ALTER DATABASE zero_burning OWNER TO postgres;"
```

**Option B: Using password authentication**

```bash
# Login as postgres
sudo -u postgres psql

# Inside psql:
CREATE USER zeroburning WITH PASSWORD 'zeroburning123';
CREATE DATABASE zero_burning OWNER zeroburning;
ALTER USER zeroburning CREATEDB;
\q
```

Then update `.env`:
```
DATABASE_URL=postgresql://zeroburning:zeroburning123@localhost:5432/zero_burning
```

### 3. Initialize Schema & Seed Data

```bash
cd /home/ayubw/projects/platform-zero-burning

# Run schema
sudo -u postgres psql -d zero_burning -f database/schema.sql

# Run seed data
sudo -u postgres psql -d zero_burning -f database/seed.sql
```

### 4. Test Connection

```bash
# Test connection
sudo -u postgres psql -d zero_burning -c "SELECT COUNT(*) FROM users;"

# Or from node
node -e "const pool = require('./backend/src/config/db'); pool.query('SELECT NOW()', (err, res) => { console.log(err || res.rows[0]); process.exit(0); })"
```

## Current Configuration

**File:** `backend/.env`

```
DATABASE_URL=postgresql:///zero_burning?host=/var/run/postgresql
```

This uses **peer authentication** via Unix socket at `/var/run/postgresql`.

**Advantages:**
- No password needed
- More secure
- Works with OS user permissions

**Requirements:**
- PostgreSQL running
- Current user can access `/var/run/postgresql` socket
- Database exists

## Troubleshooting

### "connect ECONNREFUSED"
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Verify socket exists
ls -la /var/run/postgresql/
```

### "password authentication failed"
- Check `.env` DATABASE_URL
- Verify PostgreSQL user exists
- Check `/etc/postgresql/18/main/pg_hba.conf` auth method

### "database does not exist"
```bash
# Create it
sudo -u postgres createdb zero_burning

# Or with owner
sudo -u postgres psql -c "CREATE DATABASE zero_burning OWNER postgres;"
```

### "permission denied for schema public"
```bash
sudo -u postgres psql -d zero_burning -c "GRANT ALL ON SCHEMA public TO postgres;"
```

## Reset Database

```bash
# Drop and recreate
sudo -u postgres dropdb zero_burning
sudo -u postgres createdb zero_burning

# Reinitialize
sudo -u postgres psql -d zero_burning -f database/schema.sql
sudo -u postgres psql -d zero_burning -f database/seed.sql
```

## Default Users (After Seed)

- **Admin:** `admin@zeroburning.id` / `admin123`
- **Test User:** `otp-test@test.com` / `petani123`

## Production Setup

For production, use password authentication:

```bash
# Create dedicated user
sudo -u postgres psql
CREATE USER zeroburning_prod WITH PASSWORD 'strong-secure-password';
CREATE DATABASE zero_burning_prod OWNER zeroburning_prod;
```

Update `.env` for production:
```
DATABASE_URL=postgresql://zeroburning_prod:strong-secure-password@prod-db-host:5432/zero_burning_prod
```

Enable SSL for remote connections.
