import newrelic from 'newrelic'
import express from 'express'
import expressAsyncErrors from 'express-async-errors'
import multer from 'multer'
import url from 'url'
import winston from 'winston'
import newrelicFormatter from '@newrelic/winston-enricher'

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


import { defaultBoss, getRandomHat, getSpecificHat, requestManipulate, getHatData } from './src/helpers.js'
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
    let data = await getHatData()
    logger.info(`fetched ${data.length} hats`);
 newrelic.addCustomAttribute('hatListSize', data.length);
    res.send(data)
});

async function applyHats(req, res, next) {
    let numHats = 1;
    if (req.query.number != undefined) {
        numHats = req.query.number 
    }
    
    let sanitizedHatStyle = req.query.style.toLower();

    let hat = null;
    if (req.query.style == undefined) {
        newrelic.addCustomAttribute('random', true);
        hat = await getRandomHat()
    } else {
        newrelic.addCustomAttribute('random', false);
        hat = await getSpecificHat(sanitizedHatStyle);
    }    
    if (hat == null) {
        logger.info(`Hat style ${req.query.style} does not exist`)
        throw new Error(`Hat style ${req.query.style} does not exist`);

    }
    logger.info(`Going to apply ${numHats} ${req.query.style} hats to image`);

    let b64Result = await requestManipulate(req.face, hat, numHats)
    res.send(b64Result)
}

router.get('/hatme', async function hatmeGet(req, res, next) {
    let qs = url.parse(req.url).query;
    newrelic.addCustomAttribute('requestedStyle', qs.style);
    newrelic.addCustomAttribute('customFace', false);
    req.face = await defaultBoss()
    await applyHats(req, res, next);
});

router.post('/hatme', upload.any(), async function hatmePost(req, res, next) {
    let qs = url.parse(req.url).query;
    newrelic.addCustomAttribute('requestedStyle', qs.style);
    newrelic.addCustomAttribute('customFace', true);
    req.face = req.files[0].buffer
    await applyHats(req, res, next);
}); 