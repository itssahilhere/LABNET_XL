# LabnetXL Backend - Complete API Documentation

## Base URL
```
http://localhost:3000
```

## Table of Contents
1. [Health Check](#health-check)
2. [User Routes](#user-routes)
3. [Admin Routes](#admin-routes)
4. [Product Routes (API)](#product-routes-api)
5. [Excel Routes](#excel-routes)
6. [Webhook Routes](#webhook-routes)

---

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Health Check

### GET /health
Check API health status

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "LabnetXL Backend API is running",
  "timestamp": "2025-10-17T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## User Routes

Base path: `/api/users`

### 1. Register User

**POST** `/api/users/register`

Register a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "company_name": "Diamond Corp",
  "location": "New York",
  "phone_number": "+1234567890",
  "whatsapp_number": "+1234567890",
  "vat_number": "VAT123456",
  "fileDetails": [
    {
      "fileName": "id_proof.pdf",
      "fileContent": "base64_encoded_content",
      "mimeType": "application/pdf"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": true,
  "message": "User registered successfully. Your account is pending admin approval.",
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c8b5f8e4a5b1",
      "name": "John Doe",
      "email": "john@example.com",
      "company_name": "Diamond Corp",
      "location": "New York",
      "phone_no": "+1234567890",
      "whatsapp_no": "+1234567890",
      "uid": "LNX1001",
      "vat_number": "VAT123456",
      "id_proof": "https://s3.amazonaws.com/bucket/id-proof/file.pdf",
      "approval_status": "pending"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login User

**POST** `/api/users/login`

Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Login successful",
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c8b5f8e4a5b1",
      "name": "John Doe",
      "email": "john@example.com",
      "company_name": "Diamond Corp",
      "uid": "LNX1001",
      "role": "seller",
      "approval_status": "approved"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile

**GET** `/api/users/profile`

Get current user profile information

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Profile retrieved successfully",
  "statusCode": 200,
  "data": {
    "_id": "60d5ec49f1b2c8b5f8e4a5b1",
    "name": "John Doe",
    "email": "john@example.com",
    "company_name": "Diamond Corp",
    "location": "New York",
    "phone_no": "+1234567890",
    "whatsapp_no": "+1234567890",
    "uid": "LNX1001",
    "vat_number": "VAT123456",
    "id_proof": "https://s3.amazonaws.com/bucket/id-proof/file.pdf",
    "is_active": true,
    "role": "seller",
    "approval_status": "approved",
    "package": {
      "id": "60d5ec49f1b2c8b5f8e4a5b2",
      "start_date": "2025-10-01T00:00:00.000Z",
      "end_date": "2025-11-01T00:00:00.000Z"
    }
  }
}
```

### 4. Update User Profile

**PUT** `/api/users/profile`

Update user profile information

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "company_name": "New Diamond Corp",
  "location": "Los Angeles",
  "phone_no": "+1987654321",
  "whatsapp_no": "+1987654321",
  "password": "newPassword123",
  "fileDetails": [
    {
      "fileName": "new_id_proof.pdf",
      "fileContent": "base64_encoded_content",
      "mimeType": "application/pdf"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "statusCode": 200,
  "data": {
    "_id": "60d5ec49f1b2c8b5f8e4a5b1",
    "name": "John Updated Doe",
    "email": "john@example.com",
    "company_name": "New Diamond Corp",
    "location": "Los Angeles",
    "phone_no": "+1987654321",
    "whatsapp_no": "+1987654321",
    "uid": "LNX1001",
    "vat_number": "VAT123456",
    "id_proof": "https://s3.amazonaws.com/bucket/id-proof/new_file.pdf",
    "role": "seller",
    "approval_status": "approved"
  }
}
```

### 5. Get Dashboard Statistics

**GET** `/api/users/dashboard`

Get seller dashboard statistics

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Dashboard statistics retrieved successfully",
  "statusCode": 200,
  "data": {
    "totalProducts": 150,
    "activeProducts": 145,
    "packageInfo": {
      "currentPackage": "Premium Monthly",
      "endDate": "2025-11-01T00:00:00.000Z",
      "daysRemaining": 15
    },
    "recentActivity": {
      "productsAddedToday": 5,
      "productsAddedThisWeek": 23,
      "productsAddedThisMonth": 87
    }
  }
}
```

### 6. Get Product Statistics

**GET** `/api/users/dashboard/products/stats`

Get detailed product statistics

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Product statistics retrieved successfully",
  "statusCode": 200,
  "data": {
    "byShape": {
      "Round": 45,
      "Princess": 30,
      "Oval": 25
    },
    "byColor": {
      "D": 20,
      "E": 35,
      "F": 40
    },
    "byClarity": {
      "IF": 10,
      "VVS1": 25,
      "VVS2": 30
    },
    "priceRange": {
      "min": 1000,
      "max": 50000,
      "average": 15000
    }
  }
}
```

---

## Admin Routes

Base path: `/api/admin`

**All admin routes require:**
- Authentication token
- Admin role

### 1. Get Dashboard Statistics

**GET** `/api/admin/dashboard`

Get admin dashboard statistics

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Dashboard statistics retrieved successfully",
  "statusCode": 200,
  "data": {
    "totalUsers": 250,
    "pendingApprovals": 15,
    "approvedUsers": 220,
    "rejectedUsers": 15,
    "totalProducts": 5000,
    "activePackages": 180,
    "revenue": {
      "total": 125000,
      "thisMonth": 15000
    }
  }
}
```

### 2. Get Pending Users

**GET** `/api/admin/users/pending`

Get list of users pending approval

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Pending users retrieved successfully",
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5b1",
        "name": "John Doe",
        "email": "john@example.com",
        "company_name": "Diamond Corp",
        "phone_no": "+1234567890",
        "uid": "LNX1001",
        "approval_status": "pending",
        "id_proof": "https://s3.amazonaws.com/bucket/id-proof/file.pdf",
        "createdAt": "2025-10-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalUsers": 15,
      "limit": 10
    }
  }
}
```

### 3. Get All Users

**GET** `/api/admin/users`

Get all users with filtering options

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by approval status (pending/approved/rejected)
- `role` (string, optional): Filter by role (seller/admin)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Users retrieved successfully",
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5b1",
        "name": "John Doe",
        "email": "john@example.com",
        "company_name": "Diamond Corp",
        "uid": "LNX1001",
        "role": "seller",
        "approval_status": "approved",
        "is_active": true,
        "createdAt": "2025-10-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 13,
      "totalUsers": 250,
      "limit": 20
    }
  }
}
```

### 4. Approve/Reject User

**POST** `/api/admin/users/approve`

Approve or reject a user registration

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "userId": "60d5ec49f1b2c8b5f8e4a5b1",
  "status": "approved",
  "reason": "All documents verified successfully"
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "User approved successfully",
  "statusCode": 200,
  "data": {
    "userId": "60d5ec49f1b2c8b5f8e4a5b1",
    "email": "john@example.com",
    "name": "John Doe",
    "status": "approved",
    "approvedBy": "Admin Name",
    "approvedAt": "2025-10-17T10:30:00.000Z",
    "reason": "All documents verified successfully"
  }
}
```

### 5. Update User Role

**PUT** `/api/admin/users/:userId/role`

Update user's role (admin/seller)

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "role": "admin",
  "reason": "Promoted to admin for management duties"
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "User role updated successfully",
  "statusCode": 200,
  "data": {
    "userId": "60d5ec49f1b2c8b5f8e4a5b1",
    "email": "john@example.com",
    "name": "John Doe",
    "oldRole": "seller",
    "newRole": "admin",
    "updatedBy": "Super Admin",
    "updatedAt": "2025-10-17T10:30:00.000Z",
    "reason": "Promoted to admin for management duties"
  }
}
```

### 6. Get Users With Files

**GET** `/api/admin/users/with-files`

Get users with file filtering options

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `hasFiles` (boolean, optional): Filter by file presence (true/false)
- `approvalStatus` (string, optional): Filter by approval status

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Users retrieved successfully",
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5b1",
        "name": "John Doe",
        "email": "john@example.com",
        "id_proof": "https://s3.amazonaws.com/bucket/id-proof/file.pdf",
        "hasIdProof": true,
        "approval_status": "pending"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20
    }
  }
}
```

### 7. Get All Packages

**GET** `/api/admin/packages`

Get all packages (admin management)

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Packages retrieved successfully",
  "statusCode": 200,
  "data": {
    "total": 5,
    "packages": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5c1",
        "name": "Basic Monthly",
        "amount": 99,
        "pack_type": "monthly",
        "duration_days": 30,
        "max_products": 100,
        "features": ["Feature 1", "Feature 2"],
        "is_active": true,
        "createdAt": "2025-10-01T10:30:00.000Z"
      }
    ]
  }
}
```

### 8. Create Package

**POST** `/api/admin/packages`

Create a new package

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Premium Monthly",
  "amount": 199,
  "pack_type": "monthly",
  "duration_days": 30,
  "max_products": 500,
  "features": [
    "500 Product Listings",
    "Priority Support",
    "Advanced Analytics"
  ]
}
```

