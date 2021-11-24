require('newrelic');
import express from 'express'
import multer from 'multer'
const upload = multer()
const app = express()
import { uniqueId, uploadFile, fileExt, push2RDS } from './src/helpers.js'
var router = express.Router();
const PORT = 8080

import winston from 'winston'
import newrelicFormatter from '@newrelic/winston-enricher'

const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console()
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
    logger.info(`Upload Service started on port ${PORT}`)
})

router.post('/upload', upload.any(), async(req, res) => {
    logger.info("Started")
    let image = req.files[0].buffer
    let name = req.body.name.toLowerCase();
    let fileName = uniqueId()
    // parse from body
    logger.info(fileName, name, image)

    // determine file extension
    let ext = fileExt(req.body.mimeType)

    // base64 image to binary data
    logger.info("Image received")
    let imageData = Buffer.from(image, 'base64')

    // upload to s3
    let link = await uploadFile(fileName + ext, imageData)

    // push to rds
    let data = await push2RDS(fileName, ext, name, link)
    res.send(data) 
  });