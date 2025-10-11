# API Testing Guide - LabnetXL Backend

Complete API documentation with JSON examples for testing all endpoints.

## Base URL
```
http://localhost:3000
```

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User APIs](#user-apis)
3. [Admin APIs](#admin-apis)
4. [Admin Package Management APIs](#admin-package-management-apis)
5. [Product APIs](#product-apis)
6. [Package APIs](#package-apis)

---

## Authentication APIs

### 1. Health Check
**GET** `/health`

**Headers:** None required

**Response:**
```json
{
  "status": "OK",
  "message": "LabnetXL Backend API is running",
  "timestamp": "2025-10-09T12:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. User Registration
**POST** `/api/users/register`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "company_name": "Diamond Trading Co.",
  "location": "New York, USA",
  "phone_no": "+1234567890",
  "whatsapp_no": "+1234567890",
  "password": "SecurePass123!",
  "vat_number": "VAT123456789"
}
```

**Success Response (201):**
```json
{
  "status": true,
  "message": "User registered successfully. Awaiting admin approval.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "uid": "UID1234567890",
    "approval_status": "pending"
  }
}
```

### 3. User Login
**POST** `/api/users/login`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "approval_status": "approved"
  }
}
```

---

## User APIs

**Note:** All user APIs require authentication token in headers:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### 4. Get User Profile
**GET** `/api/users/profile`

**Success Response (200):**
```json
{
  "status": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "company_name": "Diamond Trading Co.",
    "location": "New York, USA",
    "phone_no": "+1234567890",
    "whatsapp_no": "+1234567890",
    "uid": "UID1234567890",
    "kyc": 0,
    "role": "user",
    "approval_status": "approved",
    "pack_end_date": "2025-11-09T00:00:00.000Z",
    "createdAt": "2025-10-09T10:00:00.000Z"
  }
}
```

### 5. Update User Profile
**PUT** `/api/users/profile`

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "company_name": "Diamond Trading International",
  "location": "Los Angeles, USA",
  "phone_no": "+1987654321",
  "whatsapp_no": "+1987654321"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Updated Doe",
    "email": "john.doe@example.com",
    "company_name": "Diamond Trading International",
    "location": "Los Angeles, USA"
  }
}
```

---

## Admin APIs

**Note:** All admin APIs require admin authentication token:
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### 6. Admin Login
**POST** `/api/admin/login`

**Request Body:**
```json
{
  "email": "admin@labnetxl.com",
  "password": "AdminPass123!"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@labnetxl.com",
    "role": "admin"
  }
}
```

### 7. Get All Users (Admin)
**GET** `/api/admin/users?page=1&limit=10&status=pending`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): pending | approved | rejected

**Success Response (200):**
```json
{
  "status": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "company_name": "Diamond Trading Co.",
        "approval_status": "pending",
        "createdAt": "2025-10-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10
    }
  }
}
```

### 8. Approve User (Admin)
**PUT** `/api/admin/users/:userId/approve`

**Request Body:**
```json
{
  "approval_status": "approved"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "User approved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "approval_status": "approved",
    "approved_at": "2025-10-09T12:00:00.000Z"
  }
}
```

### 9. Reject User (Admin)
**PUT** `/api/admin/users/:userId/approve`

**Request Body:**
```json
{
  "approval_status": "rejected",
  "rejection_reason": "Invalid documents provided"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "User rejected successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "approval_status": "rejected",
    "rejection_reason": "Invalid documents provided"
  }
}
```

---

## Admin Package Management APIs

**Note:** All admin package management APIs require admin authentication token.

### 9. Get All Packages (Admin)
**GET** `/api/admin/packages`

**Headers:**
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Packages retrieved successfully",
  "data": {
    "total": 3,
    "packages": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Basic Plan",
        "amount": 2999,
        "pack_type": "basic",
        "duration_days": 30,
        "max_products": 100,
        "features": [
          "100 product listings",
          "Basic analytics",
          "Email support"
        ],
        "createdAt": "2025-10-09T10:00:00.000Z",
        "updatedAt": "2025-10-09T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Premium Plan",
        "amount": 5999,
        "pack_type": "premium",
        "duration_days": 30,
        "max_products": 500,
        "features": [
          "500 product listings",
          "Advanced analytics",
          "Priority support",
          "API access"
        ],
        "createdAt": "2025-10-09T10:00:00.000Z",
        "updatedAt": "2025-10-09T10:00:00.000Z"
      }
    ]
  }
}
```

### 10. Create Package (Admin)
**POST** `/api/admin/packages`

**Headers:**
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "Enterprise Plan",
  "amount": 9999,
  "pack_type": "monthly",
  "duration_days": 90,
  "max_products": 1000,
  "features": [
    "1000 product listings",
    "Premium analytics",
    "24/7 dedicated support",
    "API access",
    "Custom integrations"
  ]
}
```

