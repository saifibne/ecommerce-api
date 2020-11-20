const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../models/user");
const Product = require("../models/product");

exports.postSignIn = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(203).json({
      message: "Some validation error occurred.",
      status: 203,
    });
  }
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const companyName = req.body.companyName;
  let user;
  const hashedPassword = await bcrypt.hash(password, 12);
  if (!hashedPassword) {
    return res.status(500).json({
      message: "some error with bcrypt.",
      status: 500,
    });
  }
  const newUser = new User({
    name: name,
    email: email,
    password: hashedPassword,
    companyName: companyName,
    cart: {
      items: [],
      totalPrice: 0,
    },
    wishList: [],
    products: [],
    ratings: [],
    totalRating: 0,
  });
  try {
    user = await newUser.save();
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!user) {
    return res.status(500).json({
      message: "server error occurred.",
      status: 500,
    });
  }
  res.status(200).json({
    message: "success",
  });
};

exports.postLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(203).json({
      message: "Some validation error occurred.",
      status: 203,
    });
  }
  const email = req.body.email;
  const password = req.body.password;
  let user;
  let token;
  try {
    user = await User.findOne({ email: email });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!user) {
    return res.status(200).json({
      message: "email address dont match.",
      status: 401,
    });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(200).json({
      message: "password doesn't match.",
      status: 401,
    });
  }
  const expireTime = new Date(new Date().getTime() + 3600 * 1000);
  try {
    token = jwt.sign(
      {
        userId: user._id.toString(),
        expireTime: expireTime,
        email: user.email,
      },
      "someSuperSecret",
      { expiresIn: 3600 }
    );
  } catch (error) {
    return res.status(501).json({
      message: "jwt error",
      errorData: error,
    });
  }
  if (!token) {
    return res.status(401).json({
      message: "some error generating the token.",
    });
  }
  res.status(200).json({
    message: "successfully login.",
    token: token,
    expireTime: expireTime,
    userData: {
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      products: user.products,
      totalRating: user.totalRating,
      rating: user.ratings,
    },
  });
};

exports.getUserData = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized to add product.",
      status: 401,
    });
  }
  const bearerToken = req.get("Authorization");
  const token = bearerToken.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "someSuperSecret");
  } catch (error) {
    return res.status(400).json({
      message: "can't verify token.",
      errorData: error,
    });
  }
  let user;
  try {
    user = await User.findOne({ _id: req.userId });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!user) {
    return res.status(300).json({
      message: "couldn't find the user",
      status: 300,
    });
  }
  res.status(200).json({
    message: "success",
    userData: user,
    expireTime: decodedToken.expireTime,
    token: token,
  });
};

exports.getEmailCheck = async (req, res, next) => {
  const email = req.query.email;
  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (user) {
    return res.status(203).json({
      emailFound: "success",
    });
  }
  return res.status(203).json({
    emailFound: "failed",
  });
};

exports.getCart = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  const userId = req.userId;
  let user;
  try {
    user = await User.findOne({ _id: userId }).populate({
      path: "cart.items.productId",
      select: "name originalPrice offerPrice imageUrls",
    });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!user) {
    return res.status(300).json({
      message: "Can't find user.",
      status: 300,
    });
  }
  const populatedUser = user.populate({
    path: "cart.items.productId",
  });
  const cart = populatedUser.cart;
  res.status(200).json({
    message: "success",
    cart: cart,
  });
};

exports.addToCart = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  const productId = req.params.productId;
  const code = req.body.code;
  let user;
  let product;
  try {
    user = await User.findOne({ _id: req.userId }).populate({
      path: "cart.items.productId",
      select: "name",
    });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  try {
    product = await Product.findOne({ _id: productId }).populate({
      path: "userId",
      select: "companyName",
    });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!user || !product) {
    return res.status(300).json({
      message: "Can't find user or product",
      status: 300,
    });
  }
  let newItems = [...user.cart.items];
  let newPrice = user.cart.totalPrice;
  let updatedItemData;
  const existingItemIndex = newItems.findIndex(
    (eachItem) => eachItem.productId._id.toString() === productId.toString()
  );
  if (code === "add") {
    if (existingItemIndex !== -1) {
      newItems[existingItemIndex].quantity += 1;
      updatedItemData = newItems[existingItemIndex];
    } else {
      newItems.push({
        productId: productId,
        seller: product.userId.companyName,
        quantity: 1,
      });
    }
    newPrice += product.offerPrice;
  } else if (code === "remove") {
    if (existingItemIndex !== -1 && newItems[existingItemIndex].quantity > 1) {
      newItems[existingItemIndex].quantity -= 1;
      newPrice -= product.offerPrice;
      updatedItemData = newItems[existingItemIndex];
    }
  } else if (code === "delete") {
    if (existingItemIndex !== -1) {
      const updatedItems = newItems.filter(
        (eachItem) => eachItem.productId._id.toString() !== productId.toString()
      );
      const reducePrice =
        product.offerPrice * newItems[existingItemIndex].quantity;
      newItems = updatedItems;
      newPrice -= reducePrice;
    }
  }
  user.cart.items = newItems;
  user.cart.totalPrice = newPrice;
  try {
    await user.save();
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred while saving.",
      errorData: error,
      status: 500,
    });
  }
  res.status(200).json({
    message: "Added to cart",
  });
};

exports.postAddWishList = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  const productId = req.params.productId;
  let user;
  try {
    user = await User.findOne({ _id: req.userId });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  const newWishListArray = [...user.wishList];
  const wishListItemIndex = newWishListArray.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );
  if (wishListItemIndex !== -1) {
    return res.status(302).json({
      message: "Item already wishlisted.",
      status: 302,
    });
  } else {
    newWishListArray.push({ productId: productId });
  }
  user.wishList = newWishListArray;
  try {
    await user.save();
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred while saving.",
      errorData: error,
      status: 500,
    });
  }
  res.status(200).json({
    message: "Item added to wishList successfully.",
  });
};

exports.getWishList = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  let user;
  try {
    user = await User.findOne({ _id: req.userId }).populate({
      path: "wishList.productId",
      select:
        "name offerPrice originalPrice imageUrls totalRating ratingCount category",
    });
  } catch (error) {
    return res.status(500).json({
      message: "server error occurred.",
      errorData: error,
      status: 500,
    });
  }
  if (!user) {
    return res.status(302).json({
      message: "Can't find user.",
      status: 302,
    });
  }
  res.status(200).json({
    message: "success",
    wishList: user.wishList,
  });
};

exports.deleteWishListItem = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "you are not authorized.",
      status: 401,
    });
  }
  const wishItemId = req.params.wishItemId;
  try {
    await User.update(
      { _id: req.userId },
      { $pull: { wishList: { productId: wishItemId } } }
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
  });
};