**Response (201 Created):**
```json
{
  "status": true,
  "message": "Package created successfully",
  "statusCode": 201,
  "data": {
    "_id": "60d5ec49f1b2c8b5f8e4a5c2",
    "name": "Premium Monthly",
    "amount": 199,
    "pack_type": "monthly",
    "duration_days": 30,
    "max_products": 500,
    "features": [
      "500 Product Listings",
      "Priority Support",
      "Advanced Analytics"
    ],
    "is_active": true,
    "createdAt": "2025-10-17T10:30:00.000Z"
  }
}
```

### 9. Update Package

**PUT** `/api/admin/packages/:id`

Update an existing package

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Premium Monthly Plus",
  "amount": 249,
  "max_products": 750,
  "features": [
    "750 Product Listings",
    "Priority Support",
    "Advanced Analytics",
    "API Access"
  ]
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Package updated successfully",
  "statusCode": 200,
  "data": {
    "_id": "60d5ec49f1b2c8b5f8e4a5c2",
    "name": "Premium Monthly Plus",
    "amount": 249,
    "pack_type": "monthly",
    "duration_days": 30,
    "max_products": 750,
    "features": [
      "750 Product Listings",
      "Priority Support",
      "Advanced Analytics",
      "API Access"
    ],
    "is_active": true,
    "updatedAt": "2025-10-17T11:00:00.000Z"
  }
}
```

### 10. Delete Package

**DELETE** `/api/admin/packages/:id`

Delete a package

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Package deleted successfully",
  "statusCode": 200,
  "data": {
    "id": "60d5ec49f1b2c8b5f8e4a5c2",
    "name": "Premium Monthly Plus"
  }
}
```

