const User = require('./user.model');
const UserMapper = require('./user.mapper');
const AppError = require('../../utils/appError.util');

class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return UserMapper.toResponseDTO(user);
    }

    /**
     * Get current authenticated user
     */
    async getMe(userId) {
        return this.getUserById(userId);
    }

    /**
     * Get all users with pagination
     */
    async getAllUsers(page = 1, limit = 20, search = null, status = null) {
        const skip = (page - 1) * limit;
        const filter = {};

        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.full_name': { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            filter.status = status;
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ created_at: -1 });

        return {
            data: UserMapper.toResponseDTOList(users),
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                per_page: limit,
            },
        };
    }

    /**
     * Update user profile
     * @param {String} userId - User ID
     * @param {Object} updateData - Data from UserMapper.toUpdatePayload()
     */
    async updateUser(userId, updateData) {
        if (!updateData || Object.keys(updateData).length === 0) {
            throw new AppError(
                'No valid fields to update',
                400,
                'VALIDATION_ERROR'
            );
        }

        try {
            const updated = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updated) {
                throw new AppError('User not found', 404, 'USER_NOT_FOUND');
            }

            return UserMapper.toResponseDTO(updated);
        } catch (error) {
            // Handle MongoDB duplicate key error
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw new AppError(
                    `${field} already exists`,
                    409,
                    'DUPLICATE_FIELD'
                );
            }
            throw error;
        }
    }

    /**
     * Delete user (soft delete)
     */
    async deleteUser(userId) {
        const user = await User.findByIdAndUpdate(
            userId,
            { deleted_at: new Date() },
            { new: true }
        );

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return { message: 'User deleted successfully' };
    }

    /**
     * Update user roles (admin only)
     */
    async updateUserRoles(userId, roles) {
        if (!Array.isArray(roles) || roles.length === 0) {
            throw new AppError(
                'Roles must be a non-empty array',
                400,
                'VALIDATION_ERROR'
            );
        }

        // Validate role enum
        const validRoles = ['CUSTOMER', 'MANAGER', 'ADMIN'];
        const invalidRoles = roles.filter((r) => !validRoles.includes(r));

        if (invalidRoles.length > 0) {
            throw new AppError(
                `Invalid roles: ${invalidRoles.join(', ')}`,
                400,
                'INVALID_ROLE'
            );
        }

        const updated = await User.findByIdAndUpdate(
            userId,
            { roles },
            { new: true }
        );

        if (!updated) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return UserMapper.toResponseDTO(updated);
    }

    /**
     * Logout all devices (increment token version)
     */
    async logoutAllDevices(userId) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { token_version: 1 } },
            { new: true }
        );

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return { message: 'Logged out from all devices' };
    }

    /**
     * Verify token version (check if token is revoked)
     */
    async verifyTokenVersion(userId, tokenVersion) {
        const user = await User.findById(userId).select('+token_version');

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        if (user.token_version !== tokenVersion) {
            throw new AppError(
                'Token has been revoked',
                401,
                'TOKEN_REVOKED'
            );
        }

        return true;
    }

    /**
     * Get user with token version (for auth middleware)
     */
    async getUserWithTokenVersion(userId) {
        const user = await User.findById(userId).select(
            '+token_version'
        );

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return user;
    }
}

module.exports = new UserService();