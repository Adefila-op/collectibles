# ArtChain API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Authentication

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Collector",
  "email": "john@example.com",
  "password": "securepassword123",
  "location": "Lagos, Nigeria"
}

Response: 201 Created
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Collector",
    "email": "john@example.com",
    "location": "Lagos, Nigeria"
  }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Collector",
    "email": "john@example.com",
    "location": "Lagos, Nigeria"
  }
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Collector",
  "email": "john@example.com",
  "location": "Lagos, Nigeria",
  "collection": [...artwork ids...]
}
```

### 2. Artworks

#### Get All Artworks
```
GET /artworks?owner=507f1f77bcf86cd799439011

Response: 200 OK
[
  {
    "_id": "607f1f77bcf86cd799439012",
    "title": "Harmattan Haze",
    "artist": "Emeka Osei",
    "medium": "Painting",
    "estimatedValue": 480000,
    "condition": "excellent",
    "onchain": true,
    "listingStatus": "not-listed",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Collector B"
    }
  }
]
```

#### Get Artwork Details
```
GET /artworks/607f1f77bcf86cd799439012

Response: 200 OK
{
  "_id": "607f1f77bcf86cd799439012",
  "title": "Harmattan Haze",
  "artist": "Emeka Osei",
  "description": "A vibrant painting capturing the essence of harmattan winds",
  "medium": "Painting",
  "estimatedValue": 480000,
  "currentValue": 520000,
  "lastSoldPrice": 380000,
  "condition": "excellent",
  "onchain": true,
  "tokenId": "0x4e3...a91f",
  "owner": {...}
}
```

#### Create Artwork (Protected)
```
POST /artworks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Blue Lagoon",
  "artist": "Fatima Diallo",
  "description": "Serene sculpture inspired by coastal beauty",
  "medium": "Sculpture",
  "condition": "good",
  "estimatedValue": 210000,
  "dimensions": {
    "height": 45,
    "width": 30,
    "depth": 25
  }
}

Response: 201 Created
{...artwork object...}
```

#### Update Artwork (Protected)
```
PUT /artworks/607f1f77bcf86cd799439012
Authorization: Bearer <token>
Content-Type: application/json

{
  "estimatedValue": 250000,
  "condition": "excellent"
}

Response: 200 OK
{...updated artwork...}
```

#### Delete Artwork (Protected)
```
DELETE /artworks/607f1f77bcf86cd799439012
Authorization: Bearer <token>

Response: 200 OK
{ "message": "Artwork deleted" }
```

### 3. Offers

#### Create Offer (Protected)
```
POST /offers
Authorization: Bearer <token>
Content-Type: application/json

{
  "offeringPieceId": "607f1f77bcf86cd799439013",
  "targetPieceId": "607f1f77bcf86cd799439012",
  "offerType": "art-plus-cash",
  "cashAmount": 80000
}

Response: 201 Created
{
  "_id": "707f1f77bcf86cd799439014",
  "offerId": "OFF-1683456789123",
  "status": "active",
  "offerType": "art-plus-cash",
  "cashAmount": 80000,
  "expiresAt": "2024-06-30T00:00:00.000Z"
}
```

#### Get All Offers
```
GET /offers?targetUserId=507f1f77bcf86cd799439011&status=active

Response: 200 OK
[...array of offers...]
```

#### Update Offer Status (Protected)
```
PUT /offers/707f1f77bcf86cd799439014
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "accepted"
}

Response: 200 OK
{...updated offer...}
```

#### Decline Offer (Protected)
```
DELETE /offers/707f1f77bcf86cd799439014
Authorization: Bearer <token>

Response: 200 OK
{...rejected offer...}
```

### 4. Swaps

#### Accept Offer & Initiate Swap (Protected)
```
POST /swaps
Authorization: Bearer <token>
Content-Type: application/json

{
  "offerId": "707f1f77bcf86cd799439014"
}

Response: 201 Created
{
  "_id": "807f1f77bcf86cd799439015",
  "swapId": "SWP-ABC123XYZ",
  "status": "accepted",
  "piece1": "607f1f77bcf86cd799439012",
  "piece2": "607f1f77bcf86cd799439013",
  "user1": "507f1f77bcf86cd799439011",
  "user2": "507f1f77bcf86cd799439020",
  "timeline": [
    {
      "step": "Swap accepted onchain",
      "status": "completed"
    }
  ]
}
```

#### Get All Swaps
```
GET /swaps?userId=507f1f77bcf86cd799439011

Response: 200 OK
[...array of swaps...]
```

#### Update Swap Status (Protected)
```
PUT /swaps/807f1f77bcf86cd799439015
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-vault",
  "step": "Both pieces ship to vault",
  "stepStatus": "active"
}

Response: 200 OK
{...updated swap...}
```

#### Approve Audit (Protected)
```
POST /swaps/807f1f77bcf86cd799439015/approve
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "audit-passed",
  "auditStatus": {
    "piece1Audited": true,
    "piece2Audited": true,
    "piece1ApprovedByUser1": true,
    "piece2ApprovedByUser2": true
  }
}
```

### 5. Users

#### Get User Profile
```
GET /users/507f1f77bcf86cd799439011

Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Collector B",
  "email": "collector@example.com",
  "location": "Accra, Ghana",
  "avatar": "https://...",
  "bio": "Art enthusiast from Ghana",
  "collection": [...]
}
```

#### Update User Profile (Protected)
```
PUT /users/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "location": "Lagos, Nigeria"
}

Response: 200 OK
{...updated user...}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Artwork not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Real-time Events (Socket.io)

### Client to Server
```javascript
socket.emit('offer_placed', offerData);
socket.emit('offer_accepted', acceptanceData);
```

### Server to Client
```javascript
socket.on('offer_notification', data);
socket.on('swap_initiated', data);
socket.on('swap_updated', data);
```