---

## Product Routes (API)

Base path: `/api`

### 1. Get Public Products (No Authentication Required)

**POST** `/api/public/products`

Get all products from users with valid active packages. This is a public endpoint that doesn't require authentication.

**Query Parameters (Pagination only):**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Request Body:**
```json
{
  "filters": [
    {
      "field": "shape",
      "operation": "in",
      "value": ["Round", "Princess"]
    },
    {
      "field": "color",
      "operation": "equals",
      "value": "D"
    },
    {
      "field": "carat",
      "operation": "between",
      "value": [1.0, 2.0]
    },
    {
      "field": "total_price",
      "operation": "lte",
      "value": 50000
    }
  ],
  "search": "GIA",
  "sortBy": "total_price",
  "sortOrder": "asc"
}
```

**All body fields are optional**

**Available Filter Operations:**
- `equals` / `eq` - Exact match
- `notEquals` / `ne` - Not equal to
- `contains` - Contains text (case-insensitive)
- `notContains` - Does not contain text
- `startsWith` - Starts with text
- `endsWith` - Ends with text
- `in` - Value is in array
- `notIn` - Value not in array
- `gt` / `greaterThan` - Greater than
- `gte` / `greaterThanOrEqual` - Greater than or equal
- `lt` / `lessThan` - Less than
- `lte` / `lessThanOrEqual` - Less than or equal
- `between` / `range` - Between two values [min, max]
- `exists` - Field exists (true/false)
- `regex` - Regular expression match

**Searchable Fields (Global Search):**
All text fields are searchable when using the `search` parameter:
- stock_id, product_id, pid
- shape, color, clarity, cut, polish, symmetry
- fluorescence, laboratory, growth_type
- certificate_number
- fancy_color, fancy_color_intensity, fancy_color_overtone
- seller_name, seller_company, seller_location, seller_email
- measurements

**Filterable Fields:**
You can apply filters to any product field:
- String fields: stock_id, product_id, pid, shape, color, clarity, cut, polish, symmetry, fluorescence, laboratory, growth_type, fancy_color, fancy_color_intensity, fancy_color_overtone, seller_name, seller_company, seller_location, certificate_number, measurements
- Numeric fields: carat, price_per_carat, total_price, depth_percentage, table_percentage

**Example Requests:**

1. **Filter by multiple shapes:**
```json
{
  "filters": [
    {
      "field": "shape",
      "operation": "in",
      "value": ["Round", "Princess", "Oval"]
    }
  ]
}
```

2. **Filter by price range:**
```json
{
  "filters": [
    {
      "field": "total_price",
      "operation": "between",
      "value": [10000, 50000]
    }
  ]
}
```

3. **Filter by exact color:**
```json
{
  "filters": [
    {
      "field": "color",
      "operation": "equals",
      "value": "D"
    }
  ]
}
```

