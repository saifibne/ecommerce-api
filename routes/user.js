const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");
const authController = require("../middlewares/auth");

const router = express.Router();

router.get("/userData", authController.auth, userController.getUserData);
router.get("/email-search", userController.getEmailCheck);
router.get("/cart", authController.auth, userController.getCart);
router.post("/cart/:productId", authController.auth, userController.addToCart);
router.get(
  "/wishlist/:productId",
  authController.auth,
  userController.postAddWishList
);
router.get("/get-wishlist", authController.auth, userController.getWishList);
router.put(
  "/signin",
  [
    body("name").isLength({ min: 4 }),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }).trim(),
    body("companyName").isLength({ min: 4 }),
  ],
  userController.postSignIn
);
router.put(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 }).trim()],
  userController.postLogin
);
router.delete(
  "/wishlist/:wishItemId",
  authController.auth,
  userController.deleteWishListItem
);

module.exports = router;
