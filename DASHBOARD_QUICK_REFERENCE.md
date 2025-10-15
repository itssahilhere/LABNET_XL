# 📊 Dashboard API - Quick Reference Card

## 🚀 Endpoints at a Glance

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/user/dashboard` | GET | ✅ | Get total products count |
| `/api/user/dashboard/products/stats` | GET | ✅ | Get detailed product analytics |
| `/api/user/dashboard/products/recent` | GET | ✅ | Get recent products (limit param) |

## 📝 Quick Examples

### Get Total Products Count
```bash
curl -X GET http://localhost:3000/api/user/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "data": {
    "overview": { "totalProducts": 150 },
    "metrics": { "productsCount": 150 }
  }
}
```

### Get Product Statistics
```bash
curl -X GET http://localhost:3000/api/user/dashboard/products/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Returns:** Total count, breakdowns (shape/color/clarity), pricing analytics

### Get Recent Products
```bash
curl -X GET "http://localhost:3000/api/user/dashboard/products/recent?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Returns:** Array of recent products with details

## 🔑 Authentication

All endpoints require JWT token:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📦 Response Format

**Success:**
```typescript
{
  success: true,
  message: string,
  data: object
}
```

**Error:**
```typescript
{
  success: false,
  message: string,
  statusCode: number
}
```

## 🎨 Frontend Integration

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useDashboard() {
  const [stats, setStats] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('http://localhost:3000/api/user/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data.data));
  }, [token]);

  return stats;
}
```

### Usage in Component
```typescript
function Dashboard() {
  const stats = useDashboard();
  
  return (
    <div>
      <h1>Total Products: {stats?.overview.totalProducts}</h1>
    </div>
  );
}
```

## 🗄️ Database Queries

| Query Type | Method |
|------------|--------|
| Total count | `Product.countDocuments({ seller_id })` |
| By shape | `Product.aggregate([{ $match }, { $group }])` |
| Recent | `Product.find().sort({ createdAt: -1 }).limit(10)` |
| Inventory value | `Product.aggregate([..., { $sum: '$total_price' }])` |

## 🔒 Security

- ✅ JWT authentication required
- ✅ Data filtered by `seller_id`
- ✅ Users can only see their own data
- ✅ Error messages don't leak sensitive info

## ⚡ Performance Tips

1. **Add indexes** (recommended):
   ```javascript
   db.products.createIndex({ seller_id: 1, createdAt: -1 });
   ```

2. **Use caching** for frequently accessed data:
   ```javascript
   // Cache for 5 minutes
   redis.setex(`dashboard:${sellerId}`, 300, JSON.stringify(data));
   ```

3. **Limit aggregation results** if needed

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token validity |
| Empty data | Verify seller has products |
| Slow queries | Add database indexes |
| Wrong data | Check seller_id filtering |

## 📚 Documentation Files

- **SELLER_DASHBOARD_API.md** - Complete API docs
- **DASHBOARD_ARCHITECTURE.md** - System architecture
- **DASHBOARD_IMPLEMENTATION_SUMMARY.md** - Quick summary
- **DASHBOARD_CHECKLIST.md** - Implementation checklist

## 🧪 Testing Commands

```bash
# Login first
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"pass123"}'

# Then test endpoints with returned token
export TOKEN="your_jwt_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/user/dashboard
```

## 📊 Data Returned

### Dashboard Overview
- Total products count (number)

### Product Stats
- Total products count
- Distribution by shape (array)
- Distribution by color (array)
- Distribution by clarity (array)
- Total inventory value (currency)
- Average price per carat (currency)

### Recent Products
- Product details (array)
- Limited by query param (default: 10)

---

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Status:** ✅ Production Ready
