# API Documentation

Base URL: `http://localhost:3002/api`

## Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer your_secret_bearer_token_here
```

---

## Auth Endpoints (Public - No Authentication Required)

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Valid email format required
- `password`: Minimum 8 characters

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "user@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:18:43.934Z"
  },
  "message": "User created successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "User with this email already exists",
  "errorCode": "USER_ALREADY_EXISTS"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid email address",
  "errorCode": "VALIDATION_FAILED"
}
```

---

### Login

Authenticate user and get user data.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Valid email format required
- `password`: Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "user@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:18:43.934Z"
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "errorCode": "INVALID_CREDENTIALS"
}
```

---

### Forgot Password

Request a password reset code to be sent to the user's email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reset code sent to email",
  "data": {
    "expiresAt": "2025-11-07T13:33:21.568Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

**Note:** In production, the reset code is sent via email. In development, it's logged to the console.

---

### Send Reset Code

Resend a password reset code (alternative to forgot-password).

**Endpoint:** `POST /api/auth/send-reset-code`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reset code sent to email",
  "data": {
    "expiresAt": "2025-11-07T13:33:21.568Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

---

### Reset Password

Reset user password using the code sent to their email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Validation Rules:**
- `email`: Valid email format required
- `code`: Minimum 6 characters
- `newPassword`: Minimum 8 characters

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid reset code",
  "errorCode": "INVALID_RESET_CODE"
}
```

or

```json
{
  "success": false,
  "error": "Reset code has expired",
  "errorCode": "RESET_CODE_EXPIRED"
}
```

**Note:** Reset codes expire after 15 minutes.

---

## User Endpoints (Protected - Authentication Required)

All endpoints in this section require a valid Bearer token in the Authorization header.

### Get User Data

Retrieve user information by user ID.

**Endpoint:** `GET /api/user/:userId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "user@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:18:43.934Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Missing authorization",
  "message": "Authorization header is required. Format: Authorization: Bearer <token>",
  "timestamp": "2025-11-07T13:07:59.617Z"
}
```

---

### Update User

Update user email and/or password.

**Endpoint:** `PATCH /api/user/:userId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Validation Rules:**
- `email`: Valid email format (optional)
- `password`: Minimum 8 characters (optional)
- At least one field must be provided

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "newemail@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:25:15.716Z"
  },
  "message": "User updated successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Email already in use",
  "errorCode": "EMAIL_ALREADY_IN_USE"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "At least one field must be provided for update",
  "errorCode": "MISSING_REQUIRED_FIELD"
}
```

---

### Delete User

Delete a user account.

**Endpoint:** `DELETE /api/user/:userId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

---

## Order Endpoints (Protected - Authentication Required)

All endpoints in this section require a valid Bearer token in the Authorization header.

### Create Order

Create a new order.

**Endpoint:** `POST /api/order`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Request Body:**
```json
{
  "title": "Premium Subscription",
  "price": "99.99",
  "link": "https://example.com/product/123",
  "status": "active"
}
```

**Validation Rules:**
- `title`: Required, minimum 1 character
- `price`: Required, valid number with up to 2 decimal places (e.g., "99.99")
- `link`: Required, valid URL format
- `status`: Required, must be either "active" or "draft"

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "title": "Premium Subscription",
    "price": "99.99",
    "link": "https://example.com/product/123",
    "status": "active",
    "createdAt": "2025-11-08T05:20:12.123Z",
    "updatedAt": "2025-11-08T05:20:12.123Z"
  },
  "message": "Order created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Price must be a valid number with up to 2 decimal places",
  "errorCode": "VALIDATION_FAILED"
}
```

---

### Get All Orders

Retrieve all orders with pagination, sorting, and filtering.

**Endpoint:** `GET /api/orders`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Query Parameters:**

All query parameters are optional:

- `page`: Page number (default: 1, must be positive integer)
  - Example: `?page=5`
- `sortBy`: Field to sort by
  - Options: `title`, `price`, `status`, `createdAt`, `updatedAt`
  - Example: `?sortBy=createdAt`
- `sortOrder`: Sort direction (default: `desc`)
  - Options: `asc`, `desc`
  - Example: `?sortOrder=asc`
- `filterBy`: Field to filter by
  - Options: `title`, `price`, `status`, `link`
  - Example: `?filterBy=status`
- `filterValue`: Value to filter for (required if `filterBy` is provided)
  - For `title` and `link`: performs case-insensitive partial match
  - For `price` and `status`: performs exact match
  - Example: `?filterBy=status&filterValue=active`

**Example Requests:**

```bash
# Get first page of orders (default sorting by createdAt desc)
GET /api/orders

# Get page 3
GET /api/orders?page=3

# Sort by price ascending
GET /api/orders?sortBy=price&sortOrder=asc

# Filter active orders
GET /api/orders?filterBy=status&filterValue=active

# Complex query: page 2, sort by title ascending, filter by status
GET /api/orders?page=2&sortBy=title&sortOrder=asc&filterBy=status&filterValue=active

# Filter by title (partial match)
GET /api/orders?filterBy=title&filterValue=premium
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
        "title": "Premium Subscription",
        "price": "99.99",
        "link": "https://example.com/product/123",
        "status": "active",
        "createdAt": "2025-11-08T05:20:12.123Z",
        "updatedAt": "2025-11-08T05:20:12.123Z"
      },
      {
        "orderId": "b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7",
        "title": "Basic Package",
        "price": "29.99",
        "link": "https://example.com/product/456",
        "status": "draft",
        "createdAt": "2025-11-08T05:15:30.456Z",
        "updatedAt": "2025-11-08T05:15:30.456Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 150,
      "itemsPerPage": 30
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Page must be a positive number",
  "errorCode": "VALIDATION_FAILED"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Missing authorization",
  "message": "Authorization header is required. Format: Authorization: Bearer <token>",
  "timestamp": "2025-11-08T05:24:00.000Z"
}
```

