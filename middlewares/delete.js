const fs = require("fs");
const path = require("path");

exports.fileDelete = (filePath) => {
  const imagePath = path.join(__dirname, "..", filePath);
  fs.unlink(imagePath, (error) => {
    // console.log(error);
  });
};
