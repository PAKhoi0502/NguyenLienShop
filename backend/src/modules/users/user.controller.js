const asyncHandler = require('../../utils/asyncHandler.util');
const userService = require('./user.service');
const UserMapper = require('./user.mapper');
const { validateObjectId } = require('../../utils/validator.util'); // Giữ lại nếu cần
const { checkOwnershipOrAdmin, checkAuthenticated } = require('../../middlewares/authorize.middleware');

const assertAuthContext = (req) => {
    checkAuthenticated(req.user);
    return req.user;
};

/**
 * GET /users/me
 * Get current authenticated user profile
 */
const getMe = asyncHandler(async (req, res) => {
    assertAuthContext(req);

    const user = await userService.getMe(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

/**
 * GET /users
 * Get all users (admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || null;
    const status = req.query.status || null;

    const result = await userService.getAllUsers(
        page,
        limit,
        search,
        status
    );

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
    });
});

/**
 * PATCH /users/:id
 * Update user profile (owner or admin)
 */
const updateUser = asyncHandler(async (req, res) => {
    const user = assertAuthContext(req);
    validateObjectId(req.params.id);
    checkOwnershipOrAdmin(user.id, req.params.id, user.roles);

    // Middleware đã validate req.body, nên dùng trực tiếp
    const updatePayload = UserMapper.toUpdatePayload(req.body);

    // Step 3: Call service
    const updated = await userService.updateUser(
        req.params.id,
        updatePayload
    );

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updated,
    });
});

/**
 * DELETE /users/:id
 * Delete user (owner or admin, soft delete)
 */
const deleteUser = asyncHandler(async (req, res) => {
    const user = assertAuthContext(req);
    validateObjectId(req.params.id);
    checkOwnershipOrAdmin(user.id, req.params.id, user.roles);

    const result = await userService.deleteUser(req.params.id);

    res.status(200).json({
        success: true,
        message: result.message,
    });
});

/**
 * PATCH /users/:id/roles
 * Update user roles (admin only)
 */
const updateUserRoles = asyncHandler(async (req, res) => {
    assertAuthContext(req);
    validateObjectId(req.params.id);

    const { roles } = req.body;

    const updated = await userService.updateUserRoles(
        req.params.id,
        roles
    );

    res.status(200).json({
        success: true,
        message: 'User roles updated successfully',
        data: updated,
    });
});

module.exports = {
    getMe,
    getAllUsers,
    updateUser,
    deleteUser,
    updateUserRoles,
};