**Field Descriptions:**
- `name` (required, string): Package name
- `amount` (required, number): Price in cents (e.g., 9999 = $99.99)
- `pack_type` (required, string): One of: `daily`, `weekly`, `monthly`, `yearly`, `one-time`
- `duration_days` (required, number): Package validity in days (minimum: 1)
- `max_products` (optional, number): Maximum products allowed
- `features` (optional, array): List of features included

**Success Response (201):**
```json
{
  "status": true,
  "message": "Package created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Enterprise Plan",
    "amount": 9999,
    "pack_type": "enterprise",
    "duration_days": 90,
    "max_products": 1000,
    "features": [
      "1000 product listings",
      "Premium analytics",
      "24/7 dedicated support",
      "API access",
      "Custom integrations"
    ],
    "createdAt": "2025-10-09T12:00:00.000Z",
    "updatedAt": "2025-10-09T12:00:00.000Z"
  }
}
```

**Error Response (400 - Validation Error):**
```json
{
  "status": false,
  "message": "Name, amount, pack_type, and duration_days are required"
}
```

**Error Response (400 - Duplicate Name):**
```json
{
  "status": false,
  "message": "Package with this name already exists"
}
```

**Error Response (400 - Invalid Pack Type):**
```json
{
  "status": false,
  "message": "Pack type must be one of: free, basic, premium, enterprise"
}
```

### 11. Update Package (Admin)
**PUT** `/api/admin/packages/:id`

**Headers:**
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body (all fields optional):**
```json
{
  "name": "Premium Plan Plus",
  "amount": 6999,
  "duration_days": 60,
  "max_products": 750,
  "features": [
    "750 product listings",
    "Advanced analytics",
    "Priority support",
    "API access",
    "Extended features"
  ]
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Package updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Premium Plan Plus",
    "amount": 6999,
    "pack_type": "premium",
    "duration_days": 60,
    "max_products": 750,
    "features": [
      "750 product listings",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Extended features"
    ],
    "createdAt": "2025-10-09T10:00:00.000Z",
    "updatedAt": "2025-10-09T14:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "status": false,
  "message": "Package not found"
}
```

### 12. Delete Package (Admin)
**DELETE** `/api/admin/packages/:id`

