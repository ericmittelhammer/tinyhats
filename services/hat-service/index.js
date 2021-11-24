import newrelic from 'newrelic'
import express from 'express'
import multer from 'multer'
import url from 'url'
import winston from 'winston'
import newrelicFormatter from '@newrelic/winston-enricher'

const logger = winston.createLogger({
    level: 'info',
    exitOnError: false,
    transports: [
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true
      })
    ],
    format: winston.format.combine(
        winston.format((info, opts) => Object.assign(info, {module: __filename}))(),
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
    
    let hat = null;
    if (req.query.style == undefined) {
        newrelic.addCustomAttribute('random', true);
        hat = await getRandomHat()
    } else {
        newrelic.addCustomAttribute('random', false);
        hat = await getSpecificHat(req.query.style);
    }    
    if (hat == null) {
        logger.info(`Hat style ${req.query.style} does not exist`)
        return res.status(400).send({
            message: 'This hat style does not exist! If you want this style - try submitting it'
         });             
    }
    logger.info(`Going to apply ${numHats} ${req.query.style} hat(s) to image`);

    let b64Result = await requestManipulate(req.face, hat, numHats)
    res.send(b64Result)
}

router.get('/hatme', async function hatmeGet(req, res, next) {
    let qs = url.parse(req.url).query;
    newrelic.addCustomAttribute('qs', qs);
    newrelic.addCustomAttribute('customFace', false);
    req.face = await defaultBoss()
    await applyHats(req, res, next);
});

router.post('/hatme', upload.any(), async function hatmePost(req, res, next) {
    let qs = url.parse(req.url).query;
    newrelic.addCustomAttribute('qs', qs);
    newrelic.addCustomAttribute('customFace', true);
    req.face = req.files[0].buffer
    await applyHats(req, res, next);
}); 