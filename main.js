require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const imagemin = require("imagemin");
const imageminWebp = require("imagemin-webp");

const productRoutes = require("./routes/product");
const userRoutes = require("./routes/user");
const deleteUtil = require("./middlewares/delete");

const app = express();

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const filter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(bodyParser.json());
app.use(
  multer({ storage: multerStorage, fileFilter: filter }).array("imageUrl", 6)
);
app.use(async (req, res, next) => {
  if (req.files) {
    const fileNames = req.files.map((item) => {
      return item.path;
    });
    req.updatedImages = await imagemin(fileNames, {
      destination: "build/images",
      plugins: [imageminWebp()],
    });
    for (let file of fileNames) {
      deleteUtil.fileDelete(file);
    }
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  next();
});

app.use(productRoutes);
app.use(userRoutes);

mongoose
  .connect("mongodb://127.0.0.1:27017/ecommerce", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((result) => {
    console.log("Connected to the database.");
    app.listen(3000);
  })
  .catch((error) => {
    console.log(error);
  });
