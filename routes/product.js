const express = require("express");
const { body } = require("express-validator");

const productController = require("../controllers/product");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

router.get("/products", productController.getProducts);
router.get(
  "/admin/products",
  authMiddleware.auth,
  productController.getAdminProducts
);
router.get("/slideshow/:category", productController.getSlideShowCategory);
router.get("/products/:category", productController.getProductsCategory);
router.get("/product/:productId", productController.getSingleProduct);
router.get("/orders", authMiddleware.auth, productController.getOrder);
router.post(
  "/add-product",
  authMiddleware.auth,
  [
    body("name").isLength({ min: 6 }),
    body("description").isLength({ min: 6 }),
    body("price").isNumeric().isLength({ min: 1 }).trim(),
    body("category").notEmpty(),
  ],
  productController.postAddProduct
);
router.post(
  "/product/comment/:productId",
  authMiddleware.auth,
  [
    body("title").isLength({ min: 1 }),
    body("comment").isLength({ min: 1 }),
    body("rating").isNumeric().notEmpty(),
  ],
  productController.postAddComment
);
router.post(
  "/product/comment/reply/:productId",
  authMiddleware.auth,
  body("comment").notEmpty(),
  productController.postCommentReply
);
router.post("/order", authMiddleware.auth, productController.postOrder);
router.get("/search", productController.searchProduct);
router.delete("/delete/:productId", productController.deleteProduct);

module.exports = router;