---

### Get Order by ID

Retrieve order information by order ID.

**Endpoint:** `GET /api/order/:orderId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "title": "Premium Subscription",
    "price": "99.99",
    "link": "https://example.com/product/123",
    "status": "active",
    "createdAt": "2025-11-08T05:20:12.123Z",
    "updatedAt": "2025-11-08T05:20:12.123Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Order not found",
  "errorCode": "ORDER_NOT_FOUND"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Missing authorization",
  "message": "Authorization header is required. Format: Authorization: Bearer <token>",
  "timestamp": "2025-11-08T05:24:00.000Z"
}
```

---

### Update Order

Update order information (title, price, link, and/or status).

**Endpoint:** `PATCH /api/order/:orderId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Request Body:**
```json
{
  "title": "Updated Premium Subscription",
  "price": "149.99",
  "link": "https://example.com/product/456",
  "status": "draft"
}
```

**Validation Rules:**
- `title`: Minimum 1 character (optional)
- `price`: Valid number with up to 2 decimal places (optional)
- `link`: Valid URL format (optional)
- `status`: Must be either "active" or "draft" (optional)
- At least one field must be provided

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "title": "Updated Premium Subscription",
    "price": "149.99",
    "link": "https://example.com/product/456",
    "status": "draft",
    "createdAt": "2025-11-08T05:20:12.123Z",
    "updatedAt": "2025-11-08T05:30:45.678Z"
  },
  "message": "Order updated successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Order not found",
  "errorCode": "ORDER_NOT_FOUND"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "At least one field must be provided for update",
  "errorCode": "MISSING_REQUIRED_FIELD"
}
```

---

### Delete Order

Delete an order by ID.

**Endpoint:** `DELETE /api/order/:orderId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Order not found",
  "errorCode": "ORDER_NOT_FOUND"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "message": "Detailed error description (optional)",
  "timestamp": "2025-11-07T13:07:59.617Z"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or validation error
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., duplicate email)
- `500 Internal Server Error` - Server error

### Error Codes

All errors include a machine-readable error code for programmatic handling:

- `VALIDATION_FAILED` - Request validation failed
- `INVALID_CREDENTIALS` - Invalid login credentials
- `USER_NOT_FOUND` - User does not exist
- `USER_ALREADY_EXISTS` - Email already registered
- `EMAIL_ALREADY_IN_USE` - Email taken by another user
- `INVALID_RESET_CODE` - Invalid password reset code
- `RESET_CODE_EXPIRED` - Reset code has expired
- `RESET_CODE_NOT_FOUND` - No reset code found for email
- `ORDER_NOT_FOUND` - Order does not exist
- `MISSING_REQUIRED_FIELD` - Required field missing

---

## Testing

Example curl commands for testing:

```bash
# Register a new user
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Forgot Password
curl -X POST http://localhost:3002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Send Reset Code
curl -X POST http://localhost:3002/api/auth/send-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset Password
curl -X POST http://localhost:3002/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","newPassword":"newpassword123"}'

# Verify Email
curl -X POST http://localhost:3002/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

# Resend Verification Code
curl -X POST http://localhost:3002/api/auth/resend-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Register Confirmation
curl -X POST http://localhost:3002/api/auth/register-confirmation \
  -H "Content-Type: application/json" \
  -d '{"uuid":"a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6"}'

# Resend Confirmation Email
curl -X POST http://localhost:3002/api/auth/resend-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Get user data (requires auth)
curl -X GET http://localhost:3002/api/user/USER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Update user (requires auth)
curl -X PATCH http://localhost:3002/api/user/USER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here" \
  -H "Content-Type: application/json" \
  -d '{"email":"newemail@example.com"}'

# Delete user (requires auth)
curl -X DELETE http://localhost:3002/api/user/USER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Create order (requires auth)
curl -X POST http://localhost:3002/api/order \
  -H "Authorization: Bearer your_secret_bearer_token_here" \
  -H "Content-Type: application/json" \
  -d '{"title":"Premium Package","price":"99.99","link":"https://example.com/product","status":"active"}'

# Get all orders with pagination (requires auth)
curl -X GET http://localhost:3002/api/orders \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Get orders - page 3, sorted by price ascending (requires auth)
curl -X GET "http://localhost:3002/api/orders?page=3&sortBy=price&sortOrder=asc" \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Get active orders only (requires auth)
curl -X GET "http://localhost:3002/api/orders?filterBy=status&filterValue=active" \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Get order data (requires auth)
curl -X GET http://localhost:3002/api/order/ORDER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Update order (requires auth)
curl -X PATCH http://localhost:3002/api/order/ORDER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here" \
  -H "Content-Type: application/json" \
  -d '{"status":"draft","price":"149.99"}'

# Delete order (requires auth)
curl -X DELETE http://localhost:3002/api/order/ORDER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here"
```
