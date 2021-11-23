"use strict";

var _newrelic = require("newrelic");

var _express = require("express");

var _multer = require("multer");

var _url = require("url");

var _helpers = require("./src/helpers.js");

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 1337; // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use('/', router);
app.listen(PORT, () => {
  console.log(`Hats Service started on port ${PORT}`);
});

async function numHats(req, res, next) {
  next();
}

router.get('/list', async (req, res) => {
  console.log("Getting hats");
  let data = await (0, _helpers.getHatData)();
  console.log(`fetched ${data.length} hats`);

  _newrelic.addCustomAttribute('hatListSize', data.length);

  res.send(data);
});

async function applyHats(req, res, next) {
  next();
  let numHats = 1;

  if (req.query.number != undefined) {
    numHats = req.query.number;
  }

  let hat = null;

  if (req.query.style == undefined) {
    let hat = await (0, _helpers.getRandomHat)();
  } else {
    let hat = await (0, _helpers.getSpecificHat)(req.query.style);
  }

  if (hat == null) {
    console.log(`Coudln't find hat style ${req.query.style}`);
    return res.status(400).send({
      message: 'This hat style does not exist! If you want this style - try submitting it'
    });
  }

  console.log(`Got hat ${req.query.hatstyle}`);

  _newrelic.addCustomAttribute('hatStyle', req.params.hatstyle);

  let b64Result = await (0, _helpers.requestManipulate)(req.face, hat, numberHats);
  res.send(b64Result);
}

router.get('/hatme', applyHats, async (req, res, next) => {
  _newrelic.addCustomAttribute('qs', req.query);

  _newrelic.addCustomAttribute('customFace', false);

  req.face = await (0, _helpers.defaultBoss)();
  next();
});
router.post('/hatme', [upload.any(), applyHats], async (req, res) => {
  _newrelic.addCustomAttribute('qs', req.query);

  _newrelic.addCustomAttribute('customFace', true);

  req.face = req.files[0].buffer;
  next();
});