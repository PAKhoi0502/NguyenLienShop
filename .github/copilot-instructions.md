# AI Copilot Instructions - NguyenLienShop Backend

**NguyenLienShop** is a Node.js/Express e-commerce backend with MongoDB. The codebase follows a modular service architecture with clear separation of concerns.

## Core Stack & Setup

- **Framework**: Express.js v5.1 | **Database**: MongoDB + Mongoose | **Validation**: Zod | **Auth**: JWT + bcrypt
- **Dev**: Nodemon, Jest
- **Commands**: 
  - `npm run dev` - Start with hot-reload
  - `npm run seed` - Populate test data
  - `npm test` - Run Jest tests
  - MongoDB must run locally (set `MONGODB_URI`, `MONGODB_DB_NAME` in `.env`)

## Project Structure

```
src/
├── app.js                 # Express setup (helmet, cors, rate-limit, error handler)
├── server.js              # Entry point + graceful shutdown
├── config/db.js           # MongoDB connection with retry logic (5 attempts, exponential backoff)
├── routes/index.js        # Route aggregation point
├── modules/               # Feature modules (auth, users, products, categories, carts, orders, payments)
├── middlewares/           # Shared (auth, validate, authorize, errorHandler)
├── utils/                 # Utilities (AppError, asyncHandler, validators, helpers)
└── docs/swagger.js        # Swagger/OpenAPI documentation
```

## Request → Response Flow & Module Pattern

Every endpoint follows:
```
Route → validate() → authenticate() → Controller → Service → Mapper → JSON Response
                                            ↓
                                      Model (Mongoose)
```

**Each feature module** (`modules/products/`, `modules/users/`, etc.) has:
- **Controller** - `asyncHandler`-wrapped request handlers
- **Service** - Static class with business logic; validates, checks DB constraints
- **Mapper** - DTO transformation (Mongoose docs → API responses)
- **Model** - Mongoose schema with validation, custom methods, soft-delete middleware
- **Validator** - Zod schemas for request validation (body/query)
- **Routes** - Express router with middleware chaining (`validate()` → `authenticate()` → controller)

**Critical**: Service methods return DTOs (never raw MongoDB docs). Controllers delegate to services. Services use models for DB queries.

### Route Parameter Ordering (Specific BEFORE Dynamic)

**In all route files, specific routes MUST come before dynamic routes:**
```javascript
router.get('/search', ...);           // ✅ Specific: comes first
router.get('/category/:categoryId', ...);  // ✅ Specific
router.get('/slug/:slug', ...);       // ✅ Specific
router.get('/:productId', ...);       // ✅ Dynamic: comes last
```
Otherwise `/search` and `/slug/:slug` get caught by `/:productId`.

### Error Handling & Validation

**All errors throw `AppError`** from `src/utils/appError.util.js`:
```javascript
throw new AppError(message, statusCode, code);
// Example: throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
```

The `errorHandler` middleware catches AppError and returns:
```json
{ "success": false, "code": "ERROR_CODE", "message": "..." }
```

**Validation** happens via `validate()` middleware using Zod schemas in `module.validator.js`:
```javascript
const createProductSchema = z.object({
    name: z.string().min(2).max(200),
    category_id: z.string(),
});
// ✅ Modern pattern: validate({ body, params, query }) for multi-part validation
router.post('/', validate({ body: createProductSchema }), controller.create);
router.patch('/:id', validate({ params: idSchema, body: updateSchema }), controller.update);

// ❌ DEPRECATED: Don't create custom inline validate functions (use middleware/validate.middleware.js)
// Avoid: const validate = (schema) => (req, res, next) => { ... }
```

### Authentication & Authorization

- **Middleware**: `authenticate()` extracts & verifies JWT, adds `req.user = { userId, roles }`
- **Utilities** in `src/utils/auth.util.js`:
  - `assertAuthenticated(req.user)` - Throws if no token
  - `assertRole(req.user, ['ADMIN'])` - Throws if missing required role
- **Token flow**: Access token (15m) in Authorization header; refresh token (1d) in HTTP-only cookie
- **Token storage**: Refresh tokens hashed and stored in MongoDB for revocation checks

### Validation Middleware Pattern (Multi-Part)

The `validate()` middleware in `src/middlewares/validate.middleware.js` supports validating multiple request parts:

