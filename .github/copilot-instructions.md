# AI Copilot Instructions - NguyenLienShop Backend

## Architecture Overview

**NguyenLienShop** is a Node.js/Express e-commerce backend with MongoDB. The codebase follows a modular service architecture with clear separation of concerns.

### Core Stack
- **Framework**: Express.js v5.1
- **Database**: MongoDB + Mongoose
- **Validation**: Zod (schema-based validation)
- **Auth**: JWT (access + refresh tokens) with bcrypt
- **Dev**: Nodemon, Jest testing

### Project Structure

```
src/
├── app.js              # Express app setup (middlewares: helmet, cors, rate-limit)
├── server.js           # Server entry point + graceful shutdown
├── config/db.js        # MongoDB connection with retry logic
├── routes/index.js     # Route aggregation point
├── modules/            # Feature modules (auth, users, products, categories, etc.)
├── middlewares/        # Shared middleware (auth, validation, error handling)
├── utils/              # Utilities (error handling, validators, helpers)
└── docs/swagger.js     # Swagger/OpenAPI documentation
```

## Key Architectural Patterns

### 1. Module Structure (e.g., `modules/products/`)

Each feature module follows this pattern:
- **`module.controller.js`** - Request handlers using `asyncHandler` wrapper
- **`module.service.js`** - Business logic; delegates to sub-services
- **`module.mapper.js`** - DTO transformation (Mongoose → API response)
- **`module.model.js`** - Mongoose schema with validation & custom methods
- **`module.validator.js`** - Zod schemas for request validation
- **`module.routes.js`** - Express router with middleware chaining

**Important**: Services are static classes; controllers use `asyncHandler` to catch errors.

### 2. Request → Response Flow

```
Route → validate() → authenticate() → Controller → Service → Mapper → JSON Response
                                            ↓
                                      Model/Database
```

**Example**: `POST /api/v1/products`
1. `validate(createProductSchema)` - Zod validates body
2. `authenticate()` - Extracts & verifies JWT token
3. `createProduct()` controller → calls `ProductService.createProduct()`
4. Service creates Mongoose doc, returns mapped DTO

### 3. Error Handling Pattern

All errors throw `AppError` (extends Error):
```javascript
// src/utils/appError.util.js
class AppError extends Error {
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
```

**Usage**:
```javascript
throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
```

The `errorHandler` middleware catches all AppError instances and returns structured JSON responses.

### 4. Validation Pattern (Zod-based)

Define schemas in `module.validator.js`:
```javascript
const createProductSchema = z.object({
    name: z.string().min(2),
    category_id: z.string(),
    // ...
});
```

Apply in routes:
```javascript
router.post('/', validate(createProductSchema), controller.create);
```

### 5. Authentication & Authorization

- **Token verification**: `verifyAccessToken()` utility extracts payload
- **Middleware**: `authenticate()` middleware adds `req.user` with `userId`, `role`
- **Role checks**: `assertRole(req, 'admin')` utility validates permissions

### 6. Data Mapping (DTO Pattern)

Mappers transform Mongoose docs → API DTOs, hiding internal fields:
```javascript
// ProductMapper.toResponseDTO(product) 
// Exposes: id, name, slug, min_price, images[], created_at
// Hides: _id, __v, is_deleted, internal flags
```

**Three mapper levels**:
- `toResponseDTO()` - Basic/list responses (price, images, status)
- `toDetailDTO()` - Full detail with nested relations (variants + units)
- `toResponseDTOList()` - Array batch transformation

### 7. Nested Resources Pattern

**Products → Variants → VariantUnits** (three-level hierarchy):
- Product routes: `GET /products/:id` returns product + variants + units
- Variant routes: `POST /products/:productId/variants`
- Unit routes: `GET /variants/:variantId/units`

Route mounting (in `routes/index.js`):
```javascript
router.use("/", productModuleRoutes); // Includes /products, /variants, /variant-units
```

### 8. Soft Delete Implementation

Models use logical delete (not physical):
- Schema fields: `is_deleted` (boolean), `deleted_at` (timestamp)
- Mongoose middleware excludes deleted docs by default
- Slug index is partial (allows reuse after soft-delete)

## Essential Commands

