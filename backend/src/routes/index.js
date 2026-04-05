const express = require("express");
const router = express.Router();

// ===== IMPORT EXISTING ROUTES =====
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const userAddressRoutes = require("../modules/user_addresses/user_addresses.routes");
const categoryRoutes = require("../modules/categories/category.routes");
const productModuleRoutes = require("../modules/products/routes");
const discountRoutes = require("../modules/discounts/discount.routes");
const cartRoutes = require("../modules/carts/cart.routes");
const shipmentRoutes = require('../modules/shipments/shipment.routes');


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

// ✅ Mount cart routes at /carts prefix
router.use("/carts", cartRoutes);

// ✅ Mount discount routes at /discounts prefix
router.use("/discounts", discountRoutes);

// Mount at /api/v1/shipments
router.use('/shipments', shipmentRoutes);


// ✅ Product module routes (contains: products, variants, variant-units)
// Routes structure:
// - /products (GET all, POST create, etc.)
// - /products/:productId/variants (GET variants, POST create variant)
// - /variants/:variantId (GET, PATCH, DELETE variant)
// - /variant-units/:unitId (GET, PATCH, DELETE unit)
// - /variants/:variantId/units (GET units, POST create unit)
router.use("/", productModuleRoutes);

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