**Headers:**
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Package deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Enterprise Plan"
  }
}
```

**Error Response (404):**
```json
{
  "status": false,
  "message": "Package not found"
}
```

---

## Product APIs

**Note:** All product APIs require user authentication token.

### 13. Create Product
**POST** `/api/add_product`

**Request Body:**
```json
{
  "stock_id": "STK123456",
  "shape": "Round",
  "carat": 1.50,
  "color": "D",
  "clarity": "VVS1",
  "cut": "Excellent",
  "polish": "Excellent",
  "symmetry": "Excellent",
  "fluorescence": "None",
  "laboratory": "GIA",
  "certificate_number": "GIA1234567890",
  "depth_percentage": 61.5,
  "table_percentage": 57.0,
  "price_per_carat": 8500.00,
  "total_price": 12750.00,
  "growth_type": "Natural",
  "fancy_color": "None",
  "fancy_color_intensity": "Faint",
  "fancy_color_overtone": "None",
  "seller_name": "John Doe",
  "seller_company": "Diamond Trading Co.",
  "seller_location": "New York, USA",
  "seller_phone": "+1234567890",
  "seller_whatsapp": "+1234567890",
  "seller_email": "john.doe@example.com",
  "video_url": "https://example.com/videos/diamond123.mp4",
  "image_url": "https://example.com/images/diamond123.jpg",
  "certificate_url": "https://example.com/certificates/GIA1234567890.pdf",
  "measurements": "07.45*07.42*04.58"
}
```

**Success Response (201):**
```json
{
  "status": true,
  "message": "Product added successfully.",
  "product": {
    "id": "507f1f77bcf86cd799439011",
    "pid": "1234567890123456",
    "product_id": "PROD1234567890",
    "stock_id": "STK123456",
    "shape": "Round",
    "carat": 1.5,
    "color": "D",
    "clarity": "VVS1",
    "cut": "Excellent",
    "polish": "Excellent",
    "symmetry": "Excellent",
    "total_price": 12750,
    "createdAt": "2025-10-09T12:00:00.000Z"
  }
}
```

**Error Response (403 - No Active Package):**
```json
{
  "status": false,
  "message": "You can add products only after buying a package."
}
```

**Error Response (403 - Package Expired):**
```json
{
  "status": false,
  "message": "Your package has expired. Please buy a package first."
}
```

### 14. Get All Products (User's Products)
**GET** `/api/products?page=1&limit=10`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response (200):**
```json
{
  "status": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "507f1f77bcf86cd799439011",
        "pid": "1234567890123456",
        "product_id": "PROD1234567890",
        "stock_id": "STK123456",
        "shape": "Round",
        "carat": 1.5,
        "color": "D",
        "clarity": "VVS1",
        "cut": "Excellent",
        "total_price": 12750,
        "image_url": "https://example.com/images/diamond123.jpg",
        "createdAt": "2025-10-09T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalProducts": 25,
      "limit": 10
    }
  }
}
```

### 15. Get Single Product
**GET** `/api/products/:id`

**Success Response (200):**
```json
{
  "status": true,
  "message": "Product retrieved successfully",
  "product": {
    "id": "507f1f77bcf86cd799439011",
    "pid": "1234567890123456",
    "product_id": "PROD1234567890",
    "stock_id": "STK123456",
    "shape": "Round",
    "carat": 1.5,
    "color": "D",
    "clarity": "VVS1",
    "cut": "Excellent",
    "polish": "Excellent",
    "symmetry": "Excellent",
    "fluorescence": "None",
    "laboratory": "GIA",
    "certificate_number": "GIA1234567890",
    "depth_percentage": 61.5,
    "table_percentage": 57,
    "price_per_carat": 8500,
    "total_price": 12750,
    "growth_type": "Natural",
    "fancy_color": "None",
    "fancy_color_intensity": "Faint",
    "fancy_color_overtone": "None",
    "seller_name": "John Doe",
    "seller_company": "Diamond Trading Co.",
    "seller_location": "New York, USA",
    "seller_phone": "+1234567890",
    "seller_whatsapp": "+1234567890",
    "seller_email": "john.doe@example.com",
    "video_url": "https://example.com/videos/diamond123.mp4",
    "image_url": "https://example.com/images/diamond123.jpg",
    "certificate_url": "https://example.com/certificates/GIA1234567890.pdf",
    "measurements": "07.45*07.42*04.58",
    "createdAt": "2025-10-09T12:00:00.000Z",
    "updatedAt": "2025-10-09T12:00:00.000Z"
  }
}
```

### 16. Update Product
**PUT** `/api/products/:id`

**Request Body:** (All fields optional)
```json
{
  "price_per_carat": 9000.00,
  "total_price": 13500.00,
  "video_url": "https://example.com/videos/diamond123-updated.mp4",
  "image_url": "https://example.com/images/diamond123-updated.jpg"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Product updated successfully",
  "product": {
    "id": "507f1f77bcf86cd799439011",
    "price_per_carat": 9000,
    "total_price": 13500,
    "video_url": "https://example.com/videos/diamond123-updated.mp4",
    "updatedAt": "2025-10-09T13:00:00.000Z"
  }
}
```

### 17. Delete Product
**DELETE** `/api/products/:id`

**Success Response (200):**
```json
{
  "status": true,
  "message": "Product deleted successfully"
}
```

---

## Package APIs

### 18. Get All Available Packages
**GET** `/api/packages`

**Success Response (200):**
```json
{
  "status": true,
  "message": "Packages retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Basic Plan",
      "description": "Perfect for small businesses",
      "amount": 29.99,
      "pack_type": "monthly",
      "duration_days": 30,
      "max_products": 100,
      "features": [
        "100 product listings",
        "Basic analytics",
        "Email support"
      ]
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Professional Plan",
      "description": "For growing businesses",
      "amount": 79.99,
      "pack_type": "monthly",
      "duration_days": 30,
      "max_products": 500,
      "features": [
        "500 product listings",
        "Advanced analytics",
        "Priority support",
        "API access"
      ]
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Enterprise Plan",
      "description": "For large scale operations",
      "amount": 199.99,
      "pack_type": "monthly",
      "duration_days": 30,
      "max_products": null,
      "features": [
        "Unlimited product listings",
        "Premium analytics",
        "24/7 dedicated support",
        "Full API access",
        "Custom integrations"
      ]
    }
  ]
}
```

### 19. Buy Package (Create Stripe Checkout)
**POST** `/api/buy_package`

**Request Body:**
```json
{
  "package_id": "507f1f77bcf86cd799439011"
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Checkout session created successfully",
  "data": {
    "checkout_url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0",
    "session_id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
    "package": {
      "name": "Basic Plan",
      "amount": 29.99,
      "duration_days": 30
    }
  }
}
```

**Error Response (400 - Already Has Active Package):**
```json
{
  "status": false,
  "message": "You already have an active package. Please wait for it to expire before purchasing a new one."
}
```

### 20. Get Package History
**GET** `/api/package_history`

**Success Response (200):**
```json
{
  "status": true,
  "message": "Package history retrieved successfully",
  "data": {
    "current_package": {
      "end_date": "2025-11-09T00:00:00.000Z",
      "days_remaining": 30
    },
    "active_packages": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "package_id": {
          "name": "Basic Plan",
          "description": "Perfect for small businesses",
          "amount": 29.99,
          "features": [
            "100 product listings",
            "Basic analytics",
            "Email support"
          ]
        },
        "purchased_at": "2025-10-09T12:00:00.000Z",
        "expires_at": "2025-11-09T12:00:00.000Z",
        "is_active": true
      }
    ],
    "payment_history": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "package_id": {
          "name": "Basic Plan",
          "description": "Perfect for small businesses"
        },
        "amount": 29.99,
        "currency": "USD",
        "payment_status": "completed",
        "payment_type": "Stripe",
        "created_at": "2025-10-09T12:00:00.000Z",
        "completed_at": "2025-10-09T12:05:00.000Z"
      }
    ]
  }
}
```

---

## Postman Collection

You can import this cURL collection into Postman:

### Test Sequence

1. **Register User**
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company_name": "Test Company",
    "location": "Test City",
    "phone_no": "+1234567890",
    "password": "Test123!",
    "vat_number": "VAT123"
  }'
```