4. **Combined filters:**
```json
{
  "filters": [
    {
      "field": "shape",
      "operation": "in",
      "value": ["Round", "Princess"]
    },
    {
      "field": "color",
      "operation": "equals",
      "value": "D"
    },
    {
      "field": "carat",
      "operation": "between",
      "value": [1.0, 2.0]
    },
    {
      "field": "cut",
      "operation": "equals",
      "value": "Excellent"
    },
    {
      "field": "laboratory",
      "operation": "in",
      "value": ["GIA", "IGI"]
    }
  ],
  "sortBy": "total_price",
  "sortOrder": "asc"
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5d1",
        "pid": "PID0001",
        "product_id": "LNX1001_STOCK001",
        "stock_id": "STOCK001",
        "shape": "Round",
        "carat": 1.5,
        "color": "D",
        "clarity": "VVS1",
        "cut": "Excellent",
        "polish": "Excellent",
        "symmetry": "Excellent",
        "fluorescence": "None",
        "laboratory": "GIA",
        "certificate_number": "123456789",
        "depth_percentage": 61.5,
        "table_percentage": 57.0,
        "price_per_carat": 10000,
        "total_price": 15000,
        "growth_type": "Natural",
        "video_url": "https://example.com/video.mp4",
        "image_url": "https://example.com/image.jpg",
        "certificate_url": "https://example.com/cert.pdf",
        "measurements": "7.50*7.48*4.62",
        "seller_id": {
          "_id": "60d5ec49f1b2c8b5f8e4a5b1",
          "name": "John Doe",
          "company_name": "Diamond Corp",
          "uid": "LNX1001",
          "email": "john@example.com",
          "phone_no": "+1234567890",
          "whatsapp_no": "+1234567890",
          "location": "New York"
        },
        "createdAt": "2025-10-17T10:30:00.000Z",
        "updatedAt": "2025-10-17T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8
    },
    "filters": {
      "available_shapes": ["Round", "Princess", "Oval", "Cushion", "Emerald"],
      "available_colors": ["D", "E", "F", "G", "H"],
      "available_clarities": ["IF", "VVS1", "VVS2", "VS1", "VS2"],
      "available_cuts": ["Excellent", "Very Good", "Good"],
      "available_polish": ["Excellent", "Very Good", "Good"],
      "available_symmetry": ["Excellent", "Very Good", "Good"],
      "available_fluorescence": ["None", "Faint", "Medium", "Strong"],
      "available_laboratories": ["GIA", "IGI", "HRD"],
      "available_growth_types": ["Natural", "Lab Grown"],
      "price_range": {
        "min": 1000,
        "max": 50000
      },
      "carat_range": {
        "min": 0.5,
        "max": 5.0
      },
      "depth_range": {
        "min": 58.5,
        "max": 64.2
      },
      "table_range": {
        "min": 53.0,
        "max": 62.0
      }
    },
    "total_active_sellers": 45
  }
}
```

**Response (200 OK - No Products):**
```json
{
  "status": true,
  "message": "No products found from users with active packages",
  "data": {
    "products": [],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 0,
      "total_pages": 0
    },
    "filters": {
      "available_shapes": [],
      "available_colors": [],
      "available_clarities": [],
      "available_cuts": [],
      "available_polish": [],
      "available_symmetry": [],
      "available_fluorescence": [],
      "available_laboratories": [],
      "available_growth_types": [],
      "price_range": { "min": 0, "max": 0 },
      "carat_range": { "min": 0, "max": 0 },
      "depth_range": { "min": 0, "max": 0 },
      "table_range": { "min": 0, "max": 0 }
    }
  }
}
```

---

**The following product routes require authentication**

### 2. Create Product

**POST** `/api/add_product`