```javascript
// ✅ CORRECT: Validate body, params, and query
router.patch(
    '/orders/:order_id/review',
    authenticate(),
    validate({
        params: getOrderByIdSchema,    // Validates req.params
        body: writeReviewSchema,       // Validates req.body
        // query: searchSchema         // Optional: validate query params
    }),
    OrderController.writeReview
);

// ✅ Validator will check all specified parts sequentially
// ✅ Throws AppError(400, 'VALIDATION_ERROR') on first failure
// ✅ Always use this centralized middleware, NOT custom inline validators
```

**Key pattern differences**:
- **Query validation**: Most common for filtering/pagination (`page`, `limit`, `status`)
- **Path params**: Separate validation for ID patterns (MongoDB ObjectId format)
- **Body validation**: Primary validation for create/update operations
- **Order matters**: Validate specific routes BEFORE dynamic routes to prevent param confusion

## Critical Business Rules & Invariants

### Pricing System (Mandatory Rules)

**Source of Truth**: `variant_units` table is the single source of truth for all prices.

**Derived Cache Pattern**:
- Product prices = **cached** from variant_units
- Variant prices = **cached** from variant_units
- **NEVER write directly** to `product.min_price` or `variant.min_price`

**Update Rule**:
```javascript
// ✅ CORRECT: Update cascades automatically
await VariantUnitService.updateUnit(unitId, { price_per_unit: 100 });
// ProductService.recalculatePricing() is called internally

// ❌ WRONG: Direct price write
product.min_price = 100;
await product.save();
```

**When pricing changes**:
1. Always call `ProductService.recalculatePricing(productId)`
2. Service recalculates min/max from variant units
3. Service updates product + all variants atomically
4. Never update variant/product prices outside this flow

### Stock Management (Model: With Reservation)

**Recommended Implementation**: Reservation model (prevents double-selling)

**Stock Fields**:
- `variant.stock.available` = total - reserved (items ready to sell)
- `variant.stock.reserved` = pending/processing orders
- `variant.stock.sold` = completed orders
- **Invariant**: `available + reserved + sold = total_quantity`

**Stock Flow**:
1. **At checkout**: `available -= qty`, `reserved += qty` (ATOMIC)
2. **At payment success**: No change (reserved stays)
3. **At fulfillment**: `reserved -= qty`, `sold += qty` (ATOMIC)
4. **On order cancel**: `reserved -= qty`, `available += qty` (ATOMIC)

**Why reservation?**
- Prevents double-selling across concurrent checkouts
- Clear visibility into inventory committed vs available
- Enables order status tracking (pending/processing)

**Code pattern - CHECKOUT** (with condition check):
```javascript
// ❌ WRONG: Missing $gte condition
const updated = await Variant.findByIdAndUpdate(
    variantId,
    { $inc: { 'stock.available': -qty } },
    { new: true }
);

// ✅ CORRECT: Atomic with validation (prevents race condition)
const result = await Variant.updateOne(
    {
        _id: variantId,
        'stock.available': { $gte: qty }  // ← Condition is MANDATORY
    },
    {
        $inc: { 
            'stock.available': -qty,
            'stock.reserved': +qty
        }
    }
);

if (result.modifiedCount === 0) {
    throw new AppError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
}
```

**Code pattern - DELIVERY**:
```javascript
// ✅ CORRECT: Move from reserved → sold
const result = await Variant.updateOne(
    {
        _id: variantId,
        'stock.reserved': { $gte: qty }  // ← Ensure reserved has qty
    },
    {
        $inc: { 
            'stock.reserved': -qty,
            'stock.sold': +qty
        }
    }
);

if (result.modifiedCount === 0) {
    throw new AppError('Order fulfillment failed: reserved stock mismatch', 409, 'RESERVED_STOCK_MISMATCH');
}
```

**Critical Rule**: 
- **NEVER use `findByIdAndUpdate`** (returns doc, not count) - use `updateOne` + check `modifiedCount`
- **ALWAYS include `$gte` condition** in stock updates
- **ALWAYS check `modifiedCount === 0`** for failure handling

### Cart Snapshot Pricing (Fixed Rules)

**Invariant**: Once item is added to cart, its price is immutable.

**Implementation**:
- Store `price_at_added` at cart item creation
- Never update `price_at_added` even if product price changes
- Calculate `line_total` at response time: `price_at_added × quantity`
- Calculate `cart_total` at response time from all line_totals + discount

