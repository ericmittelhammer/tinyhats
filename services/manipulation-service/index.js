require('newrelic');
const express = require('express')
require('express-async-errors');
const multer = require('multer')
const upload = multer()
const app = express()
const image = require('./src/image.js')
var router = express.Router();
const PORT = 80

const winston = require('winston');
const newrelicFormatter = require('@newrelic/winston-enricher');


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

// for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get


app.use('/', router)

app.listen(PORT, () => {
    logger.info(`Manipulaton service started on port ${PORT}`)
})

router.post('/manipulate', upload.any(), async function manipulate(req, res) {
    var result;
    logger.info(`Request received. beginning manipulation`);
    let baby = req.files[0].buffer
    let hat = req.files[1].buffer
    let rotate = parseInt(req.query.rotate)
    let translate = parseInt(req.query.translate)

    try {
        // send to AWS SDK
        //logger.info(baby)
        result = await image.findBaby(baby)
    } catch (e) {
        res.send("Invalid image")
        logger.error(e)
    }

    let finalBaby = await image.overlayHat(hat, result, baby, translate, rotate)
    res.send({finalBaby}) 
  });