Create a new product (requires authentication and active package)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "stock_id": "STOCK001",
  "shape": "Round",
  "carat": 1.5,
  "color": "D",
  "clarity": "VVS1",
  "cut": "Excellent",
  "polish": "Excellent",
  "symmetry": "Excellent",
  "fluorescence": "None",
  "laboratory": "GIA",
  "certificate_number": "123456789",
  "depth_percentage": 61.5,
  "table_percentage": 57.0,
  "price_per_carat": 10000,
  "total_price": 15000,
  "growth_type": "Natural",
  "fancy_color": "None",
  "fancy_color_intensity": "None",
  "fancy_color_overtone": "None",
  "seller_name": "John Doe",
  "seller_company": "Diamond Corp",
  "seller_location": "New York",
  "seller_phone": "+1234567890",
  "seller_whatsapp": "+1234567890",
  "seller_email": "john@example.com",
  "video_url": "https://example.com/video.mp4",
  "image_url": "https://example.com/image.jpg",
  "certificate_url": "https://example.com/cert.pdf",
  "measurements": "7.50*7.48*4.62"
}
```

**Response (201 Created):**
```json
{
  "status": true,
  "message": "Product added successfully.",
  "product": {
    "id": "60d5ec49f1b2c8b5f8e4a5d1",
    "pid": "PID0001",
    "product_id": "LNX1001_STOCK001",
    "stock_id": "STOCK001",
    "shape": "Round",
    "carat": 1.5,
    "color": "D",
    "clarity": "VVS1",
    "cut": "Excellent",
    "polish": "Excellent",
    "symmetry": "Excellent",
    "fluorescence": "None",
    "laboratory": "GIA",
    "certificate_number": "123456789",
    "depth_percentage": 61.5,
    "table_percentage": 57.0,
    "price_per_carat": 10000,
    "total_price": 15000,
    "growth_type": "Natural",
    "seller_name": "John Doe",
    "seller_company": "Diamond Corp",
    "seller_location": "New York",
    "seller_id": "60d5ec49f1b2c8b5f8e4a5b1",
    "created_at": "2025-10-17T10:30:00.000Z",
    "updated_at": "2025-10-17T10:30:00.000Z"
  }
}
```

### 3. Get All Products (User's Own)

**GET** `/api/products`

Get all products for authenticated user with pagination

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5d1",
        "pid": "PID0001",
        "product_id": "LNX1001_STOCK001",
        "stock_id": "STOCK001",
        "shape": "Round",
        "carat": 1.5,
        "color": "D",
        "clarity": "VVS1",
        "price_per_carat": 10000,
        "total_price": 15000,
        "createdAt": "2025-10-17T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### 4. Get Single Product

**GET** `/api/products/:id`

Get single product by ID or PID

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Product retrieved successfully",
  "product": {
    "_id": "60d5ec49f1b2c8b5f8e4a5d1",
    "pid": "PID0001",
    "product_id": "LNX1001_STOCK001",
    "stock_id": "STOCK001",
    "shape": "Round",
    "carat": 1.5,
    "color": "D",
    "clarity": "VVS1",
    "cut": "Excellent",
    "polish": "Excellent",
    "symmetry": "Excellent",
    "fluorescence": "None",
    "laboratory": "GIA",
    "certificate_number": "123456789",
    "depth_percentage": 61.5,
    "table_percentage": 57.0,
    "price_per_carat": 10000,
    "total_price": 15000,
    "growth_type": "Natural",
    "seller_name": "John Doe",
    "seller_company": "Diamond Corp",
    "video_url": "https://example.com/video.mp4",
    "image_url": "https://example.com/image.jpg",
    "certificate_url": "https://example.com/cert.pdf",
    "measurements": "7.50*7.48*4.62",
    "seller_id": "60d5ec49f1b2c8b5f8e4a5b1",
    "createdAt": "2025-10-17T10:30:00.000Z",
    "updatedAt": "2025-10-17T10:30:00.000Z"
  }
}
```

### 5. Update Product

**PUT** `/api/update_product/:id`

Update a product by ID or PID

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (Full Update):**
```json
{
  "stock_id": "STOCK001_UPDATED",
  "carat": 1.75,
  "price_per_carat": 12000,
  "total_price": 21000,
  "cut": "Ideal"
}
```

**Request Body (Single Field Update):**
```json
{
  "field": "price_per_carat",
  "value": 12000
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Product updated successfully",
  "product": {
    "_id": "60d5ec49f1b2c8b5f8e4a5d1",
    "pid": "PID0001",
    "product_id": "LNX1001_STOCK001_UPDATED",
    "stock_id": "STOCK001_UPDATED",
    "carat": 1.75,
    "price_per_carat": 12000,
    "total_price": 21000,
    "cut": "Ideal",
    "updatedAt": "2025-10-17T11:00:00.000Z"
  }
}
```

### 6. Delete Product(s)

**DELETE** `/api/delete_product/:id`

Delete one or multiple products (comma-separated IDs)

**Headers:**
```
Authorization: Bearer <token>
```