**Rationale**: Protects customer from mid-checkout price changes.

### Cart Merging (Guest → User)

**Trigger**: When guest user logs in or creates account.

**Algorithm**:
1. Load guest cart (by `session_key`)
2. Load user cart (if exists) or create empty
3. For each guest item:
   - If item exists in user cart (same SKU): `userItem.quantity += guestItem.quantity`
   - If new item: Add to user cart
4. If user cart was empty: Inherit discount from guest cart
5. Delete guest cart
6. Return merged user cart

### Discount Logic (Locked Rules)

**Application**:
- Applied AFTER subtotal calculation
- NOT applied to shipping fees (if any)
- NOT applied to taxes (if calculated separately)

**Types**: Percentage or fixed amount (choose one type per cart)
**Scope**: Per-cart only (not per-item stacking)
**Stacking**: Not allowed (single discount per cart)
**Max cap**: Discount cannot exceed cart subtotal

**Validation Rules**:
```javascript
// ✅ CORRECT: Apply discount safely
const applyDiscount = (subtotal, discount) => {
    if (discount.type === 'percentage') {
        const discountAmount = (subtotal * discount.value) / 100;
        // Cap at subtotal
        return Math.min(discountAmount, subtotal);
    }
    
    if (discount.type === 'fixed') {
        // Cap at subtotal
        return Math.min(discount.value, subtotal);
    }
};

// ✅ CORRECT: Final total
const finalTotal = subtotal - appliedDiscount + shipping;
```

**Implementation checklist**:
- ✅ Validate discount exists & is active
- ✅ Validate minimum spend (if applicable)
- ✅ Validate promo code not expired
- ✅ Validate usage limit (if per-code limit)
- ✅ Apply only once per cart
- ✅ Cap discount ≤ subtotal
- ✅ Don't apply to shipping/tax

## Module File Organization

**Standard module structure** (reference: `modules/users/`, `modules/categories/`):
```
modules/feature/
├── feature.model.js           # Mongoose schema
├── feature.service.js         # Business logic (static class)
├── feature.controller.js       # Request handlers (asyncHandler-wrapped)
├── feature.mapper.js          # DTO transformations
├── feature.validator.js       # Zod validation schemas
├── feature.routes.js          # Express router
└── security/ (auth only)
    ├── token.model.js
    ├── token.service.js
    └── token.security.js
```

**Nested module structure** (products has sub-resources - variants, units):
```
modules/products/
├── product.{model,service,controller,mapper,validator}.js
├── variant.{model,service,controller,mapper,validator}.js
├── variant_unit.{model,service,controller,mapper,validator}.js
└── routes/                     # Mounted at root via index.js
    ├── index.js
    ├── product.routes.js
    ├── variant.routes.js
    └── variant_unit.routes.js
```

**Key principle**: Use nested routes structure when feature has sub-resources (variants under products).

## Critical Patterns by Feature

### Products Module: Three-Level Hierarchy

**Product → Variants → VariantUnits** forms the core data model:
- **Product**: The item (e.g., "Túi Bao Trái") with min/max cached pricing
- **Variant**: Size + fabric combination (e.g., "20x25 - Vải Không Dệt") with stock tracking
- **VariantUnit**: Pack quantity (e.g., "Gói 100 cái", "Hộp 50 cái") with unit price

**Route hierarchy** (`src/modules/products/routes/`):
```
GET    /products              # List all
GET    /products/search       # Search (BEFORE /:productId!)
GET    /products/:productId   # Single product with variants + units
POST   /products              # Create (admin)

GET    /products/:productId/variants
POST   /products/:productId/variants
PATCH  /variants/:variantId
DELETE /variants/:variantId

GET    /variants/:variantId/units
POST   /variants/:variantId/units
PATCH  /variant-units/:unitId
```

### Carts Module: Atomic Operations & Guest → User Merge

**Critical**: Cart modifications use MongoDB atomic operators (`$push`, `$inc`) to prevent race conditions. Never do read → modify → save.

**Atomic Pattern Rules**:
- **$push + $inc CANNOT be combined** in single operation ($ positional operator requires match)
- **MUST use separate operations** for "add new item" vs "update quantity"
- **ALWAYS check operation result** before returning

