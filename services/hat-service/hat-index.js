const newrelic = require('newrelic');
const express = require('express');
const expressAsyncErrors = require('express-async-errors');
const multer = require('multer')
const url = require('url');
const winston = require('winston')
const newrelicFormatter = require('@newrelic/winston-enricher')

const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format((info, opts) => Object.assign(info, {module: __filename}))(),
        winston.format.errors({stack: true}),
        newrelicFormatter(),
        winston.format.json()
    )
  });

const helpers = require('./src/helpers.js');
//import { defaultBoss, getRandomHat, getSpecificHat, requestManipulate, getHatData, sanitizeInput } from './src/helpers.js'
const upload = multer()
const app = express()
var router = express.Router();
const PORT = 1337

// for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use(function(req, res, next) {
    logger.info(`requested: ${req.url}`);
    next();
})

app.use('/', router)

app.listen(PORT, () => {
    logger.info(`Hats Service started on port ${PORT}`);
})

async function numHats(req, res, next) {

    next();
}

router.get('/list', async function list(req, res) {
    logger.info("Getting hats")
    let data = await helpers.getHatData()
    logger.info(`fetched ${data.length} hats`);
    newrelic.addCustomAttribute('hatListSize', data.length);
    res.send(data)
});

async function applyHats(req, res, next) {
    newrelic.addCustomAttribute('style', req.query.style);
    let numHats = 1;
    if (req.query.number != undefined) {
        numHats = req.query.number 
    }
    
    let sanitizedHatStyle = helpers.sanitizeInput(req.query.style);

    let hat = null;
    if (req.query.style == undefined) {
        newrelic.addCustomAttribute('random', true);
        hat = await helpers.getRandomHat()
    } else {
        newrelic.addCustomAttribute('random', false);
        hat = await helpers.getSpecificHat(sanitizedHatStyle);
    }    
    if (hat == null) {
        logger.info(`Invalid hat style`)
    }
    logger.info(`Going to apply ${numHats} ${req.query.style} hats to image`);

    let b64Result = await helpers.requestManipulate(req.face, hat, numHats)
    res.send(b64Result)
}

router.get('/hatme', async function hatmeGet(req, res, next) {
    let qs = url.parse(req.url).query;
    newrelic.addCustomAttribute('customFace', false);
    req.face = await helpers.defaultImage()
    await applyHats(req, res, next);
});

router.post('/hatme', upload.any(), async function hatmePost(req, res, next) {
    let qs = url.parse(req.url).query;
    newrelic.addCustomAttribute('customFace', true);
    req.face = req.files[0].buffer
    await applyHats(req, res, next);
}); 

//let sanitizedHatStyle = helpers.sanitizeInput(req.query.style);