**Examples:**
- Single: `/api/delete_product/60d5ec49f1b2c8b5f8e4a5d1`
- Multiple: `/api/delete_product/60d5ec49f1b2c8b5f8e4a5d1,60d5ec49f1b2c8b5f8e4a5d2`

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Successfully deleted 2 product(s)",
  "data": {
    "deleted": [
      {
        "id": "60d5ec49f1b2c8b5f8e4a5d1",
        "pid": "PID0001",
        "product_id": "LNX1001_STOCK001",
        "stock_id": "STOCK001"
      },
      {
        "id": "60d5ec49f1b2c8b5f8e4a5d2",
        "pid": "PID0002",
        "product_id": "LNX1001_STOCK002",
        "stock_id": "STOCK002"
      }
    ],
    "not_found": [],
    "total_deleted": 2,
    "total_not_found": 0
  }
}
```

### 7. Get All Packages

**GET** `/api/packages`

Get all active packages available for purchase

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Packages retrieved successfully",
  "data": [
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5c1",
      "name": "Basic Monthly",
      "description": "Perfect for small businesses",
      "amount": 99,
      "pack_type": "monthly",
      "duration_days": 30,
      "max_products": 100,
      "features": [
        "100 Product Listings",
        "Email Support",
        "Basic Analytics"
      ]
    },
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5c2",
      "name": "Premium Monthly",
      "description": "For growing businesses",
      "amount": 199,
      "pack_type": "monthly",
      "duration_days": 30,
      "max_products": 500,
      "features": [
        "500 Product Listings",
        "Priority Support",
        "Advanced Analytics"
      ]
    }
  ]
}
```

### 8. Buy Package

**POST** `/api/buy_package?package_id=<package_id>`

Create Stripe checkout session to purchase a package

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `package_id` (string, required): Package ID to purchase

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Checkout session created successfully",
  "data": {
    "checkout_url": "https://checkout.stripe.com/pay/cs_test_...",
    "session_id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
    "package": {
      "name": "Premium Monthly",
      "price": 199,
      "duration_days": 30
    }
  }
}
```

### 9. Get Package History

**GET** `/api/package_history`

Get user's package purchase history

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Package history retrieved successfully",
  "data": {
    "current_package": {
      "end_date": "2025-11-01T00:00:00.000Z",
      "days_remaining": 15
    },
    "active_packages": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5e1",
        "user_id": "60d5ec49f1b2c8b5f8e4a5b1",
        "pack_id": {
          "_id": "60d5ec49f1b2c8b5f8e4a5c2",
          "name": "Premium Monthly",
          "description": "For growing businesses",
          "price": 199,
          "amount": 199,
          "pack_type": "monthly",
          "features": ["Feature 1", "Feature 2"]
        },
        "payment_id": "PAY_20251017_001",
        "amount": 199,
        "pack_type": "monthly",
        "activated_at": "2025-10-17T00:00:00.000Z"
      }
    ],
    "payment_history": [
      {
        "_id": "60d5ec49f1b2c8b5f8e4a5f1",
        "user_id": "60d5ec49f1b2c8b5f8e4a5b1",
        "pack_id": {
          "_id": "60d5ec49f1b2c8b5f8e4a5c2",
          "name": "Premium Monthly",
          "description": "For growing businesses"
        },
        "payment_id": "PAY_20251017_001",
        "stripe_session_id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
        "amount": 199,
        "currency": "usd",
        "payment_type": "Stripe",
        "payment_status": "succeeded",
        "createdAt": "2025-10-17T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Excel Routes

Base path: `/api`

**All excel routes require authentication (except template download)**

### 1. Download Empty Template

**GET** `/api/download-empty-product-template`

Download an empty Excel template for product import

**Response:**
Excel file download with headers:
- Stock_ID
- Shape
- Carat
- Color
- Clarity
- Cut
- Polish
- Symmetry
- Fluorescence
- Laboratory
- Certificate_Number
- Depth_Percentage
- Table_Percentage
- Price_Per_Carat
- Total_Price
- Growth_Type
- Fancy_Color
- Fancy_Color_Intensity
- Fancy_Color_Overtone
- Measurements
- Video_URL
- Image_URL
- Certificate_URL
- Seller_Name
- Seller_Company
- Seller_Location
- Seller_Phone
- Seller_WhatsApp
- Seller_Email

### 2. Upload Excel File

**POST** `/api/product-check/upload`

Upload Excel file to staging table for validation

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
xml_file: <excel_file>
```

**Response (200 OK):**
```json
{
  "status": true,
  "inserted": 50,
  "errors": [
    {
      "row": 3,
      "stock_id": "STOCK003",
      "errors": {
        "carat": "Carat must be a positive number",
        "color": "Invalid color value"
      }
    },
    {
      "row": 15,
      "stock_id": "STOCK015",
      "errors": {
        "stock_id": "Stock ID already exists"
      }
    }
  ]
}
```

