const express = require("express");
const router = express.Router();

// ===== IMPORT EXISTING ROUTES =====
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const userAddressRoutes = require("../modules/user_addresses/user_addresses.routes");
const categoryRoutes = require("../modules/categories/category.routes");

// ===== IMPORT NEW PRODUCT MODULE ROUTES =====
const productModuleRoutes = require("../modules/products/routes");

// ===== FUTURE ROUTES (Placeholder) =====
// const cartRoutes = require("../modules/carts/cart.routes");
// const orderRoutes = require("../modules/orders/order.routes");
// const paymentRoutes = require("../modules/payments/payment.routes");

// ============================================================================
// ===== MOUNT ALL ROUTES =====
// ============================================================================

// ✅ Auth routes (no prefix)
router.use("/auth", authRoutes);

// ✅ User routes
router.use("/users", userRoutes);

// ✅ User address routes
router.use("/user-addresses", userAddressRoutes);

// ✅ Category routes
router.use("/categories", categoryRoutes);

// ✅ Product module routes (contains: products, variants, variant-units)
// Routes structure:
// - /products (GET all, POST create, etc.)
// - /products/:productId/variants (GET variants, POST create variant)
// - /variants/:variantId (GET, PATCH, DELETE variant)
// - /variant-units/:unitId (GET, PATCH, DELETE unit)
// - /variants/:variantId/units (GET units, POST create unit)
router.use("/", productModuleRoutes);

// ===== FUTURE ROUTES (Add when ready) =====
// router.use("/carts", cartRoutes);
// router.use("/orders", orderRoutes);
// router.use("/payments", paymentRoutes);

// ============================================================================
// ===== 404 HANDLER =====
// ============================================================================

router.use((req, res) => {
    res.status(404).json({
        success: false,
        code: "ROUTE_NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

module.exports = router;