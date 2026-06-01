# Quick Start Examples

## cURL Examples

### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Collector",
    "email": "john@example.com",
    "password": "securepassword123",
    "location": "Lagos, Nigeria"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### 3. Add Artwork
```bash
TOKEN="<your_jwt_token>"
curl -X POST http://localhost:5000/api/artworks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Harmattan Haze",
    "artist": "Emeka Osei",
    "description": "A vibrant painting",
    "medium": "Painting",
    "condition": "excellent",
    "estimatedValue": 480000
  }'
```

### 4. Browse Artworks
```bash
curl http://localhost:5000/api/artworks
```

### 5. Place Offer
```bash
TOKEN="<your_jwt_token>"
curl -X POST http://localhost:5000/api/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "offeringPieceId": "607f1f77bcf86cd799439013",
    "targetPieceId": "607f1f77bcf86cd799439012",
    "offerType": "art-plus-cash",
    "cashAmount": 80000
  }'
```

### 6. Get My Offers
```bash
TOKEN="<your_jwt_token>"
curl http://localhost:5000/api/offers \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Accept Offer (Create Swap)
```bash
TOKEN="<your_jwt_token>"
curl -X POST http://localhost:5000/api/swaps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "offerId": "707f1f77bcf86cd799439014"
  }'
```

## JavaScript/Fetch Examples

### Register
```javascript
const registerUser = async () => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Collector',
      email: 'john@example.com',
      password: 'securepassword123',
      location: 'Lagos, Nigeria'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};
```

### Get Artworks
```javascript
const getArtworks = async () => {
  const response = await fetch('http://localhost:5000/api/artworks');
  return response.json();
};
```

### Create Artwork (with token)
```javascript
const createArtwork = async (artworkData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/artworks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(artworkData)
  });
  return response.json();
};
```

### Place Offer
```javascript
const placeOffer = async (offerData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(offerData)
  });
  return response.json();
};
```

## Testing Workflow

1. **Register a user** - Create an account
2. **Add artworks** - Add pieces to your collection
3. **Register another user** - Create a second account
4. **Add artworks for second user** - Add pieces to second user's collection
5. **Browse artworks** - View all available pieces
6. **Place offer** - First user places offer on second user's artwork
7. **Accept offer** - Second user accepts the offer
8. **Track swap** - Monitor swap progress on dashboard

## Sample Data

### Artwork 1
```json
{
  "title": "Harmattan Haze",
  "artist": "Emeka Osei",
  "description": "A vibrant painting capturing desert winds",
  "medium": "Painting",
  "condition": "excellent",
  "estimatedValue": 480000
}
```

### Artwork 2
```json
{
  "title": "Green Season",
  "artist": "Emeka Osei",
  "description": "Nature-inspired landscape artwork",
  "medium": "Painting",
  "condition": "good",
  "estimatedValue": 320000
}
```

### Artwork 3
```json
{
  "title": "Blue Lagoon",
  "artist": "Fatima Diallo",
  "description": "Contemporary sculpture",
  "medium": "Sculpture",
  "condition": "excellent",
  "estimatedValue": 210000
}
```