**Case 1: Update existing item quantity** (item already in cart):
```javascript
// ✅ CORRECT: Use $inc with positional operator (single operation)
const result = await Cart.findByIdAndUpdate(
    cartId,
    { $inc: { 'items.$.quantity': qty } },  // ← $ matches the array element
    { new: true, arrayFilters: [{ 'items._id': itemId }] }  // ← Specify which item
);

if (!result) {
    throw new AppError('Item not in cart', 404, 'ITEM_NOT_FOUND');
}
```

**Case 2: Add new item to cart** (item not yet in cart):
```javascript
// ✅ CORRECT: Use $push (separate operation)
const newItem = {
    _id: new ObjectId(),
    product_id,
    variant_id,
    unit_id,
    sku,
    quantity,
    price_at_added,
    // ... other denormalized fields
};

const result = await Cart.findByIdAndUpdate(
    cartId,
    { $push: { items: newItem } },
    { new: true }
);

if (!result) {
    throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');
}
```

**Key patterns**:
1. **Validation BEFORE update**: Check stock, product exists before atomic operation
2. **Check result AFTER update**: Verify modifiedCount or returned document
3. **Two operations for add**: First push, then increment if needed (or check+push+increment in service)
4. **Snapshot pricing**: `price_at_added` immutable; calculated totals at response time
5. **TTL cleanup**: Expired carts auto-delete via MongoDB TTL index on `expired_at`

### Soft Delete Implementation

Models use logical delete (not physical):
- Schema fields: `is_deleted` (boolean), `deleted_at` (timestamp)
- **Always excluded by default** - Mongoose middleware filters in all queries
- Slug index is **partial** (allows reuse after soft-delete): `index: { slug: 1, is_deleted: 1 }`
- When soft-deleting: set both `is_deleted = true` and `deleted_at = new Date()`

### Reusable Validation Utilities

**Validation helper utilities** in `src/utils/validator.util.js`:
```javascript
// ✅ Use for validating path parameters (e.g., MongoDB ObjectIds)
const { validateObjectId } = require('../../utils/validator.util');

// In controller:
validateObjectId(req.params.userId);  // Throws AppError if invalid
```

**Pattern**: Combine Zod schemas (for structure) with utility validators (for specific checks):
```javascript
// validator.js - Define Zod schema
const getUserAddressSchema = z.object({
    addressId: z.string()
        .refine(
            (val) => mongoose.Types.ObjectId.isValid(val),
            { message: 'Invalid address ID' }
        )
});

// controller.js - Can additionally validate
validateObjectId(req.params.addressId);  // Double-check or alternative pattern
```

## Authentication & Token Security

### Token Lifecycle

**Issue**:
```javascript
// On login: Generate both access + refresh tokens
const accessToken = signAccessToken({ userId, roles });
const refreshToken = signRefreshToken({ userId });
// Store hashed refreshToken in DB for revocation
await TokenRecord.create({ userId, refreshTokenHash: hash(refreshToken) });
```

**Refresh**:
```javascript
// On token refresh: Validate refresh token against DB
const tokenRecord = await TokenRecord.findOne({ userId });
if (!tokenRecord || !verifyHash(refreshToken, tokenRecord.refreshTokenHash)) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
}
```

**Revoke**:
```javascript
// On logout: Delete token record
await TokenRecord.deleteOne({ userId });
// Client removes tokens from headers/cookies
```

### Storage & Security Invariants

- **Refresh tokens are hashed** before DB storage
- **Validation**: Refresh token must be validated against stored hash
- **Revoked tokens must be rejected** (check tokenRecord existence)
- **Access token** is short-lived (15m), can be signed without DB lookup
- **Token version field** in payload supports bulk logout (increment on password change)

### Token Device Policy (Single-Device)

**Current Implementation**: One-device-per-user (logout = revoke all sessions)

**Rule**:
```javascript
// ✅ CORRECT: Single token per user
// On login: Delete previous token, issue new one
await TokenRecord.deleteOne({ userId });
await TokenRecord.create({ userId, refreshTokenHash: hash(refreshToken) });

// On logout: Revoke all sessions
await TokenRecord.deleteOne({ userId });
// → New login required on all devices

// On password change: Revoke all sessions + increment version
await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
await TokenRecord.deleteOne({ userId });
```

**Implications**:
- New login anywhere = previous sessions invalidated
- Safer (logout everywhere by default)
- Less admin burden
- Users must login again on other devices