### 3. List Staging Products

**GET** `/api/product-check`

Get all products in staging table for the authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": true,
  "rows": [
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5g1",
      "pid": "PID0051",
      "product_id": "LNX1001_STOCK051",
      "stock_id": "STOCK051",
      "shape": "Round",
      "carat": 1.5,
      "color": "D",
      "clarity": "VVS1",
      "status": "valid",
      "remarks": {
        "message": "All Done"
      },
      "seller_id": "60d5ec49f1b2c8b5f8e4a5b1",
      "createdAt": "2025-10-17T10:30:00.000Z"
    },
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5g2",
      "stock_id": "STOCK052",
      "status": "invalid",
      "remarks": {
        "carat": "Carat is required",
        "color": "Invalid color value"
      },
      "seller_id": "60d5ec49f1b2c8b5f8e4a5b1",
      "createdAt": "2025-10-17T10:30:00.000Z"
    }
  ]
}
```

### 4. Update Staging Product

**POST** `/api/product-check/:id`

Update a staging product and move to products table if valid

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "carat": 1.75,
  "color": "E",
  "price_per_carat": 11000,
  "total_price": 19250
}
```

**Response (Success - 200 OK):**
```json
{
  "status": true,
  "message": "Row moved to products successfully"
}
```

**Response (Invalid - 200 OK):**
```json
{
  "status": false,
  "row": {
    "_id": "60d5ec49f1b2c8b5f8e4a5g2",
    "stock_id": "STOCK052",
    "status": "invalid",
    "remarks": {
      "certificate_number": "Certificate number is required for GIA laboratory"
    }
  }
}
```

### 5. Bulk Save Products

**POST** `/api/save-all`

Save multiple valid products from staging to products table

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rows": [
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5g1",
      "stock_id": "STOCK051",
      "shape": "Round",
      "carat": 1.5,
      "color": "D",
      "clarity": "VVS1",
      "cut": "Excellent",
      "polish": "Excellent",
      "symmetry": "Excellent",
      "price_per_carat": 10000,
      "total_price": 15000
    },
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5g2",
      "stock_id": "STOCK052",
      "shape": "Princess",
      "carat": 2.0,
      "color": "E",
      "clarity": "VVS2"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "saved": 1,
  "invalidRows": [
    {
      "_id": "60d5ec49f1b2c8b5f8e4a5g2",
      "stock_id": "STOCK052",
      "status": "invalid",
      "remarks": {
        "price_per_carat": "Price per carat is required",
        "total_price": "Total price is required"
      }
    }
  ]
}
```

### 6. Save Single Product

**POST** `/api/save_row`

Save a single product directly (manual entry)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "stock_id": "STOCK100",
  "shape": "Round",
  "carat": 1.5,
  "color": "D",
  "clarity": "VVS1",
  "cut": "Excellent",
  "polish": "Excellent",
  "symmetry": "Excellent",
  "fluorescence": "None",
  "laboratory": "GIA",
  "certificate_number": "123456789",
  "depth_percentage": 61.5,
  "table_percentage": 57.0,
  "price_per_carat": 10000,
  "total_price": 15000,
  "growth_type": "Natural",
  "measurements": "7.50*7.48*4.62"
}
```

**Response (201 Created):**
```json
{
  "status": true,
  "message": "Product created successfully",
  "statusCode": 201,
  "data": {
    "_id": "60d5ec49f1b2c8b5f8e4a5h1",
    "pid": "PID0100",
    "product_id": "LNX1001_STOCK100",
    "stock_id": "STOCK100",
    "shape": "Round",
    "carat": 1.5,
    "color": "D",
    "clarity": "VVS1",
    "price_per_carat": 10000,
    "total_price": 15000,
    "seller_id": "60d5ec49f1b2c8b5f8e4a5b1",
    "createdAt": "2025-10-17T10:30:00.000Z"
  }
}
```

### 7. Update Product

**PUT** `/api/products/:id`

Update an existing product

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (Full Update):**
```json
{
  "carat": 1.75,
  "price_per_carat": 12000,
  "color": "E"
}
```

**Request Body (Single Field):**
```json
{
  "field": "price_per_carat",
  "value": 12000
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Product updated successfully",
  "statusCode": 200,
  "data": {
    "_id": "60d5ec49f1b2c8b5f8e4a5h1",
    "pid": "PID0100",
    "product_id": "LNX1001_STOCK100",
    "stock_id": "STOCK100",
    "carat": 1.75,
    "price_per_carat": 12000,
    "total_price": 21000,
    "updatedAt": "2025-10-17T11:00:00.000Z"
  }
}
```

