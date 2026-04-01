# NguyenLien E-commerce Backend - AI Agent Instructions

## Architecture Overview
This is a Node.js/Express.js e-commerce backend with MongoDB, following a modular architecture where each business domain (auth, users, carts, products, orders, etc.) resides in its own module under `src/modules/`.

**Key Components:**
- **Modules**: Self-contained business domains with controller/service/model/routes/validator/mapper
- **Authentication**: JWT access tokens + httpOnly refresh token cookies
- **Authorization**: Role-based (CUSTOMER/MANAGER/ADMIN) with ownership checks
- **Validation**: Zod schemas for all inputs
- **Error Handling**: Custom AppError class with consistent error responses

## Module Structure Pattern
Each module follows this exact structure:
```
modules/{domain}/
├── {domain}.controller.js  # Express route handlers
├── {domain}.service.js     # Business logic layer
├── {domain}.model.js       # Mongoose schema
├── {domain}.routes.js      # Express router setup
├── {domain}.validator.js   # Zod validation schemas
└── {domain}.mapper.js      # DTO transformations
```

**Example**: `src/modules/users/user.controller.js` uses `user.service.js` for logic, validates with `user.validator.js`, maps data with `user.mapper.js`.

## Critical Patterns

### 1. Response Format
All API responses follow this structure:
```javascript
// Success
{ success: true, data: {...} }

// Error (handled by errorHandler.middleware.js)
{ success: false, code: "ERROR_CODE", message: "Human readable message" }
```

### 2. Error Handling
```javascript
// In services/controllers
throw new AppError("User not found", 404, "USER_NOT_FOUND");

// Handled automatically by errorHandler.middleware.js
```

### 3. Authorization Checks
```javascript
// In controllers
assertAuthContext(req); // Throws if not authenticated
checkOwnershipOrAdmin(req.user.id, targetUserId, req.user.roles); // Throws if not authorized
```

### 4. Async Route Handlers
```javascript
const getUser = asyncHandler(async (req, res) => {
    // No need for try/catch - errors bubble to errorHandler
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
});
```

### 5. Data Mapping
```javascript
// In services - always return mapped DTOs
return UserMapper.toResponseDTO(userDocument);

// In mappers - transform DB fields to API fields
static toResponseDTO(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        profile: user.profile,
        // Never expose password_hash or internal fields
    };
}
```

## Development Workflow

### Running the Application
```bash
npm run dev      # Development with nodemon auto-restart
npm run start    # Production mode
npm run seed     # Seed database with admin/manager users
npm test         # Run Jest tests
```

### API Documentation
- Swagger docs available at `http://localhost:5000/api-docs`
- Authentication: Use Bearer tokens for protected endpoints
- Refresh tokens: Stored in httpOnly cookies automatically

### Database
- MongoDB with Mongoose ODM
- Connection configured in `src/config/db.js`
- Environment: `MONGODB_URI` and `MONGODB_DB_NAME`

## Security & Validation

### Authentication Flow
1. Login returns access token + sets refresh cookie
2. Protected routes require `Authorization: Bearer <token>` header
3. Refresh endpoint uses httpOnly cookie to issue new access token

### Input Validation
```javascript
// In validators - use Zod schemas
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).regex(/[a-z]/).regex(/[0-9]/),
});

// In controllers
const { email, password } = createUserSchema.parse(req.body);
```

### CORS & Security
- CORS origins configured via `CORS_ORIGINS` env var
- Helmet for security headers
- Rate limiting on `/api/v1/*` routes (300 requests/15min)

## Key Files to Reference
- `src/app.js` - Express app setup, middleware configuration
- `src/routes/index.js` - Route mounting (add new modules here)
- `src/middlewares/authorize.middleware.js` - Authorization utilities
- `src/utils/appError.util.js` - Custom error class
- `src/modules/auth/` - Authentication implementation example
- `src/modules/users/` - Complete module implementation example

## Adding New Features
1. Create new module folder under `src/modules/{feature}/`
2. Implement all 6 files following the established patterns
3. Add routes to `src/routes/index.js`
4. Update Swagger docs in `src/docs/swagger.js`
5. Add Zod validators for all inputs
6. Use mappers to control API response shape
7. Handle authorization appropriately (ownership or role-based)</content>
<parameter name="filePath">c:\MyEffort\NguyenLien\.github\copilot-instructions.md