**If future requires multi-device** (e.g., mobile + web coexist):
- Add `device_id` field to TokenRecord
- Change deletion: `deleteOne({ userId, device_id })`  
- Requires device ID in refresh request
- Revoke becomes: `updateOne({ userId, device_id }, { revoked: true })`

**⚠️ MUST CHOOSE NOW** - Switching later requires data migration

## Orders & Payments Architecture (Placeholder)

### Order Module Design

**Order is a Snapshot** (not a reference):
```javascript
// ❌ WRONG: Order references product
order.product_id = productId;
order.product = await Product.findById(productId);

// ✅ CORRECT: Order stores snapshot data
order = {
    product_name: product.name,
    variant_label: variant.label,
    price_at_order: variant.min_price, // Snapshot
    quantity: 10,
    line_total: quantity * price_at_order,
}
```

**Required Fields**:
- `product_name`, `variant_label` (immutable snapshot)
- `price_at_order` (snapshot from checkout time)
- `quantity_ordered`, `quantity_fulfilled` (tracking)
- `status`, `created_at`, `updated_at`

### Order Status Lifecycle

```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
         ↓
       FAILED (payment failed, revert cart)
         ↓
       CANCELED (before shipping)
```

**Transitions**:
- PENDING → PAID: Payment provider webhook
- PAID → PROCESSING: Admin action
- PROCESSING → SHIPPED: Fulfillment system
- SHIPPED → DELIVERED: Tracking system
- PAID → FAILED: Payment timeout/error
- Any → CANCELED: Customer or admin action

### Payment Integration Pattern

**External Provider** (Stripe, VNPay, etc.):
1. Client calls `/api/v1/payments/create` with order_id
2. Service creates Payment record with status `PENDING`
3. Service calls payment provider API, returns payment URL
4. Client completes payment on provider
5. Provider sends webhook to `/api/v1/payments/webhook/:provider`
6. Webhook handler verifies signature, updates Payment status
7. Payment status → Order status update

**Idempotency**: All payment operations must be idempotent (use idempotency key).

### Payment Failure & Rollback Rules

**If payment FAILS** (timeout, rejected, cancelled):

```javascript
// ✅ CORRECT: Rollback state
const rollback = async (orderId, variantId, qty) => {
    // 1. Set order status to FAILED
    await Order.updateOne(
        { _id: orderId },
        { status: 'FAILED' }
    );

    // 2. Restore stock (reverse the checkout deduction)
    await Variant.updateOne(
        { _id: variantId },
        {
            $inc: {
                'stock.available': +qty,      // Restore
                'stock.reserved': -qty        // Release reservation
            }
        }
    );

    // 3. Optional: Cart can be restored for retry (or keep deleted)
    // If keeping cart: Cart still valid for customer to retry payment
};
```

**Rules**:
- **Every failed payment MUST reverse stock** (or you lose inventory)
- **Order.status = FAILED** (not PENDING)
- **Stock reservation released immediately** (not after timeout)
- **Cart cleanup policy**: Define explicitly
  - Option A: Keep cart alive (customer retries easily)
  - Option B: Delete cart (force rebuild on retry)

**Webhook verification is MANDATORY**:
```javascript
// ✅ CORRECT: Always verify webhook signature
const verifyPaymentWebhook = (payload, signature, secret) => {
    const computed = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    if (computed !== signature) {
        throw new AppError('Invalid webhook signature', 401, 'WEBHOOK_VERIFICATION_FAILED');
    }
};
```

## Database & Infrastructure Rules

### Index Strategy

**Products Module**:
- `product.name` (text search)
- `product.slug` (partial: exclude deleted)
- `product.category_id` (filtering)
- `product.min_price` (range queries)

**Cart Module**:
- `cart.user_id` (user cart lookup)
- `cart.session_key` (guest cart lookup)
- `cart.status` (checkout filtering)
- `cart.expired_at` (TTL index, auto-cleanup)

**Token Module**:
- `tokenRecord.userId` (lookup on refresh)
- `tokenRecord.createdAt` (TTL index, 24h cleanup)

**Orders Module** (future):
- `order.user_id` (user order history)
- `order.status` (order state filtering)
- `order.created_at` (sorting)

### Transaction Rules

**Use transactions for**:
- Checkout (cart → order + payment)
- Multi-document writes with interdependencies
- Financial operations (refunds, price updates)

