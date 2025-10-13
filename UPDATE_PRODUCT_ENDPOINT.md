# Update Product Endpoint - Documentation

## Endpoints Created

### Option 1: RESTful Style (Recommended)
```
PUT /api/products/:id
```

### Option 2: POST Style (Alternative)
```
POST /api/update_product/:id
```

Both endpoints do the same thing - update an existing product in the products table.

---

## Authentication

**Required**: Yes (JWT Bearer Token)

**Package Check**: Yes (User must have active package)

---

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | MongoDB ObjectId of the product to update |

### Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Body (JSON)

Send only the fields you want to update. All fields are optional:

```json
{
  "stock_id": "STK123",
  "shape": "Round",
  "carat": 1.5,
  "color": "E",
  "clarity": "VS1",
  "cut": "Excellent",
  "polish": "Excellent",
  "symmetry": "Excellent",
  "fluorescence": "None",
  "laboratory": "GIA",
  "certificate_number": "1234567890",
  "depth_percentage": 61.5,
  "table_percentage": 57.0,
  "price_per_carat": 5000,
  "total_price": 7500,
  "growth_type": "Natural",
  "fancy_color": "None",
  "fancy_color_intensity": "None",
  "fancy_color_overtone": "None",
  "eye_clean": "Yes",
  "measurements": "7.50*7.55*4.65",
  "seller_name": "John Doe",
  "seller_company": "Diamond Co",
  "seller_location": "New York",
  "seller_phone": "1234567890",
  "seller_whatsapp": "1234567890",
  "seller_email": "john@example.com",
  "video_url": "https://example.com/video.mp4",
  "image_url": "https://example.com/image.jpg",
  "certificate_url": "https://example.com/cert.pdf"
}
```

---

## Response

### Success Response (200 OK)

```json
{
  "message": "Product updated successfully",
  "data": {
    "_id": "68ec1234abcd1234abcd1234",
    "pid": "P00001",
    "product_id": "LNX412864_STK123",
    "stock_id": "STK123",
    "shape": "Round",
    "carat": 1.5,
    "color": "E",
    "clarity": "VS1",
    "cut": "Excellent",
    "polish": "Excellent",
    "symmetry": "Excellent",
    "fluorescence": "None",
    "laboratory": "GIA",
    "certificate_number": "1234567890",
    "depth_percentage": 61.5,
    "table_percentage": 57,
    "price_per_carat": 5000,
    "total_price": 7500,
    "growth_type": "Natural",
    "fancy_color": "None",
    "fancy_color_intensity": "None",
    "fancy_color_overtone": "None",
    "eye_clean": "Yes",
    "seller_name": "John Doe",
    "seller_company": "Diamond Co",
    "seller_location": "New York",
    "seller_phone": "1234567890",
    "seller_whatsapp": "1234567890",
    "seller_email": "john@example.com",
    "measurements": "7.50*7.55*4.65",
    "seller_id": "68ebf38e17ebdbbd3a3087ec",
    "createdAt": "2025-10-12T21:30:07.623Z",
    "updatedAt": "2025-10-13T10:15:30.123Z",
    "__v": 0
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "message": "User not authenticated"
}
```

#### 403 Forbidden - Package Expired
```json
{
  "message": "Your package has expired. Please buy a package first."
}
```

#### 404 Not Found
```json
{
  "message": "Product not found"
}
```
**Reason**: Product doesn't exist or doesn't belong to the authenticated user

#### 400 Bad Request - Validation Error
```json
{
  "message": "Validation failed",
  "details": {
    "carat": "Carat must be a valid number",
    "shape": "Invalid shape: \"Triangle\""
  }
}
```

#### 409 Conflict - Duplicate Stock ID
```json
{
  "message": "Stock ID already exists. Please use a unique Stock ID."
}
```
**Reason**: Another product (not this one) already has the same stock_id

#### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Features

### ✅ Security
- **User Ownership Check**: Users can only update their own products
- **Package Validation**: Active package required
- **JWT Authentication**: Protected endpoint

### ✅ Validation
- **Field Validation**: All fields validated (shape, color, clarity, etc.)
- **Duplicate Check**: Prevents duplicate stock_id (excluding current product)
- **Self-Exclusion**: When checking duplicates, excludes the product being updated

### ✅ Smart Updates
- **Partial Updates**: Send only fields you want to change
- **Auto-Calculation**: If `carat` or `price_per_carat` updated, `total_price` recalculated automatically
- **Preserve Existing**: Fields not in request body remain unchanged

### ✅ Audit Trail
- **Updated Timestamp**: Mongoose automatically updates `updatedAt` field
- **Error Logging**: All errors logged with user ID and function name

---

## Examples

### Example 1: Update Price (PUT Method)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/products/68ec1234abcd1234abcd1234 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_per_carat": 6000
  }'
```

**Or using POST:**
```bash
curl -X POST http://localhost:5000/api/update_product/68ec1234abcd1234abcd1234 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_per_carat": 6000
  }'
