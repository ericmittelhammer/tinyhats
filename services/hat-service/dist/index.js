"use strict";

var _newrelic = require("newrelic");

var _winstonEnricher = require("@newrelic/winston-enricher");

var _express = require("express");

var _multer = require("multer");

var _url = require("url");

var _winston = require("winston");

var _helpers = require("./src/helpers.js");

_winston.loggers.add('appLogger', {
  level: 'info',
  defaultMeta: {
    service: 'hat-service'
  },
  transports: [new _winston.transports.Console()],
  format: _winston.format.combine(_winston.format.json(), _winstonEnricher())
});

const logger = _winston.loggers.get('appLogger');

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 1337; // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use(function (req, res, next) {
  logger.info("requested", req.url);
  next();
});
app.use('/', router);
app.listen(PORT, () => {
  logger.info(`Hats Service started on port ${PORT}`);
});

async function numHats(req, res, next) {
  next();
}

router.get('/list', async (req, res) => {
  logger.info("Getting hats");
  let data = await (0, _helpers.getHatData)();
  logger.info(`fetched ${data.length} hats`);

  _newrelic.addCustomAttribute('hatListSize', data.length);

  res.send(data);
});

async function applyHats(req, res, next) {
  let numHats = 1;

  if (req.query.number != undefined) {
    numHats = req.query.number;
  }

  let hat = null;

  if (req.query.style == undefined) {
    hat = await (0, _helpers.getRandomHat)();
  } else {
    hat = await (0, _helpers.getSpecificHat)(req.query.style);
  }

  if (hat == null) {
    logger.info(`Coudln't find hat style ${req.query.style}`);
    return res.status(400).send({
      message: 'This hat style does not exist! If you want this style - try submitting it'
    });
  }

  logger.info(`Got hat ${req.query.hatstyle}`);

  _newrelic.addCustomAttribute('hatStyle', req.params.hatstyle);

  let b64Result = await (0, _helpers.requestManipulate)(req.face, hat, numHats);
  res.send(b64Result);
}

router.get('/hatme', async (req, res, next) => {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('qs', qs);

  _newrelic.addCustomAttribute('customFace', false);

  req.face = await (0, _helpers.defaultBoss)();
  await applyHats(req, res, next);
});
router.post('/hatme', upload.any(), async (req, res, next) => {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('qs', qs);

  _newrelic.addCustomAttribute('customFace', true);

  req.face = req.files[0].buffer;
  await applyHats(req, res, next);
});