2. **Admin Login**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@labnetxl.com",
    "password": "admin123"
  }'
```

3. **Approve User (Admin)**
```bash
curl -X PUT http://localhost:5000/api/admin/users/USER_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_status": "approved"
  }'
```

4. **User Login**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

5. **Get Available Packages**
```bash
curl -X GET http://localhost:5000/api/packages \
  -H "Authorization: Bearer USER_TOKEN"
```

6. **Buy Package**
```bash
curl -X POST http://localhost:5000/api/buy_package \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": "PACKAGE_ID"
  }'
```

7. **Create Product**
```bash
curl -X POST http://localhost:5000/api/add_product \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock_id": "STK001",
    "shape": "Round",
    "carat": 1.5,
    "color": "D",
    "clarity": "VVS1",
    "cut": "Excellent",
    "polish": "Excellent",
    "symmetry": "Excellent",
    "fluorescence": "None",
    "laboratory": "GIA",
    "certificate_number": "GIA123",
    "depth_percentage": 61.5,
    "table_percentage": 57.0,
    "price_per_carat": 8500,
    "total_price": 12750,
    "growth_type": "Natural",
    "fancy_color": "None",
    "fancy_color_intensity": "Faint",
    "fancy_color_overtone": "None",
    "seller_name": "Test User",
    "seller_company": "Test Company",
    "seller_location": "Test City",
    "seller_phone": "+1234567890",
    "seller_whatsapp": "+1234567890",
    "seller_email": "test@example.com",
    "video_url": "https://example.com/video.mp4",
    "image_url": "https://example.com/image.jpg",
    "certificate_url": "https://example.com/cert.pdf",
    "measurements": "07.45*07.42*04.58"
  }'
```

8. **Get All Products**
```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer USER_TOKEN"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "status": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "status": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "status": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": false,
  "message": "Internal server error"
}
```

---

## Notes

1. Replace `YOUR_JWT_TOKEN` with actual token received from login
2. Replace `:id` or `USER_ID` with actual MongoDB ObjectId
3. All timestamps are in ISO 8601 format
4. Package purchase redirects to Stripe checkout page
5. Make sure MongoDB is running before testing
6. Ensure environment variables are configured

---

Last Updated: October 9, 2025