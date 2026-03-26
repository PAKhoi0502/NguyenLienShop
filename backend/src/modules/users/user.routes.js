const express = require("express");
const { ZodError } = require("zod");
const userController = require("./user.controller");
const { updateUserSchema } = require("./user.validator"); // Thêm import
const { authorize } = require("../../middlewares/authorize.middleware");
const { authenticate } = require("../../middlewares/auth.middleware");

const router = express.Router();

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body || {});
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                message: error.issues.map((e) => e.message).join("; "),
            });
        }
        return next(error);
    }
};

router.get("/me", authenticate, userController.getMe);

router.get("/", authenticate, authorize(["ADMIN"]), userController.getAllUsers);

router.patch("/:id", authenticate, validate(updateUserSchema), userController.updateUser); // Thêm validate
router.delete("/:id", authenticate, userController.deleteUser);

router.patch(
    "/:id/roles",
    authenticate,
    authorize(["ADMIN"]),
    userController.updateUserRoles
);

module.exports = router;