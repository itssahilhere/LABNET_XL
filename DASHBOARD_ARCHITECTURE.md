# Dashboard API - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Frontend)                          │
│  React/Next.js/Vanilla JS with JWT Authentication                   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ HTTP Requests with Authorization Header
                          │ Bearer <JWT_TOKEN>
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API ROUTES LAYER                            │
│                    /api/user/userRoutes.ts                          │
├─────────────────────────────────────────────────────────────────────┤
│  GET /api/user/dashboard                                            │
│  GET /api/user/dashboard/products/stats                             │
│  GET /api/user/dashboard/products/recent                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ authenticateToken middleware
                          │ validates JWT & extracts user
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                               │
│                  src/controllers/UserController.ts                  │
├─────────────────────────────────────────────────────────────────────┤
│  getDashboard(req, res)          ──────┐                           │
│  getProductStats(req, res)       ──────┤                           │
│  getRecentProducts(req, res)     ──────┤                           │
└────────────────────────────────────────┼───────────────────────────┘
                                          │
                                          │ Calls service methods
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                                 │
│              src/services/SellerDashboardService.ts                 │
├─────────────────────────────────────────────────────────────────────┤
│  getDashboardStats(sellerId)                                        │
│    │                                                                 │
│    ├─ Queries: Product.countDocuments()                            │
│    └─ Returns: { overview, metrics }                               │
│                                                                      │
│  getProductStats(sellerId)                                          │
│    │                                                                 │
│    ├─ Queries: 6 parallel aggregations                             │
│    │   ├─ Total products count                                     │
│    │   ├─ Group by shape                                           │
│    │   ├─ Group by color                                           │
│    │   ├─ Group by clarity                                         │
│    │   ├─ Total inventory value                                    │
│    │   └─ Average price per carat                                  │
│    └─ Returns: { totalProducts, breakdown, pricing }               │
│                                                                      │
│  getRecentProducts(sellerId, limit)                                 │
│    │                                                                 │
│    ├─ Queries: Product.find().sort().limit()                       │
│    └─ Returns: Array of recent products                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ MongoDB Queries
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                               │
│                    MongoDB Collections                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐          ┌────────────────┐                   │
│  │    Products    │          │     Users      │                    │
│  │   Collection   │◄─────────│   Collection   │                    │
│  │                │  seller_id│                │                    │
│  ├────────────────┤          ├────────────────┤                    │
│  │ _id            │          │ _id            │                    │
│  │ pid            │          │ uid            │                    │
│  │ product_id     │          │ email          │                    │
│  │ stock_id       │          │ name           │                    │
│  │ seller_id  ────┼──────────┤ role           │                    │
│  │ shape          │          │ approval_status│                    │
│  │ carat          │          └────────────────┘                    │
│  │ color          │                                                 │
│  │ clarity        │                                                 │
│  │ cut            │                                                 │
│  │ price_per_carat│                                                 │
│  │ total_price    │                                                 │
│  │ createdAt      │                                                 │
│  │ ...            │                                                 │
│  └────────────────┘                                                 │
│                                                                      │
│  Indexes:                                                            │
│  - seller_id (1)                                                    │
│  - seller_id (1), createdAt (-1)                                   │
│  - seller_id (1), shape (1)                                        │
│  - seller_id (1), color (1)                                        │
│  - seller_id (1), clarity (1)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Request Flow (GET /api/user/dashboard)
```
1. Client sends request:
   GET /api/user/dashboard
   Headers: { Authorization: "Bearer eyJhbGc..." }

2. Route handler receives request
   → Validates JWT token (authenticateToken middleware)
   → Extracts user from token

3. Controller (getDashboard) processes request
   → Checks if user exists
   → Calls dashboardService.getDashboardStats(user._id)

4. Service layer executes business logic
   → Converts sellerId to ObjectId
   → Executes: Product.countDocuments({ seller_id })

5. Database returns result
   → totalProducts: 150

6. Service formats response
   → Returns: { overview: { totalProducts: 150 }, metrics: { productsCount: 150 } }

7. Controller sends success response
   → Status: 200
   → Body: { success: true, message: "...", data: {...} }

8. Client receives response
   → Displays total products count in UI
```

## API Response Schemas

### Dashboard Overview Response
```typescript
{
  success: true,
  message: string,
  data: {
    overview: {
      totalProducts: number
    },
    metrics: {
      productsCount: number
    }
  }
}
```

### Product Stats Response
```typescript
{
  success: true,
  message: string,
  data: {
    totalProducts: number,
    breakdown: {
      byShape: Array<{ _id: string, count: number }>,
      byColor: Array<{ _id: string, count: number }>,
      byClarity: Array<{ _id: string, count: number }>
    },
    pricing: {
      totalInventoryValue: number,
      avgPricePerCarat: number
    }
  }
}
```

### Recent Products Response
```typescript
{
  success: true,
  message: string,
  data: {
    products: Array<{
      _id: string,
      pid: string,
      stock_id: string,
      shape: string,
      carat: number,
      color: string,
      clarity: string,
      total_price: number,
      createdAt: Date
    }>,
    count: number
  }
}
```

## Security Flow

```
┌─────────────┐
│   Client    │
│  Attempts   │
│   Access    │
└──────┬──────┘
       │
       │ Sends JWT in Authorization header
       ▼
┌─────────────────────────┐
│ authenticateToken       │
│ Middleware              │
├─────────────────────────┤
│ 1. Extract token        │
│ 2. Verify signature     │
│ 3. Check expiration     │
│ 4. Decode payload       │
│ 5. Attach user to req   │
└──────┬──────────────────┘
       │
       │ If valid
       ▼
┌─────────────────────────┐
│   Controller            │
│   - Checks req.user     │
│   - Uses user._id       │
└──────┬──────────────────┘
       │
       │ Only seller's data
       ▼
┌─────────────────────────┐
│   Service               │
│   Filters by seller_id  │
└──────┬──────────────────┘
       │
       │ Returns only seller's products
       ▼
┌─────────────┐
│  Database   │
│  Query:     │
│  { seller_id│
│    : userId }│
└─────────────┘
```

## Error Handling Flow

```
┌──────────────────┐
│  Any Layer       │
│  Throws Error    │
└────────┬─────────┘
         │
         │ try/catch
         ▼
┌──────────────────┐
│  Controller      │
│  Catches Error   │
├──────────────────┤
│  1. Log error    │
│  2. Send error   │
│     response     │
└────────┬─────────┘
         │
         │ sendErrorResponse()
         ▼
┌──────────────────┐
│  Client          │
│  Receives        │
├──────────────────┤
│  {               │
│    success: false│
│    message: "..." │
│    statusCode: N │
│  }               │
└──────────────────┘
```
