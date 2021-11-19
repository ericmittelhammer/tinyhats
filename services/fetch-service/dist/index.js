"use strict";

var _express = require("express");

var _multer = require("multer");

var _helpers = require("./src/helpers.js");

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 1337; // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use('/', router);
app.listen(PORT, () => {
  console.log(`API Gateway started on port ${PORT}`);
});
router.get('/fetch', upload.any(), async (req, res) => {
  let style = req.query.style;
  let hats = req.query.hats;
  console.log(hats);
  let face = await (0, _helpers.defaultBoss)();
  let b64Result = '';
  let numberHats = '';

  if (req.query.number != undefined) {
    numberHats = req.query.number;
  } else {
    numberHats = 1;
  }

  console.log(numberHats);

  if (hats == "true") {
    console.log("Getting hats");
    let data = await (0, _helpers.getHatData)();
    console.log(data);
    res.send(data);
  } else if (style != undefined) {
    console.log("No custom image, yes style");
    let hat = await (0, _helpers.getSpecificHat)(style);

    if (hat == null) {
      return res.status(400).send({
        message: 'This hat style does not exist! If you want this style - try submitting it'
      });
    }

    console.log("Got specific hat");
    b64Result = await (0, _helpers.requestManipulate)(face, hat, numberHats);
    res.send(b64Result);
  } else {
    console.log("No custom image, no style");
    let hat = await (0, _helpers.getRandomHat)();
    b64Result = await (0, _helpers.requestManipulate)(face, hat, numberHats);
    res.send(b64Result);
  }
});
router.post('/fetch', upload.any(), async (req, res) => {
  let style = req.query.style;
  let face = req.files[0].buffer;
  let b64Result = '';
  let numberHats = '';

  if (req.query.number != undefined) {
    numberHats = parseInt(req.query.number);
  } else {
    numberHats = 1;
  }

  if (style != undefined) {
    console.log("Custom image, no style");
    let hat = await (0, _helpers.getSpecificHat)(style);
    b64Result = await (0, _helpers.requestManipulate)(face, hat, numberHats);
  } else {
    console.log("Custom image, yes style");
    let hat = await (0, _helpers.getRandomHat)();
    b64Result = await (0, _helpers.requestManipulate)(face, hat, numberHats);
  }

  res.send(b64Result);
});