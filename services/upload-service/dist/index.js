"use strict";

var _express = require("express");

var _multer = require("multer");

var _helpers = require("./src/helpers.js");

require('newrelic');

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 8080; // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use('/', router);
app.listen(PORT, () => {
  console.log(`API Gateway started on port ${PORT}`);
});
router.post('/upload', upload.any(), async (req, res) => {
  console.log("Started");
  let image = req.files[0].buffer;
  let name = req.body.name.toLowerCase();
  let fileName = (0, _helpers.uniqueId)(); // parse from body

  console.log(fileName, name, image); // determine file extension

  let ext = (0, _helpers.fileExt)(req.body.mimeType); // base64 image to binary data

  console.log("Image received");
  let imageData = Buffer.from(image, 'base64'); // upload to s3

  let link = await (0, _helpers.uploadFile)(fileName + ext, imageData); // push to rds

  let data = await (0, _helpers.push2RDS)(fileName, ext, name, link);
  res.send(data);
});