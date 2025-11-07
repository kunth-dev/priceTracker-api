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
```
