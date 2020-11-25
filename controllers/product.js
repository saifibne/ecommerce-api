const { validationResult } = require("express-validator");
const aws = require("aws-sdk");

const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const deleteMiddleware = require("../middlewares/delete");

exports.getProducts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 10;
  let productsData;
  try {
    productsData = await Product.find()
      .skip((currentPage - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!productsData) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  res.status(200).json({
    productsData: productsData,
  });
};

exports.getSingleProduct = async (req, res, next) => {
  const productId = req.params.productId;
  let product;
  try {
    product = await Product.findOne({ _id: productId })
      .populate("userId")
      .populate({
        path: "ratings.userId",
        select: "name",
      })
      .populate({
        path: "ratings.comments.reply.userId",
        select: "name",
      });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!product) {
    return res.status(402).json({
      message: "Can't find product with that given id.",
      status: 402,
    });
  }
  res.status(200).json({
    message: "successfully found product.",
    productData: {
      ...product._doc,
      userId: {
        email: product.userId.email,
        companyName: product.userId.companyName,
        ratings: product.userId.ratings,
      },
    },
  });
};

exports.getSlideShowCategory = async (req, res, next) => {
  const category = req.params.category;
  let productsData;
  try {
    productsData = await Product.find({ category: category })
      .select("imageUrls originalPrice offerPrice")
      .limit(10);
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!productsData) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  res.status(200).json({
    productsData: productsData,
  });
};

exports.getProductsCategory = async (req, res, next) => {
  const category = req.params.category;
  const sortBy = req.query.sortBy || "newArrivals";
  let productsData;
  switch (sortBy) {
    case "newArrivals":
      try {
        productsData = await Product.find({ category: category })
          .select(
            "imageUrls originalPrice offerPrice totalRating name ratingCount category"
          )
          .sort({ createdAt: -1 });
      } catch (error) {
        return res.status(500).json({
          message: "server error occurred.",
          errorData: error,
          status: 500,
        });
      }
      break;
    case "ratings":
      try {
        productsData = await Product.find({ category: category })
          .select(
            "imageUrls originalPrice offerPrice totalRating name ratingCount category"
          )
          .sort({ totalRating: -1, ratingCount: -1 });
      } catch (error) {
        return res.status(500).json({
          message: "server error occurred.",
          errorData: error,
          status: 500,
        });
      }
      break;
    case "addedDate":
      try {
        productsData = await Product.find({ category: category })
          .select(
            "imageUrls originalPrice offerPrice totalRating name ratingCount category"
          )
          .sort({ createdAt: 1 });
      } catch (error) {
        return res.status(500).json({
          message: "server error occurred.",
          errorData: error,
          status: 500,
        });
      }
      break;
  }
  if (!productsData) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  res.status(200).json({
    productsData: productsData,
  });
};

exports.getAdminProducts = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  let adminProducts;
  try {
    adminProducts = await Product.find({ userId: req.userId }).select(
      "name createdAt updatedAt imageUrls"
    );
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  res.status(200).json({
    message: "success",
    products: adminProducts,
  });
};

exports.postAddProduct = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized to add product.",
      status: 401,
    });
  }
  const awsConnection = new aws.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(203).json({
      message: "Some validation error occurred.",
      status: 203,
    });
  }
  const name = req.body.name;
  const price = req.body.price;
  const description = req.body.description;
  const imageUrl = req.updatedImages;
  const category = req.body.category;
  const imageUrls = [];
  if (!imageUrl) {
    return res.status(203).json({
      message: "Provide some images",
      status: 203,
    });
  }
  if (imageUrl && imageUrl.length > 0) {
    for (let image of imageUrl) {
      const imageName = image.destinationPath.split("/")[2];
      const s3Param = {
        Bucket: "ecommerce-appbucket",
        Key: imageName,
        Body: image.data,
      };
      const imageIndex = imageUrl.findIndex(
        (item) => item.destinationPath === image.destinationPath
      );
      awsConnection.upload(s3Param, (error, data) => {
        imageUrls.push({
          path: data.Location,
          key: data.Key,
          sorting: imageIndex,
        });
        deleteMiddleware.fileDelete(image.destinationPath);
        if (imageUrls.length === imageUrl.length) {
          const newProduct = new Product({
            name: name,
            originalPrice: price,
            offerPrice: price,
            description: description,
            imageUrls: imageUrls,
            totalRating: 0,
            ratings: [],
            ratingCount: 0,
            category: category,
            userId: req.userId,
          });
          newProduct
            .save()
            .then(() => {
              return res.status(200).json({
                message: "success",
              });
            })
            .catch(() => {
              res.status(500).json({
                message: "some database error",
              });
            });
        }
      });
    }
  }
};

