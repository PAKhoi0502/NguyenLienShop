const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const userAddressRoutes = require("../modules/user_addresses/user_addresses.routes");


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/user-addresses", userAddressRoutes);


module.exports = router;