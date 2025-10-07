# LabnetXL Admin Approval System - Testing Guide

## 🔐 Admin Approval System Overview

The LabnetXL backend now includes an admin approval system where:
1. **New users register** but cannot login until approved
2. **Admin reviews** pending registrations
3. **Admin approves/rejects** users
4. **Approved users** can login normally
5. **Rejected users** cannot login

---

## 👨‍💼 Default Admin Account

**Default admin credentials are automatically created:**
- **Email**: `admin@labnetxl.com`
- **Password**: `Admin@123456`
- **Role**: `admin`
- **Status**: `approved` (auto-approved)

---

# 🧪 Complete Testing Workflow

## **Step 1: Start Server & Create Admin**
```bash
cd /home/shivam/Desktop/labnetxl-backend
npm run dev
```

The server will automatically create the default admin account on startup.

## **Step 2: Login as Admin**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@labnetxl.com",
    "password": "Admin@123456"
  }'
```

**Save the admin JWT token from the response!**

## **Step 3: Register a New User (Will be Pending)**
```bash
curl -X POST http://localhost:5000/api/users/register \
  -F "name=Test User" \
  -F "company_name=Test Company" \
  -F "location=Test City" \
  -F "email=testuser@example.com" \
  -F "password=TestPass123!" \
  -F "phone_number=1234567890" \
  -F "vat_number=VAT123" \
  -F "id_proof=@/path/to/test_file.jpg"
```

**Response will include `approval_status: "pending"`**

## **Step 4: Try to Login as New User (Should Fail)**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Error**: `"Your account is pending admin approval"`

## **Step 5: Get Pending Users (Admin Only)**
```bash
curl -X GET http://localhost:5000/api/admin/users/pending \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN_HERE"
```

## **Step 6: Approve the User (Admin Only)**
```bash
curl -X POST http://localhost:5000/api/admin/users/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_FROM_PENDING_LIST",
    "status": "approved"
  }'
```

## **Step 7: Login as Approved User (Should Work)**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Now it should work!**

---

# 📋 Admin API Endpoints

## **1. Admin Dashboard Statistics**

### **GET /api/admin/dashboard**
```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalUsers": 5,
    "pendingUsers": 2,
    "approvedUsers": 2,
    "rejectedUsers": 1,
    "recentUsers": [
      {
        "_id": "user_id",
        "name": "Recent User",
        "email": "recent@example.com",
        "company_name": "Company",
        "approval_status": "pending",
        "createdAt": "2025-10-07T10:30:00.000Z"
      }
    ]
  }
}
```

---

## **2. Get Pending Users**

### **GET /api/admin/users/pending**
```bash
curl -X GET "http://localhost:5000/api/admin/users/pending?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "message": "Pending users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "company_name": "ABC Corp",
        "location": "New York",
        "phone_no": "1234567890",
        "uid": "LNX123456",
        "approval_status": "pending",
        "createdAt": "2025-10-07T10:30:00.000Z"
      }
    ],
    "total": 3,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

---

## **3. Get All Users (with filtering)**

### **GET /api/admin/users**
```bash
# Get all users
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get only approved users
curl -X GET "http://localhost:5000/api/admin/users?status=approved" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get only rejected users
curl -X GET "http://localhost:5000/api/admin/users?status=rejected" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Query Parameters:**
- `status` (optional): Filter by approval status (`pending`, `approved`, `rejected`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

---

## **4. Approve/Reject Users**

### **POST /api/admin/users/approve**

#### **Approve a User:**
```bash
curl -X POST http://localhost:5000/api/admin/users/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "status": "approved"
  }'
```

#### **Reject a User:**
```bash
curl -X POST http://localhost:5000/api/admin/users/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "status": "rejected",
    "rejectionReason": "Incomplete documentation provided"
  }'
```

**Request Body:**
```json
{
  "userId": "string (required)",
  "status": "approved | rejected (required)",
  "rejectionReason": "string (required if status is rejected, min 5 chars)"
}
```

**Success Response:**
```json
{
  "message": "User approved successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "status": "approved",
    "approvedBy": "LabnetXL Admin",
    "approvedAt": "2025-10-07T10:35:00.000Z"
  }
}
```

---

# 🔄 User Registration Response Changes

## **New Registration Response**
When users register, they now get:

```json
{
  "message": "User registered successfully. Your account is pending admin approval.",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "company_name": "ABC Corporation",
      "location": "New York, USA",
      "phone_no": "+1234567890",
      "whatsapp_no": "+1234567890",
      "uid": "LNX123456",
      "kyc": 1,
      "vat_number": "VAT123456789",
      "id_proof": "uploads/user/123_1696680000000_id_document.jpg",
      "approval_status": "pending"  // NEW FIELD
    },
    "token": "jwt_token_here"
  }
}
```

---

# 🚫 Login Error Messages

## **For Pending Users:**
```json
{
  "message": "Your account is pending admin approval"
}
```

## **For Rejected Users:**
```json
{
  "message": "Your account has been rejected. Please contact admin"
}
```

---

# 📱 Postman Testing Collection

## **Create Admin Environment:**
1. Create new environment "LabnetXL Admin"
2. Add variables:
   - `baseUrl` = `http://localhost:5000`
   - `adminToken` = `ADMIN_JWT_TOKEN_FROM_LOGIN`
   - `userToken` = `USER_JWT_TOKEN_AFTER_APPROVAL`

## **Admin Collection Requests:**

