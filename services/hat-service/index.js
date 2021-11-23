import newrelic from 'newrelic'
import express from 'express'
import multer from 'multer'
import url from 'url'

import { defaultBoss, getRandomHat, getSpecificHat, requestManipulate, getHatData } from './src/helpers.js'
const upload = multer()
const app = express()
var router = express.Router();
const PORT = 1337

// for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get


app.use('/', router)

app.listen(PORT, () => {
    console.log(`Hats Service started on port ${PORT}`);
})

async function numHats(req, res, next) {

    next();
}

router.get('/list', async(req, res) => {
    console.log("Getting hats")
    let data = await getHatData()
    console.log(`fetched ${data.length} hats`);
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
        let hat = await getRandomHat()
    } else {
        let hat = await getSpecificHat(req.query.style)
    }    
    if (hat == null) {
        console.log(`Coudln't find hat style ${req.query.style}`)
        return res.status(400).send({
            message: 'This hat style does not exist! If you want this style - try submitting it'
         });             
    }
    console.log(`Got hat ${req.query.hatstyle}`);
    newrelic.addCustomAttribute('hatStyle', req.params.hatstyle);
    let b64Result = await requestManipulate(req.face, hat, numberHats)
    res.send(b64Result)
}

router.get('/hatme', async(req, res, next) => {
    newrelic.addCustomAttribute('qs', url.parse(req.url).query);
    newrelic.addCustomAttribute('customFace', false);
    req.face = await defaultBoss()
    await applyHats(req, res, next);
});

router.post('/hatme', upload.any(), async(req, res) => {
    newrelic.addCustomAttribute('qs', url.parse(req.url).query);
    newrelic.addCustomAttribute('customFace', true);
    req.face = req.files[0].buffer
    await applyHats(res, req, next);
}); 