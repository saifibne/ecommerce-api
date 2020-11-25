const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    offerPrice: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrls: [
      {
        path: {
          type: String,
          required: true,
        },
        key: {
          type: String,
          required: true,
        },
        sorting: Number,
      },
    ],
    totalRating: Number,
    ratings: [
      {
        rating: Number,
        creation: Date,
        title: String,
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        comments: {
          message: String,
          reply: [
            {
              userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
              },
              message: String,
            },
          ],
        },
      },
    ],
    ratingCount: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