### **1. Admin Login**
- **Method**: POST
- **URL**: `{{baseUrl}}/api/users/login`
- **Body**: JSON
```json
{
  "email": "admin@labnetxl.com",
  "password": "Admin@123456"
}
```
- **Test Script**:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("adminToken", response.token);
}
```

### **2. Get Dashboard Stats**
- **Method**: GET
- **URL**: `{{baseUrl}}/api/admin/dashboard`
- **Headers**: `Authorization: Bearer {{adminToken}}`

### **3. Get Pending Users**
- **Method**: GET
- **URL**: `{{baseUrl}}/api/admin/users/pending`
- **Headers**: `Authorization: Bearer {{adminToken}}`

### **4. Approve User**
- **Method**: POST
- **URL**: `{{baseUrl}}/api/admin/users/approve`
- **Headers**: `Authorization: Bearer {{adminToken}}`
- **Body**: JSON
```json
{
  "userId": "USER_ID_HERE",
  "status": "approved"
}
```

### **5. Reject User**
- **Method**: POST
- **URL**: `{{baseUrl}}/api/admin/users/approve`
- **Headers**: `Authorization: Bearer {{adminToken}}`
- **Body**: JSON
```json
{
  "userId": "USER_ID_HERE",
  "status": "rejected",
  "rejectionReason": "Incomplete documentation"
}
```

---

# 🔍 Database Schema Changes

## **New User Fields:**
```typescript
role: 'user' | 'admin'                    // User role
approval_status: 'pending' | 'approved' | 'rejected'  // Approval status
approved_by: ObjectId                      // Admin who approved/rejected
approved_at: Date                          // When approved/rejected
rejection_reason: string                   // Reason for rejection (if rejected)
```

## **Admin User Fields:**
- `role: 'admin'`
- `approval_status: 'approved'` (auto-approved)
- `enable: 1` (enabled by default)

---

# � Admin Role Management

## **Creating Additional Admin Accounts**

Only existing admins can promote users to admin roles or demote admins to users.

### **Step 1: Get User ID to Promote**
```bash
curl -X GET "http://localhost:5000/api/admin/users" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### **Step 2: Promote User to Admin**
```bash
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID_HERE/role" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "reason": "Promoting to admin role for system management"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "User role updated successfully",
  "data": {
    "userId": "USER_ID",
    "email": "user@example.com",
    "name": "User Name",
    "oldRole": "user",
    "newRole": "admin",
    "updatedBy": "LabnetXL Admin",
    "updatedAt": "2025-10-08T...",
    "reason": "Promoting to admin role for system management"
  }
}
```

### **Step 3: Demote Admin to User**
```bash
curl -X PUT "http://localhost:5000/api/admin/users/ADMIN_USER_ID/role" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "reason": "Removing admin privileges"
  }'
```

## **Role Update Rules & Security**

### **🔒 Security Protections:**
1. **Only admins** can update user roles
2. **Admin cannot demote themselves** (prevents lockout)
3. **Auto-approval**: Users promoted to admin are automatically approved
4. **Validation**: Role must be either "user" or "admin"
5. **Audit trail**: All role changes are logged

### **📋 Role Update Validations:**
- User ID must exist in the system
- Role must be "user" or "admin"
- Reason is optional but recommended
- Cannot change role to the same role
- Admin cannot demote their own account

### **🧪 Testing Role Updates:**

1. **Create a test user** (Steps 3-4 from main workflow)
2. **Approve the test user** (Step 5 from main workflow)
3. **Promote user to admin** using the endpoint above
4. **Login with the new admin** account to verify admin access
5. **Test admin capabilities** with the new admin account

### **Example: Complete Admin Creation Workflow**

```bash
# 1. Login as default admin
ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@labnetxl.com", "password": "Admin@123456"}' \
  | jq -r '.data.token')

# 2. Get list of users to find user ID
curl -X GET "http://localhost:5000/api/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.data.users[] | {id: ._id, email: .email, role: .role}'

# 3. Promote user to admin (replace USER_ID with actual ID)
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID/role" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "reason": "New system administrator"}'

# 4. Verify new admin can access admin endpoints
NEW_ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "newadmin@example.com", "password": "password123"}' \
  | jq -r '.data.token')

curl -X GET "http://localhost:5000/api/admin/dashboard" \
  -H "Authorization: Bearer $NEW_ADMIN_TOKEN"
```

---

# �🐛 Common Issues & Solutions

## **Issue 1: Cannot Create Admin**
- Check if admin already exists in database
- Verify database connection
- Check server logs for errors

## **Issue 2: Admin Login Fails**
- Verify credentials: `admin@labnetxl.com` / `Admin@123456`
- Check if admin account was created successfully
- Verify JWT_SECRET in environment

## **Issue 3: User Still Can't Login After Approval**
- Verify approval was successful
- Check user's `approval_status` in database
- Ensure user is not trying to login as admin

## **Issue 4: Admin Routes Return 403**
- Verify JWT token is valid
- Check if logged-in user has `role: 'admin'`
- Ensure Authorization header format: `Bearer TOKEN`

---

# 📊 Testing Checklist

## **Basic Admin System**
- [ ] Server starts successfully
- [ ] Default admin account created
- [ ] Admin can login
- [ ] New users register with `pending` status
- [ ] Pending users cannot login
- [ ] Admin can view pending users
- [ ] Admin can approve users
- [ ] Admin can reject users with reason
- [ ] Approved users can login
- [ ] Rejected users cannot login
- [ ] Dashboard shows correct statistics
- [ ] All admin routes require authentication
- [ ] Non-admin users cannot access admin routes

## **Role Management System**
- [ ] Admin can promote users to admin role
- [ ] Admin can demote admins to user role
- [ ] Admin cannot demote themselves
- [ ] Promoted users automatically get approved status
- [ ] New admins can access admin endpoints
- [ ] Role changes are properly validated
- [ ] Role updates are logged correctly
- [ ] Only admins can update roles

---

This comprehensive admin approval system ensures that only verified users can access your LabnetXL platform! 🚀