exports.postAddComment = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized to add comment.",
      status: 401,
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(203).json({
      message: "Some validation error occurred.",
      status: 203,
    });
  }
  const productId = req.params.productId;
  const title = req.body.title;
  const comment = req.body.comment;
  const rating = +req.body.rating;
  const userId = req.userId;
  let product;
  try {
    product = await Product.findOne({ _id: productId });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!product) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  if (product) {
    for (let rating of product.ratings) {
      if (rating.userId.toString() === userId.toString()) {
        return res.status(200).json({
          message: "you already commented",
          status: 301,
        });
      }
    }
  }
  if (product.ratings.length === 0) {
    product.totalRating = rating;
  } else {
    product.totalRating = ((product.totalRating + rating) / 2).toFixed(2);
  }
  const newProductRating = [...product.ratings];
  newProductRating.push({
    rating: rating,
    userId: userId,
    title: title,
    creation: new Date(),
    comments: {
      message: comment,
      reply: [],
    },
  });
  product.ratings = newProductRating;
  product.ratingCount += 1;
  await product.save();
  res.status(200).json({
    message: "comment added successfully.",
    status: 200,
  });
};

exports.postCommentReply = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized to add reply.",
      status: 401,
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(203).json({
      message: "Some validation error occurred.",
      status: 203,
    });
  }
  const comment = req.body.comment;
  const userId = req.userId;
  const commentId = req.query.commentId;
  const productId = req.params.productId;
  let product;
  try {
    product = await Product.findOne({ _id: productId });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!product) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  const newProductRatings = [...product.ratings];
  const commentIndex = newProductRatings.findIndex((rating) => {
    return rating._id.toString() === commentId.toString();
  });
  if (commentIndex !== -1) {
    for (let reply of newProductRatings[commentIndex].comments.reply) {
      if (reply.userId.toString() === userId.toString()) {
        return res.status(200).json({
          message: "you already added reply",
          status: 301,
        });
      }
    }
  }
  newProductRatings[commentIndex].comments.reply.push({
    userId: userId,
    message: comment,
  });
  product.ratings = newProductRatings;
  await product.save();
  res.status(200).json({
    message: "reply added successfully.",
    status: 200,
  });
};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;
  let product;
  try {
    product = await Product.findOne({ _id: productId });
  } catch (error) {
    return res.status(500).json({
      message: "server error to find the product.",
      errorData: error,
    });
  }
  if (!product) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  try {
    await Product.findByIdAndRemove(productId);
  } catch (error) {
    return res.status(500).json({
      message: "problem in server to delete the product.",
      errorData: error,
    });
  }
  const awsConnection = new aws.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });
  for (let imageUrl of product.imageUrls) {
    const params = {
      Bucket: "ecommerce-appbucket",
      Key: imageUrl.key,
    };
    awsConnection.deleteObject(params, (error, data) => {
      if (error) {
        console.log(error);
      }
    });
  }
  res.status(200).json({
    message: "product successfully deleted.",
  });
};

exports.searchProduct = async (req, res, next) => {
  const productName = req.query.search;
  let products = [];
  if (productName !== "") {
    try {
      await Product.collection.createIndex({ name: "text" });
      await Product.collection.createIndex({ name: 1 });
      products = await Product.find(
        {
          $or: [
            { $text: { $search: productName } },
            { name: { $regex: `^${productName}`, $options: "i" } },
          ],
        },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .select("name category totalRating ratingCount offerPrice imageUrls");
    } catch (error) {
      if (error) {
        return res.status(500).json({
          message: "Some database error happened.",
          error: error,
        });
      }
    }
  }
  res.status(200).json({
    productsData: products,
  });
};

exports.postOrder = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  let user;
  if (req.body) {
    const newOrderItemsArray = req.body.map((item) => {
      return { ...item, userId: req.userId };
    });
    try {
      await Order.insertMany(newOrderItemsArray);
    } catch (error) {
      return res.status(500).json({
        message: "server error.",
        errorData: error,
      });
    }
  }
  try {
    user = await User.findOne({ _id: req.userId });
  } catch (error) {
    return res.status(500).json({
      message: "server error.",
      errorData: error,
    });
  }
  user.cart.items = [];
  user.cart.totalPrice = 0;
  try {
    await user.save();
  } catch (error) {
    return res.status(500).json({
      message: "server error.",
      errorData: error,
    });
  }
  res.status(200).json({
    message: "successfully placed order.",
  });
};

exports.getOrder = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  let orders;
  try {
    orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
  } catch (error) {
    return res.status(500).json({
      message: "server error.",
      errorData: error,
    });
  }
  res.status(200).json({
    message: "success",
    orders: orders,
  });
};
