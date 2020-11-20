const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],
  companyName: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        seller: String,
        quantity: Number,
      },
    ],
    totalPrice: Number,
  },
  wishList: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],
  totalRating: Number,
  ratings: [
    {
      rating: Number,
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      creation: Date,
      comment: String,
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
