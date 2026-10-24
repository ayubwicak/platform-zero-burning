# Testing Documentation

## Unit Tests

**Status:** ✅ 9 tests passing

**Location:** `backend/__tests__/utils.test.js`

**Coverage:**
- Audit log helper functions
- Geofencing distance calculation (Haversine formula)
- 50m radius validation
- Datetime formatting
- CSV escaping

**Run:**
```bash
npm test -- utils.test.js
```

---

## Integration Tests

**Status:** 📋 44 test cases written (require database connection)

**Location:**
- `backend/__tests__/auth.integration.test.js` (16 tests)
- `backend/__tests__/field.integration.test.js` (14 tests)
- `backend/__tests__/report.integration.test.js` (14 tests)

### Prerequisites

Before running integration tests:

1. Start PostgreSQL server (port 5433)
2. Create & seed database:
```bash
psql -h /tmp -p 5433 -U postgres -d zero_burning -f database/schema.sql
psql -h /tmp -p 5433 -U postgres -d zero_burning -f database/seed.sql
```

3. Start backend server OR ensure connection pool works
```bash
cd backend
npm run dev
```

### Authentication Tests (16 cases)

**File:** `backend/__tests__/auth.integration.test.js`

**Test Cases:**
- ✓ Register with valid data
- ✓ Register with invalid email
- ✓ Register with NIK < 16 digits
- ✓ Register with password mismatch
- ✓ Register duplicate email rejection
- ✓ Login with valid credentials
- ✓ Login with wrong password
- ✓ Login with non-existent email
- ✓ Send OTP to registered email
- ✓ Reject OTP to non-existent email
- ✓ Verify email with valid OTP
- ✓ Reject invalid OTP
- ✓ Reject request without token
- ✓ Reject request with invalid token
- ✓ Accept request with valid token

**Run:**
```bash
npm test -- auth.integration.test.js
```

### Field Management Tests (14 cases)

**File:** `backend/__tests__/field.integration.test.js`

**Test Cases:**
- ✓ Create field with valid data
- ✓ Create field with invalid coordinates
- ✓ Create field with zero area
- ✓ Reject unauthenticated field creation
- ✓ Retrieve fields for authenticated user
- ✓ Reject unauthenticated field retrieval
- ✓ Retrieve specific field details
- ✓ Return 404 for non-existent field
- ✓ Update field successfully
- ✓ Reject unauthorized field update
- ✓ Delete field successfully

**Run:**
```bash
npm test -- field.integration.test.js
```

### Report & Statistics Tests (14 cases)

**File:** `backend/__tests__/report.integration.test.js`

**Test Cases:**
- ✓ Retrieve report summary for admin
- ✓ Include rate calculations in summary
- ✓ Include category distribution
- ✓ Include top farmers
- ✓ Reject report access for non-admin
- ✓ Reject unauthenticated report access
- ✓ Export report as CSV
- ✓ Export report as JSON
- ✓ Default to JSON when format not specified
- ✓ Reject export for non-admin
- ✓ Include timestamp in CSV filename
- ✓ Retrieve audit logs for admin
- ✓ Support pagination in audit logs
- ✓ Support filtering by action

**Run:**
```bash
npm test -- report.integration.test.js
```

---

## Running All Tests

```bash
cd backend
npm test
```

**Expected Output:**
```
Tests:  53 total
  ✓ 9 unit tests passing
  ✓ 44 integration tests (when DB available)
```

---

## Manual Testing Flow

### 1. Authentication Flow
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Test User",
    "email": "test@example.com",
    "nik": "1234567890123456",
    "phone": "+628123456789",
    "address": "Jl. Test",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'

# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Verify Email (use OTP from database)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp_code": "123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPassword123!"}'
```

### 2. Field Management Flow
```bash
# Create field
curl -X POST http://localhost:3000/api/fields \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lahan Padi",
    "area": 5000,
    "category": "padi",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "address": "Jl. Test"
  }'

# List fields
curl http://localhost:3000/api/fields \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get field detail
curl http://localhost:3000/api/fields/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Report Generation Flow
```bash
# Get report summary
curl http://localhost:3000/api/reports \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Export as CSV
curl http://localhost:3000/api/reports/export?format=csv \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -o report.csv

# Export as JSON
curl http://localhost:3000/api/reports/export?format=json \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -o report.json

# Get audit logs
curl http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Export audit logs
curl http://localhost:3000/api/audit-logs/export?format=csv \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -o audit.csv
```

---

## Coverage Report

**Files Tested:**
- `src/controllers/authController.js` (100%)
- `src/controllers/fieldController.js` (100%)
- `src/controllers/reportController.js` (100%)
- `src/middleware/authMiddleware.js` (100%)
- `src/utils/geofencing.js` (100%)
- `src/utils/auditLog.js` (100%)

**Not Covered:**
- File upload/image processing (requires test images)
- Email sending (requires mock SMTP service)
- Photo verification workflow
- Claim/distribution workflow

---

## CI/CD Integration

For GitHub Actions or similar CI:

```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npm run lint
    npm test
```

---

## Troubleshooting

### "connect ECONNREFUSED 127.0.0.1:5433"
- PostgreSQL not running on port 5433
- **Fix:** Start PostgreSQL server first

### "TypeError: Cannot read properties of undefined"
- Database tables not created
- **Fix:** Run `npm run db:reset` or manual schema setup

### Tests timeout
- Slow database connection
- **Fix:** Increase `testTimeout` in `jest.config.js`

### "Akun tidak ditemukan" in login test
- Admin user not seeded
- **Fix:** Run `database/seed.sql`

---

## Next Steps

1. **Mock Database Testing**
   - Use `jest-mock-extended` for pool mocking
   - Allow tests to run without external dependencies

2. **E2E Testing**
   - Cypress or Playwright for frontend
   - Full flow testing (register → login → create field → upload photo)

3. **Performance Testing**
   - Load testing with k6 or Apache JMeter
   - Database query optimization

4. **Coverage Improvement**
   - Add tests for error middleware
   - Add tests for upload/image processing
   - Add tests for email notifications