### Development
```bash
npm run dev          # Start with hot-reload (nodemon)
npm start            # Production start
npm run seed         # Populate database with test data
npm test             # Run Jest tests
```

### Database
- MongoDB must be running locally (default: `mongodb://127.0.0.1:27017`)
- Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env`

### Testing
- Use Jest; test files: `*.test.js` or `*.spec.js`
- Currently minimal test coverage; `src/docs/swagger.test.js` exists as example

## Important Conventions

### 1. Route Parameter Order

**Specific routes MUST come before dynamic routes**:
```javascript
router.get('/search', ...) // Specific: /search comes before /:id
router.get('/:id', ...)     // Dynamic: /:id catches others
```

### 2. API Response Format

Consistent structure (success + data/error):
```javascript
// Success
{ "success": true, "data": {...}, "pagination": {...} }

// Error (via errorHandler)
{ "success": false, "code": "ERROR_CODE", "message": "..." }
```

### 3. Naming Conventions

- **Database fields**: snake_case (`category_id`, `is_deleted`, `created_at`)
- **Variables**: camelCase (`userId`, `productName`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_ACCESS_SECRET`)
- **Routes**: kebab-case (`/user-addresses`, `/variant-units`)

### 4. Pagination Pattern

Query params: `page` (default 1), `limit` (default 20, max 100)
```javascript
// Service returns
{ data: [...], pagination: { page, limit, total, totalPages } }
```

### 5. Filtering & Sorting

Products support:
- **Filters**: `category_id`, `min_price`, `max_price`, `status`, `search`
- **Sort**: `popular`, `rating`, `price_asc`, `price_desc`, `newest` (query param: `sortBy`)

## Critical Implementation Notes

### Products Module Complexity

Products have dynamic pricing from variants:
- `product.min_price` / `max_price` are **cached from variant data** (updated via service layer)
- `product.min_price_per_unit` is calculated for display/comparison
- Variants have multiple units with different prices/quantities
- When updating variant units, service cascades pricing updates up to Product

**When modifying pricing logic**: Update `ProductService.createProduct()`, `updateVariant()` methods, not direct model saves.

### JWT Token Flow

- **Access token**: Short-lived (15m default), in Authorization header
- **Refresh token**: Long-lived (1d), in HTTP-only cookie
- **Verification**: `verifyAccessToken()` returns `{ userId, role, iat, exp }`
- **Sessions**: Token records stored in MongoDB for logout tracking

### Category Relationships

- Category is required for product creation
- When querying products by category, fetch `category_id` and validate existence
- Category soft-delete must cascade to products (implement if needed)

## Development Workflow

1. **Create new module**: Copy `modules/products/` structure as template
2. **Add route**: Mount in `routes/index.js` with prefix
3. **Validation**: Define Zod schema in `module.validator.js`, apply via `validate()` middleware
4. **Service logic**: Keep business rules in service class, call models from service
5. **Testing**: Add Jest tests in `src/` alongside source files
6. **Error handling**: Always throw `AppError` with appropriate HTTP status + error code

## Carts Module - Race Condition & Merge Logic

### Critical: Atomic Updates
- **Always use MongoDB atomic operators** (`$push`, `$inc`) for cart modifications
- NEVER: read cart → modify in app → save (causes race conditions)
- Example: `Cart.updateOne({ _id }, { $inc: { 'items.$.quantity': qty } })`

### Guest → User Merge (Login Flow)
1. On login, check `session_key` from request
2. Call `CartService.mergeGuestCartToUser(sessionKey, userId)`
3. Merge items by SKU (upsert quantity)
4. Inherit discount if user cart empty
5. Delete guest cart

### Index Priority
```js
user_id, session_key, status, updated_at, expired_at (TTL)

## Common Pitfalls to Avoid

- ❌ Throwing generic `Error` - use `AppError` instead
- ❌ Mixing database logic in controllers - keep in service layer
- ❌ Forgetting `asyncHandler` wrapper - catches unhandled rejections
- ❌ Direct model manipulation - go through service layer for consistency
- ❌ Route ordering - specific routes MUST precede dynamic routes
- ❌ Exposing MongoDB `_id` in API - use mappers to transform to `id`
- ❌ Hardcoding validation - use Zod schemas in validators
