const express = require('express');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const PaymentController = require('./payment.controller');
const {
    createPaymentSchema,
    getPaymentSchema,
    getPaymentQuerySchema,
    listPaymentsSchema,
    cancelPaymentSchema,
} = require('./payment.validator');

const router = express.Router();

/**
 * ============================================
 * PAYMENT ROUTES
 * ============================================
 * 
 * Route Structure (Specific → Dynamic):
 * 1. Public webhooks (no auth)
 * 2. Customer endpoints (auth required)
 * 3. Admin endpoints (admin role required)
 * 
 * ✅ Specific routes BEFORE dynamic routes
 * ✅ Webhook routes BEFORE payment creation
 */

// ===== PUBLIC ENDPOINTS (No Auth) =====

/**
 * POST /api/v1/payments/webhook/vnpay
 * VNPay IPN webhook notification
 * 
 * ⚠️ CRITICAL: No validation middleware (accept raw VNPay format)
 * ⚠️ Signature verification in service layer
 */
router.post('/webhook/vnpay', PaymentController.handleVNPayWebhook);

/**
 * POST /api/v1/payments/webhook/stripe
 * Stripe webhook event
 * 
 * ⚠️ CRITICAL: No validation middleware (accept raw Stripe format)
 * ⚠️ Signature from x-stripe-signature header
 */
router.post('/webhook/stripe', PaymentController.handleStripeWebhook);

/**
 * POST /api/v1/payments/webhook/paypal
 * PayPal webhook event
 * 
 * ⚠️ CRITICAL: No validation middleware (accept raw PayPal format)
 */
router.post('/webhook/paypal', PaymentController.handlePayPalWebhook);

// ===== CUSTOMER ENDPOINTS (Authenticated) =====

/**
 * POST /api/v1/payments
 * Create payment for order
 * 
 * ✅ Auth required
 * ✅ Validate body: order_id, provider
 */
router.post(
    '/',
    authenticate(),
    validate({ body: createPaymentSchema }),
    PaymentController.createPayment
);

/**
 * GET /api/v1/payments/stats (Admin)
 * IMPORTANT: This SPECIFIC route must come BEFORE /:paymentId
 * Otherwise /stats gets caught by /:paymentId
 */
router.get('/stats', authenticate(), PaymentController.getPaymentStats);

/**
 * GET /api/v1/payments/:paymentId
 * Get payment details
 * 
 * ✅ Auth required
 * ✅ Validate params: paymentId (ObjectId)
 * ✅ Validate query: format (optional)
 */
router.get(
    '/:paymentId',
    authenticate(),
    validate({
        params: getPaymentSchema,
        query: getPaymentQuerySchema,
    }),
    PaymentController.getPayment
);

/**
 * GET /api/v1/payments
 * List user's payments (or all payments if admin)
 * 
 * ✅ Auth required
 * ✅ Validate query: page, limit, status, provider, date_from, date_to
 */
router.get(
    '/',
    authenticate(),
    validate({ query: listPaymentsSchema }),
    PaymentController.listPayments
);

/**
 * GET /api/v1/orders/:orderId/payment
 * Get payment for order
 * 
 * Note: This route is mounted here but path uses /orders
 * Consider mounting at orders router instead:
 * router.get('/:orderId/payment', PaymentController.getPaymentByOrder)
 * (in orders.routes.js)
 */
// (Alternative: mount in orders.routes.js)

/**
 * POST /api/v1/payments/:paymentId/retry
 * Retry a failed payment
 * 
 * ✅ Auth required
 * ✅ Validate params: paymentId
 */
router.post(
    '/:paymentId/retry',
    authenticate(),
    PaymentController.retryPayment
);

/**
 * POST /api/v1/payments/:paymentId/cancel
 * Cancel a pending payment
 * 
 * ✅ Auth required
 * ✅ Validate params: paymentId
 * ✅ Validate body: reason (optional)
 */
router.post(
    '/:paymentId/cancel',
    authenticate(),
    validate({ body: cancelPaymentSchema }),
    PaymentController.cancelPayment
);

// ===== ADMIN ENDPOINTS =====

/**
 * GET /api/v1/admin/payments
 * Admin: List all payments
 * 
 * ✅ Admin role required
 * ✅ Validate query: page, limit, status, provider, etc
 */
router.get(
    '/admin',
    authenticate(),
    validate({ query: listPaymentsSchema }),
    PaymentController.adminListPayments
);

/**
 * POST /api/v1/admin/payments/:paymentId/verify
 * Admin: Manually verify payment
 * 
 * ✅ Admin role required
 * ✅ For debugging failed webhooks
 */
router.post(
    '/admin/:paymentId/verify',
    authenticate(),
    PaymentController.adminVerifyPayment
);

/**
 * DELETE /api/v1/admin/payments/:paymentId
 * Admin: Soft-delete payment
 * 
 * ✅ Admin role required
 * ✅ Soft delete (audit trail)
 */
router.delete(
    '/admin/:paymentId',
    authenticate(),
    PaymentController.adminDeletePayment
);

module.exports = router;