**Avoid transactions for**:
- Read-only APIs
- Simple single-document updates
- Cart additions (use atomic operators instead)

**Example** (future):
```javascript
// ✅ Checkout should use transaction
const session = await mongoose.startSession();
await session.withTransaction(async () => {
    const order = await Order.create([...], { session });
    await Cart.updateOne({...}, { session });
    await Payment.create([...], { session });
});
```

### Atomic Operations (Non-Transaction Alternative)

**When to use**: Cart operations, stock updates, counters
**MongoDB operators**: `$inc`, `$push`, `$set`, `$pull`

**Stock update example** (with $gte condition):
```javascript
// ✅ CORRECT: Atomic with mandatory condition
const result = await Variant.updateOne(
    {
        _id: variantId,
        'stock.available': { $gte: qty }  // ← Condition prevents insufficient stock
    },
    {
        $inc: { 
            'stock.available': -qty,
            'stock.reserved': +qty
        }
    }
);

if (result.modifiedCount === 0) {
    throw new AppError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
}
```

**Idempotency Pattern** (for operations that might be retried):
```javascript
// ✅ CORRECT: Use idempotency key to prevent duplicate operations
const idempotencyKey = `${userId}-${productId}-${Date.now()}`;

// Check if operation already processed
const existing = await OperationLog.findOne({ idempotencyKey });
if (existing) {
    return existing.result;  // Return cached result
}

// Execute operation
const result = await Cart.updateOne(...);

// Log the operation
await OperationLog.create({
    idempotencyKey,
    result,
    timestamp: new Date()
});

return result;
```

**Critical Rules**:
- **ALWAYS use `updateOne` not `findByIdAndUpdate`** (returns count, not doc)
- **ALWAYS check `modifiedCount === 0`** for failure detection
- **ALWAYS include conditions** on updates (e.g., `$gte`, `$lte`)
- **Use idempotency keys** for operations that might be retried (payments, order creation)

## Naming Conventions

- **Database fields**: snake_case (`category_id`, `is_deleted`, `created_at`)
- **Variables**: camelCase (`userId`, `productName`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_ACCESS_SECRET`)
- **Routes**: kebab-case (`/user-addresses`, `/variant-units`)

## API Response Format

Consistent structure (success + data/error):
```javascript
// Success (list with pagination)
{ "success": true, "data": [...], "pagination": { page, limit, total, totalPages } }

// Success (single)
{ "success": true, "data": {...} }

// Error (via errorHandler)
{ "success": false, "code": "ERROR_CODE", "message": "..." }
```

## Pagination & Filtering

**Pagination**: Query params `page` (default 1), `limit` (default 20, max 100)

**Products filtering**: Supports `category_id`, `min_price`, `max_price`, `status`, `search`
**Products sorting**: `sortBy` param supports `popular`, `rating`, `price_asc`, `price_desc`, `newest`

## Development Workflow

1. **Create new module**: Copy `modules/products/` or `modules/users/` structure as template
2. **Add routes**: Mount in `routes/index.js` with prefix
3. **Define validation**: Create Zod schemas in `module.validator.js`, apply via `validate()` middleware
4. **Implement service**: Keep business logic in service class; use `asyncHandler` in controller
5. **DTO mapping**: Transform Mongoose docs via mapper before returning
6. **Business rules**: Check invariants section before implementing features
7. **Testing**: Add Jest tests; run with `npm test`

## Common Pitfalls to Avoid

- ❌ Throwing generic `Error` - use `AppError` instead
- ❌ Mixing database logic in controllers - keep in service layer
- ❌ Forgetting `asyncHandler` wrapper - catches unhandled promise rejections
- ❌ Direct model manipulation - go through service layer for consistency
- ❌ Route ordering - specific routes MUST precede dynamic routes
- ❌ Exposing MongoDB `_id` in API - use mappers to transform to `id`
- ❌ Hardcoding validation - use Zod schemas in validators, not inline
- ❌ Cart read-modify-save pattern - use MongoDB atomic operators (`$push`, `$inc`)
- ❌ Direct save on nested updates - cascade through service layer
- ❌ Writing product prices directly - always call `ProductService.recalculatePricing()`
- ❌ Stock deduction at cart add - only deduct at order confirmation
- ❌ Modifying `price_at_added` - cart prices are immutable snapshots
- ❌ Storing full product docs in orders - use snapshots instead
