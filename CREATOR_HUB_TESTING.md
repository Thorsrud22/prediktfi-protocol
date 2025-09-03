# Creator Hub Testing Guide

## Quick Testing Setup

### 1. Environment Configuration
```bash
# Create .env.local with these variables:
NEXT_PUBLIC_ENABLE_ADMIN=1
ADMIN_USER=admin
ADMIN_PASS=secure123
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test Authentication Flow

#### Access Admin (Should Prompt for Login)
```bash
curl -i http://localhost:3000/admin
# Expected: 401 with WWW-Authenticate header
```

#### Login with Correct Credentials
```bash
curl -i -u admin:secure123 http://localhost:3000/admin
# Expected: 200 with Creator Hub interface
```

#### Test Wrong Credentials
```bash
curl -i -u admin:wrongpass http://localhost:3000/admin
# Expected: 401 Unauthorized
```

### 4. Test Creator Hub Functionality

1. **Access Creator Hub**: Go to `http://localhost:3000/admin` with correct credentials
2. **Fill Form**: Enter market title, subtitle, category, and creator ID
3. **Preview Updates**: Verify MarketCard preview updates in real-time
4. **Copy Ref URL**: Click copy button and verify URL format
5. **Test Attribution**: Use copied URL and verify tracking works

### 5. Verify Attribution Flow

1. **Use Ref URL**: Navigate to copied reference URL
2. **Place Bet**: Complete betting process
3. **Check Portfolio**: Go to `/me` and verify attribution shows in receipt

## Expected Test Results

- ✅ Basic Auth blocks unauthorized access
- ✅ Correct credentials grant access
- ✅ Form updates preview in real-time
- ✅ Ref URLs generate with proper attribution parameters
- ✅ Attribution tracking persists through betting flow
- ✅ Portfolio shows creator attribution in receipts

## Unit Test Coverage

```bash
# Run creator utility tests
npm test -- creator-utils

# Run integration tests  
npm test -- creator-hub-integration

# Run all tests
npm test
```

## Environment Variables Required

```
NEXT_PUBLIC_ENABLE_ADMIN=1  # Enables admin access
ADMIN_USER=admin            # Admin username
ADMIN_PASS=secure123        # Admin password
```

## Security Notes

- Admin is completely disabled unless `NEXT_PUBLIC_ENABLE_ADMIN=1`
- Basic Auth protects all `/admin` routes
- Environment variables must be set for authentication
- Use strong passwords in production
