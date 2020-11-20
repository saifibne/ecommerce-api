const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    productId: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Product,",
    },
    userId: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    price: {
      required: true,
      type: Number,
    },
    name: {
      required: true,
      type: String,
    },
    deliveryDate: {
      required: true,
      type: Date,
    },
    seller: {
      required: true,
      type: String,
    },
    imageUrl: {
      required: true,
      type: String,
    },
    quantity: {
      required: true,
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
