# JWT Authentication Setup Guide

## Quick Start

### 1. Environment Configuration
Add to your `.env.local`:
```bash
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=7d
API_PORT=3000
```

### 2. Login Flow
```typescript
// 1. User submits credentials
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

// Response: { user: {...}, token: "eyJhbGc..." }
const { user, token } = await response.json();

// 2. Store token (in localStorage or secure cookie)
localStorage.setItem('authToken', token);

// 3. Use token in subsequent requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // ADD THIS TO ALL REQUESTS
};
```

### 3. Making Authenticated Requests
```typescript
// All sensitive endpoints now require the Authorization header
const response = await fetch('/api/users/my-id/wallet', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  },
  body: JSON.stringify({ amount: 100 })
});
```

### 4. Register New User
```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'securepassword123',
    name: 'John Doe',
    avatar: 'U' // optional
  })
});

// Response also includes JWT token for immediate login
const { user, token } = await response.json();
localStorage.setItem('authToken', token);
```

## Error Responses

### 401 Unauthorized (Missing/Invalid Token)
```json
{
  "error": "Unauthorized: Missing or invalid Authorization header"
}
```

### 401 Unauthorized (Expired Token)
```json
{
  "error": "Unauthorized: Invalid or expired token"
}
```

### 403 Forbidden (Insufficient Permissions)
```json
{
  "error": "Forbidden: Cannot view other users"
}
```

### 400 Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "amount",
      "message": "Amount must be positive"
    }
  ]
}
```

### 429 Too Many Requests (Rate Limit)
```json
{
  "error": "Too many login attempts, please try again later"
}
```

## Protected Endpoints Reference

### User Endpoints
- ✅ `GET /api/users/:id` - Get user profile (must be self or admin)
- ✅ `PATCH /api/users/:id/wallet` - Update wallet (must be self or admin)
- ✅ `PATCH /api/users/:id/artist-status` - Update artist info (must be self)
- ✅ `GET /api/users` - List all users (admin only)

### Holdings & Artworks
- ✅ `GET /api/holdings/:userId` - View holdings (must be self or admin)
- ✅ `POST /api/holdings` - Create holding (requires auth)
- ✅ `PATCH /api/holdings/:id` - Update holding (must own or be admin)
- ✅ `POST /api/artworks` - Create artwork (requires auth)
- ✅ `POST /api/artwork-submissions` - Submit for verification (requires auth)
- ✅ `GET /api/artwork-submissions` - View submissions (admin only)

### Transactions
- ✅ `POST /api/offers` - Create offer (requires auth, rate-limited)
- ✅ `PATCH /api/offers/:id/accept` - Accept offer (requires auth)
- ✅ `PATCH /api/offers/:id/reject` - Reject offer (requires auth)
- ✅ `POST /api/buy` - Direct purchase (requires auth, rate-limited)
- ✅ `POST /api/swap` - Propose swap (requires auth)
- ✅ `PATCH /api/swap/:id/accept` - Accept swap (requires auth)
- ✅ `PATCH /api/swap/:id/reject` - Reject swap (requires auth)
- ✅ `POST /api/withdrawals` - Withdraw funds (requires auth, rate-limited)

## Public Endpoints (No Auth Required)
- `GET /api/health` - Health check
- `GET /api/artworks` - Browse artworks
- `GET /api/artworks/:id` - View artwork details
- `POST /api/users` - Register new user (returns token)
- `POST /api/auth/login` - Login (rate-limited)

## Frontend Integration Example

```typescript
// auth-client.ts
export class AuthClient {
  private token: string | null = null;

  async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) throw new Error('Login failed');
    const { token } = await res.json();
    this.token = token;
    localStorage.setItem('authToken', token);
    return token;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token || localStorage.getItem('authToken')}`
    };
  }

  async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    return fetch(endpoint, { ...options, headers });
  }
}

// Usage
const auth = new AuthClient();
await auth.login('user@example.com', 'password');
const res = await auth.fetchAPI('/api/users/me/wallet', { method: 'PATCH' });
```

## Token Expiration
- Default expiry: 7 days
- When expired: Frontend gets 401 response
- Action: Redirect to login page
- Future enhancement: Implement refresh token rotation

## Rate Limiting
- **Login**: 5 attempts per 15 minutes per IP
- **Financial operations** (buy, offer, withdraw): 20 per minute per IP
- **General API**: 100 requests per minute per IP
- Hits return: `429 Too Many Requests`

## Security Best Practices
1. ✅ Never log the token in console
2. ✅ Store token in httpOnly cookie (more secure than localStorage)
3. ✅ Always use HTTPS in production
4. ✅ Set `SameSite=Strict` on cookies
5. ✅ Implement token refresh mechanism
6. ✅ Clear token on logout
7. ✅ Use environment-specific secrets