### 8. Export Products to Excel

**GET** `/api/export_excel`

Export all products to Excel file

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
Excel file download with all user's products

### 9. Delete Staging Product(s)

**DELETE** `/api/delete_product_check/:id`

Delete one or multiple staging products (comma-separated IDs)

**Headers:**
```
Authorization: Bearer <token>
```

**Examples:**
- Single: `/api/delete_product_check/60d5ec49f1b2c8b5f8e4a5g1`
- Multiple: `/api/delete_product_check/60d5ec49f1b2c8b5f8e4a5g1,60d5ec49f1b2c8b5f8e4a5g2`

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Successfully deleted 2 staging product(s)",
  "data": {
    "deleted": [
      {
        "id": "60d5ec49f1b2c8b5f8e4a5g1",
        "pid": "PID0051",
        "product_id": "LNX1001_STOCK051",
        "stock_id": "STOCK051",
        "status": "valid"
      },
      {
        "id": "60d5ec49f1b2c8b5f8e4a5g2",
        "stock_id": "STOCK052",
        "status": "invalid"
      }
    ],
    "not_found": [],
    "total_deleted": 2,
    "total_not_found": 0
  }
}
```

### 10. Bulk Delete Staging Products

**POST** `/api/bulk_delete_product_check`

Delete multiple staging products using array of IDs

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "ids": [
    "60d5ec49f1b2c8b5f8e4a5g1",
    "60d5ec49f1b2c8b5f8e4a5g2",
    "60d5ec49f1b2c8b5f8e4a5g3"
  ]
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Successfully deleted 3 staging product(s)",
  "data": {
    "deleted": [
      {
        "id": "60d5ec49f1b2c8b5f8e4a5g1",
        "pid": "PID0051",
        "product_id": "LNX1001_STOCK051",
        "stock_id": "STOCK051",
        "status": "valid"
      },
      {
        "id": "60d5ec49f1b2c8b5f8e4a5g2",
        "stock_id": "STOCK052",
        "status": "invalid"
      },
      {
        "id": "60d5ec49f1b2c8b5f8e4a5g3",
        "pid": "PID0053",
        "product_id": "LNX1001_STOCK053",
        "stock_id": "STOCK053",
        "status": "valid"
      }
    ],
    "not_found": [],
    "total_deleted": 3,
    "total_not_found": 0
  }
}
```

---

## Webhook Routes

Base path: `/webhooks`

### 1. Stripe Webhook

**POST** `/webhooks/stripe`

Handle Stripe webhook events for payment processing

**Headers:**
```
Content-Type: application/json
stripe-signature: <stripe_signature>
```

**Request Body:**
Stripe event payload (automatically sent by Stripe)

**Events Handled:**
- `checkout.session.completed` - When payment is successful
- `payment_intent.succeeded` - When payment intent succeeds
- `payment_intent.payment_failed` - When payment fails

**Response (200 OK):**
```json
{
  "received": true
}
```

**Note:** This endpoint is called automatically by Stripe. You need to configure the webhook URL in your Stripe dashboard.

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": false,
  "message": "Invalid request parameters",
  "statusCode": 400,
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized
```json
{
  "status": false,
  "message": "Authentication required",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "status": false,
  "message": "Admin access required",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "status": false,
  "message": "Resource not found",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "status": false,
  "message": "Resource already exists",
  "statusCode": 409
}
```

### 422 Validation Error
```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "field1": "Error message 1",
    "field2": "Error message 2"
  }
}
```

### 500 Internal Server Error
```json
{
  "status": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## Common Headers

### Authentication
```
Authorization: Bearer <jwt_token>
```

### Content Type
```
Content-Type: application/json
```

## Notes

1. **Authentication**: All routes except `/health`, `/api/users/register`, `/api/users/login`, and `/api/download-empty-product-template` require authentication.

2. **Admin Routes**: All routes under `/api/admin` require both authentication and admin role.

3. **Package Validation**: Product creation and manipulation routes check if the user has an active (non-expired) package.

4. **File Uploads**: Files are uploaded to S3. The `fileDetails` array should contain base64-encoded file content.

5. **Pagination**: Most list endpoints support pagination with `page` and `limit` query parameters.

6. **Product ID Format**: Product IDs are automatically generated as `{user_uid}_{stock_id}`.


---

## Environment Variables Required

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/labnetxl
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
NODE_ENV=development
```