```

**Response:**
```json
{
  "message": "Product updated successfully",
  "data": {
    "_id": "68ec1234abcd1234abcd1234",
    "price_per_carat": 6000,
    "total_price": 9000,
    "updatedAt": "2025-10-13T10:20:00.000Z"
  }
}
```

**Note**: `total_price` automatically recalculated (1.5 carat * 6000 = 9000)

---

### Example 2: Update Multiple Fields

**Request:**
```bash
curl -X PUT http://localhost:5000/api/products/68ec1234abcd1234abcd1234 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "D",
    "clarity": "VVS1",
    "cut": "Ideal",
    "certificate_number": "9876543210"
  }'
```

**Response:**
```json
{
  "message": "Product updated successfully",
  "data": {
    "_id": "68ec1234abcd1234abcd1234",
    "color": "D",
    "clarity": "VVS1",
    "cut": "Ideal",
    "certificate_number": "9876543210",
    "updatedAt": "2025-10-13T10:25:00.000Z"
  }
}
```

---

### Example 3: Update Stock ID (with validation)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/products/68ec1234abcd1234abcd1234 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock_id": "STK999"
  }'
```

**Success Response:**
```json
{
  "message": "Product updated successfully",
  "data": {
    "_id": "68ec1234abcd1234abcd1234",
    "stock_id": "STK999",
    "product_id": "LNX412864_STK999",
    "updatedAt": "2025-10-13T10:30:00.000Z"
  }
}
```

**Error Response (if STK999 already exists):**
```json
{
  "message": "Stock ID already exists. Please use a unique Stock ID."
}
```

---

### Example 4: Invalid Update

**Request:**
```bash
curl -X PUT http://localhost:5000/api/products/68ec1234abcd1234abcd1234 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shape": "Triangle",
    "carat": -5
  }'
```

**Response:**
```json
{
  "message": "Validation failed",
  "details": {
    "shape": "Invalid shape: \"Triangle\"",
    "carat": "Carat must be greater than 0"
  }
}
```

---

## Postman Example

### Setup
1. Method: `PUT`
2. URL: `http://localhost:5000/api/products/:id`
3. Headers:
   - `Authorization: Bearer {{token}}`
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "price_per_carat": 6000,
  "certificate_number": "NEW123456"
}
```

### Params
- `id`: `68ec1234abcd1234abcd1234` (replace with actual product ID)

---

## How to Get Product ID

### Option 1: From Export
```bash
curl http://localhost:5000/api/export_excel \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Open the Excel file, the `_id` column contains product IDs.

### Option 2: Query Products (if you have a list endpoint)
If you add a GET `/api/products` endpoint, you can list all products and get their IDs.

### Option 3: From Save Response
When you create a product with `/save_row`, the response includes the `_id`:
```json
{
  "message": "Product created successfully",
  "data": {
    "_id": "68ec1234abcd1234abcd1234"  // ← Use this ID
  }
}
```

---

## Implementation Details

### Validation Logic
1. **Find Product**: Checks product exists and belongs to user
2. **Merge Data**: Combines existing product data with updates
3. **Validate**: Runs full validation (excluding self from duplicate check)
4. **Auto-Calculate**: Recalculates `total_price` if pricing fields changed
5. **Save**: Updates product in database
6. **Return**: Returns updated product

### Duplicate Check Logic
```typescript
// When updating product with ID = "ABC123"
// And checking if stock_id "STK001" is duplicate

// Query excludes the current product:
{
  stock_id: "STK001",
  seller_id: user._id,
  _id: { $ne: "ABC123" }  // ← Excludes self
}

// Result:
// - If another product has STK001 → Duplicate error
// - If only this product has STK001 → OK (can keep same stock_id)
```

---

## Allowed Values

### Shape
Round, Princess, Cushion, Emerald, Oval, Radiant, Asscher, Pear, Heart, Marquise, etc. (44 total)

### Color
D, E, F, G, H, I, J, K, L, M, N, O-P, Q-R, S-T, U-V, W-X, Y-Z, Fancy Yellow, Fancy Pink, etc. (24 total)

### Clarity
FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, SI3, I1, I2, I3

### Cut/Polish/Symmetry
Excellent, Very Good, Good, Fair, Poor, N/A

### Fluorescence
None, Faint, Medium, Strong, Very Strong

### Laboratory
GIA, IGI, HRD, AGS, EGL, GCAL, GSI, NGTC, etc. (17 total)

### Eye Clean
Yes, No, N/A, Unknown

### Growth Type
Natural, HPHT, CVD, Unknown

---

## Status

✅ **Endpoint Created**  
✅ **Route Registered**  
✅ **Validation Included**  
✅ **Duplicate Check with Self-Exclusion**  
✅ **Auto-Calculation of Total Price**  
✅ **Error Handling**  
✅ **TypeScript Type Safety**  

---

## Files Modified

1. **src/controllers/ExcelController.ts**
   - Added `updateProduct()` method

2. **src/routes/excelRoutes.ts**
   - Added `PUT /products/:id` route

---

**Created**: October 13, 2025  
**Endpoint**: `PUT /api/products/:id`  
**Status**: ✅ Ready to use
