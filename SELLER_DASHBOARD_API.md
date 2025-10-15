# 📊 SELLER DASHBOARD API - COMPLETE TECHNICAL DOCUMENTATION

## TABLE OF CONTENTS
1. [Overview](#1-overview)
2. [API Endpoint Details](#2-api-endpoint-details)
3. [Response Structure](#3-response-structure)
4. [Database Queries](#4-database-queries)
5. [Code Implementation](#5-code-implementation)
6. [Frontend Integration Examples](#6-frontend-integration-examples)

---

## 1. OVERVIEW

The Seller Dashboard API provides comprehensive analytics and statistics for sellers on the platform. It aggregates data from the Products table to give sellers insights into their inventory, pricing, and product distribution.

### Key Features:
✅ **Total products count** - Get the total number of products for a seller  
✅ **Product breakdown** - Distribution by shape, color, and clarity  
✅ **Pricing analytics** - Total inventory value and average price per carat  
✅ **Recent products** - Latest products added by the seller  

### Authentication:
All dashboard endpoints require JWT authentication via the `Authorization` header.

---

## 2. API ENDPOINT DETAILS

### 2.1 Get Dashboard Overview
**Endpoint:** `GET /api/user/dashboard`  
**Authentication:** Required (JWT Token)  
**Description:** Returns basic dashboard statistics including total product count.

#### Request
```bash
curl -X GET http://localhost:3000/api/user/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "overview": {
      "totalProducts": 150
    },
    "metrics": {
      "productsCount": 150
    }
  }
}
```

---

### 2.2 Get Product Statistics
**Endpoint:** `GET /api/user/dashboard/products/stats`  
**Authentication:** Required (JWT Token)  
**Description:** Returns detailed product statistics including distribution by shape, color, clarity, and pricing analytics.

#### Request
```bash
curl -X GET http://localhost:3000/api/user/dashboard/products/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response
```json
{
  "success": true,
  "message": "Product statistics retrieved successfully",
  "data": {
    "totalProducts": 150,
    "breakdown": {
      "byShape": [
        { "_id": "Round", "count": 45 },
        { "_id": "Princess", "count": 30 },
        { "_id": "Oval", "count": 25 },
        { "_id": "Cushion", "count": 20 },
        { "_id": "Emerald", "count": 15 },
        { "_id": "Pear", "count": 10 },
        { "_id": "Marquise", "count": 5 }
      ],
      "byColor": [
        { "_id": "D", "count": 20 },
        { "_id": "E", "count": 25 },
        { "_id": "F", "count": 30 },
        { "_id": "G", "count": 35 },
        { "_id": "H", "count": 20 },
        { "_id": "I", "count": 15 },
        { "_id": "J", "count": 5 }
      ],
      "byClarity": [
        { "_id": "IF", "count": 10 },
        { "_id": "VVS1", "count": 20 },
        { "_id": "VVS2", "count": 30 },
        { "_id": "VS1", "count": 40 },
        { "_id": "VS2", "count": 30 },
        { "_id": "SI1", "count": 15 },
        { "_id": "SI2", "count": 5 }
      ]
    },
    "pricing": {
      "totalInventoryValue": 1500000.00,
      "avgPricePerCarat": 10000.00
    }
  }
}
```

---

### 2.3 Get Recent Products
**Endpoint:** `GET /api/user/dashboard/products/recent`  
**Authentication:** Required (JWT Token)  
**Query Parameters:**
- `limit` (optional): Number of products to return (default: 10)

#### Request
```bash
curl -X GET "http://localhost:3000/api/user/dashboard/products/recent?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response
```json
{
  "success": true,
  "message": "Recent products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "67890abcdef123456789",
        "pid": "1234567890ABCDEF",
        "stock_id": "DIA-001",
        "shape": "Round",
        "carat": 1.5,
        "color": "D",
        "clarity": "VVS1",
        "total_price": 25000.00,
        "createdAt": "2025-10-15T10:30:00.000Z"
      },
      {
        "_id": "67890abcdef123456790",
        "pid": "1234567890ABCDEG",
        "stock_id": "DIA-002",
        "shape": "Princess",
        "carat": 2.0,
        "color": "E",
        "clarity": "VS1",
        "total_price": 30000.00,
        "createdAt": "2025-10-14T15:20:00.000Z"
      }
    ],
    "count": 2
  }
}
```

---

## 3. RESPONSE STRUCTURE

### Success Response Format
All successful API responses follow this structure:
```typescript
{
  success: true,
  message: string,
  data: object
}
```

### Error Response Format
All error responses follow this structure:
```typescript
{
  success: false,
  message: string,
  statusCode: number
}
```

### Common Error Codes
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server-side error

---

## 4. DATABASE QUERIES

### 4.1 Total Products Count
```javascript
Product.countDocuments({ seller_id: sellerObjectId })
```

### 4.2 Products by Shape (Aggregation)
```javascript
Product.aggregate([
  { $match: { seller_id: sellerObjectId } },
  { $group: { _id: '$shape', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### 4.3 Products by Color (Aggregation)
```javascript
Product.aggregate([
  { $match: { seller_id: sellerObjectId } },
  { $group: { _id: '$color', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### 4.4 Products by Clarity (Aggregation)
```javascript
Product.aggregate([
  { $match: { seller_id: sellerObjectId } },
  { $group: { _id: '$clarity', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### 4.5 Total Inventory Value (Aggregation)
```javascript
Product.aggregate([
  { $match: { seller_id: sellerObjectId } },
  { $group: { _id: null, total: { $sum: '$total_price' } } }
])
```

### 4.6 Average Price Per Carat (Aggregation)
```javascript
Product.aggregate([
  { $match: { seller_id: sellerObjectId } },
  { $group: { _id: null, avg: { $avg: '$price_per_carat' } } }
])
```

### 4.7 Recent Products
```javascript
Product.find({ seller_id: sellerObjectId })
  .select('pid stock_id shape carat color clarity total_price createdAt')
  .sort({ createdAt: -1 })
  .limit(10)
```

---

## 5. CODE IMPLEMENTATION

### 5.1 File Structure
```
src/
├── services/
│   └── SellerDashboardService.ts    # Business logic for dashboard
├── controllers/
│   └── UserController.ts            # Dashboard endpoints
└── routes/
    └── userRoutes.ts                # Route definitions
```

### 5.2 SellerDashboardService.ts
```typescript
import Product from '../models/Product.model';
import { Types } from 'mongoose';

export class SellerDashboardService {
    async getDashboardStats(sellerId: string | Types.ObjectId) {
        const sellerObjectId = typeof sellerId === 'string' 
            ? new Types.ObjectId(sellerId) 
            : sellerId;

        const totalProducts = await Product.countDocuments({ 
            seller_id: sellerObjectId 
        });

        return {
            overview: {
                totalProducts
            },
            metrics: {
                productsCount: totalProducts
            }
        };
    }

    async getProductStats(sellerId: string | Types.ObjectId) {
        // ... (see full implementation in the file)
    }

    async getRecentProducts(sellerId: string | Types.ObjectId, limit: number = 10) {
        // ... (see full implementation in the file)
    }
}
```

### 5.3 UserController.ts (Dashboard Methods)
```typescript
export class UserController {
    private dashboardService: SellerDashboardService;

    constructor() {
        this.dashboardService = new SellerDashboardService();
    }

    public async getDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            const dashboardStats = await this.dashboardService.getDashboardStats(user._id);
            return sendSuccessResponse(res, SuccessResponses.OK('Dashboard statistics retrieved successfully', dashboardStats));
        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getDashboard',
                errorMsg: `Dashboard retrieval failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    public async getProductStats(req: Request, res: Response): Promise<Response> {
        // ... (see full implementation)
    }

    public async getRecentProducts(req: Request, res: Response): Promise<Response> {
        // ... (see full implementation)
    }
}
```

### 5.4 userRoutes.ts
```typescript
// Dashboard routes
router.get('/dashboard', 
  authenticateToken, 
  (req: Request, res: Response) => userController.getDashboard(req, res)
);

router.get('/dashboard/products/stats', 
  authenticateToken, 
  (req: Request, res: Response) => userController.getProductStats(req, res)
);

router.get('/dashboard/products/recent', 
  authenticateToken, 
  (req: Request, res: Response) => userController.getRecentProducts(req, res)
);
```

---

## 6. FRONTEND INTEGRATION EXAMPLES

### 6.1 React/Next.js Example

#### API Service
```typescript
// services/dashboardService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/user';

export const dashboardService = {
  async getDashboard(token: string) {
    const response = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getProductStats(token: string) {
    const response = await axios.get(`${API_BASE_URL}/dashboard/products/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getRecentProducts(token: string, limit: number = 10) {
    const response = await axios.get(`${API_BASE_URL}/dashboard/products/recent`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit }
    });
    return response.data;
  }
};
```

#### Dashboard Component
```typescript
// components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

interface DashboardStats {
  overview: {
    totalProducts: number;
  };
  metrics: {
    productsCount: number;
  };
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getDashboard(token!);
        setStats(data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <h1>Seller Dashboard</h1>
      <div className="stats-card">
        <h2>Total Products</h2>
        <p className="stat-value">{stats.overview.totalProducts}</p>
      </div>
    </div>
  );
};
```

#### Product Statistics Component
```typescript
// components/ProductStats.tsx
import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

export const ProductStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStats = async () => {
      const data = await dashboardService.getProductStats(token!);
      setStats(data.data);
    };
    fetchStats();
  }, [token]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="product-stats">
      <div className="stat-overview">
        <h2>Total Products: {stats.totalProducts}</h2>
        <p>Total Inventory Value: ${stats.pricing.totalInventoryValue.toFixed(2)}</p>
        <p>Avg Price/Carat: ${stats.pricing.avgPricePerCarat.toFixed(2)}</p>
      </div>

      <div className="charts">
        <div className="chart">
          <h3>By Shape</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.breakdown.byShape} dataKey="count" nameKey="_id" />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h3>By Color</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.breakdown.byColor} dataKey="count" nameKey="_id" />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
```

### 6.2 Vanilla JavaScript Example

```javascript
// dashboard.js
const API_BASE_URL = 'http://localhost:3000/api/user';
const token = localStorage.getItem('token');

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalProducts').textContent = data.data.overview.totalProducts;
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadProductStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/products/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.success) {
      displayProductStats(data.data);
    }
  } catch (error) {
    console.error('Error loading product stats:', error);
  }
}

function displayProductStats(stats) {
  document.getElementById('totalProducts').textContent = stats.totalProducts;
  document.getElementById('inventoryValue').textContent = `$${stats.pricing.totalInventoryValue.toFixed(2)}`;
  document.getElementById('avgPrice').textContent = `$${stats.pricing.avgPricePerCarat.toFixed(2)}`;
  
  // Display shape breakdown
  const shapeList = document.getElementById('shapeBreakdown');
  stats.breakdown.byShape.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item._id}: ${item.count}`;
    shapeList.appendChild(li);
  });
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadProductStats();
});
```

---

## 7. TESTING

### 7.1 Manual Testing with cURL

#### Test Dashboard Overview
```bash
curl -X GET http://localhost:3000/api/user/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Product Stats
```bash
curl -X GET http://localhost:3000/api/user/dashboard/products/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Recent Products
```bash
curl -X GET "http://localhost:3000/api/user/dashboard/products/recent?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7.2 Postman Collection

```json
{
  "info": {
    "name": "Seller Dashboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Dashboard",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/user/dashboard",
          "host": ["{{base_url}}"],
          "path": ["api", "user", "dashboard"]
        }
      }
    },
    {
      "name": "Get Product Stats",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/user/dashboard/products/stats",
          "host": ["{{base_url}}"],
          "path": ["api", "user", "dashboard", "products", "stats"]
        }
      }
    },
    {
      "name": "Get Recent Products",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/user/dashboard/products/recent?limit=10",
          "host": ["{{base_url}}"],
          "path": ["api", "user", "dashboard", "products", "recent"],
          "query": [
            {
              "key": "limit",
              "value": "10"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 8. PERFORMANCE OPTIMIZATION

### 8.1 Database Indexing
Ensure the following indexes exist on the Product collection:

```javascript
// MongoDB indexes
db.products.createIndex({ seller_id: 1 });
db.products.createIndex({ seller_id: 1, createdAt: -1 });
db.products.createIndex({ seller_id: 1, shape: 1 });
db.products.createIndex({ seller_id: 1, color: 1 });
db.products.createIndex({ seller_id: 1, clarity: 1 });
```

### 8.2 Caching Strategy
Consider implementing Redis caching for dashboard data:

```typescript
import Redis from 'ioredis';
const redis = new Redis();

async function getDashboardWithCache(sellerId: string) {
  const cacheKey = `dashboard:${sellerId}`;
  
  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // If not in cache, fetch from database
  const data = await dashboardService.getDashboardStats(sellerId);
  
  // Store in cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}
```

---

## 9. SECURITY CONSIDERATIONS

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own dashboard data
3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
4. **Input Validation**: Query parameters are validated (e.g., limit must be a number)

---

## 10. CHANGELOG

### Version 1.0.0 (October 15, 2025)
- ✅ Initial implementation
- ✅ Added total products count
- ✅ Added product breakdown by shape, color, clarity
- ✅ Added pricing analytics
- ✅ Added recent products endpoint

---

## 11. SUPPORT

For issues or questions:
- Check the error response messages
- Review the logs in the console
- Contact the development team

---

**Last Updated:** October 15, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
