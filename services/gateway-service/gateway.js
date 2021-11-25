require('newrelic');
const url = require('url');
const express = require('express')
const multer = require('multer')
const FormData = require('form-data')
const upload = multer()
const fetch = require("node-fetch")
const rateLimit = require("express-rate-limit");
const cors = require('cors')
require('express-async-errors');
const app = express()
var router = express.Router();
const PORT = 4444
const winston = require('winston');
const newrelicFormatter = require('@newrelic/winston-enricher');

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

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests - we don't have any more hats left! Please try again later."
});
  
//  apply to all requests
//app.use(limiter);

app.use(cors());

// for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

function getNumber(req) {
    let param = ""
    if (req.query.number != undefined) {
        param = `number=${req.query.number}`
    }

    return param
}

router.post('/hatme', upload.any(), async function hatemePost(req, res) { 
    let baseUrl = new url.URL(`http://${process.env.HATS_ENDPOINT}/hatme`);
    let params = baseUrl.searchParams;
    params.append('number', req.query.number == undefined ? 1 : req.query.number);
    if (req.query.style != undefined) {
        params.append('style', req.query.style);
    }
    let formData = new FormData()
    formData.append('file', req.files[0].buffer, {filename: "face", data: req.files[0].buffer})
    const formHeaders = formData.getHeaders();
    logger.info(`POST ${baseUrl.toString()}`);
    const fetchResp = await fetch(baseUrl.toString(), {
        method: 'POST',
        body: formData,
        headers: {
        ...formHeaders,
        },  
    });
    var result = await fetchResp.json()
    res.send({result}) 
});

router.post('/:apiName', upload.any(), async (req, res) => {
    logger.info(`[!] ${req.params.apiName} was accessed.`)
    let route = req.params.apiName

    if (route == "add") {
        let image = req.files[0].buffer
        let name = req.body.name
        logger.info("Requesting moderation and uploading image...")
    
        // hit the add endpoint to add image and begin approval process
        let formData = new FormData()
        formData.append('photo', image, {filename: "baby", data: image})
        formData.append('name', name)
        const formHeaders = formData.getHeaders();
    
        logger.info(process.env.ADD_ENDPOINT)
        
        const addResp = await fetch(`http://${process.env.ADD_ENDPOINT}/add`, {
            method: 'POST',
            body: formData,
                headers: {
                ...formHeaders,
                },        
        });
    
        var result = await addResp.json()
        logger.info(`Received from /add: ${JSON.stringify(result)}`)
        res.send({result})
    }
});


router.get('/', upload.any(), async (req, res) => {
    res.send({
        "service": "gateway-service",
        "status": "ok"
    });
 })

 router.get('/hatme', upload.any(), async function hatmeGet(req, res) {
    let baseUrl = new url.URL(`http://${process.env.HATS_ENDPOINT}/hatme`);
    let params = baseUrl.searchParams;
    params.append('number', req.query.number == undefined ? 1 : req.query.number);
    if (req.query.style != undefined) {
        params.append('style', req.query.style);
    }
    logger.info(`GET ${baseUrl.toString()}`);
    const addResp = await fetch(baseUrl.toString(), {
        method: 'GET',      
    });
    
    let responseCode = addResp.status

    var result = await addResp.json()
    res.status(responseCode).send({result}) 
})

router.get('/:apiName', upload.any(), async (req, res) => {
    logger.info(`[!] ${req.params.apiName} was accessed.`)

    let route = req.params.apiName;
    if (route == "moderate") {
        let approve = req.query.approve;
        let id = req.query.id;
        const moderateResp = await fetch(`http://${process.env.MODERATE_ENDPOINT}/moderate?approve=${approve}&id=${id}`, {
            method: 'GET'
        })
    
        var result = await moderateResp.text()
        res.send({result})
    } else if (route == "admin") {
        const adminResp = await fetch(`http://admin-service:80/admin`, {
            method: 'GET'
        })
    
        var result = await adminResp.json()
        res.send({result})
    } 
})

router.get('/api/:apiName', upload.any(), async (req, res) => {
    logger.info(`[!] /api/${req.params.apiName} was accessed.`)
    let route = req.params.apiName;
    
    if (route == "hats") {
        logger.info(`POST http://${process.env.HATS_ENDPOINT}/list`);
        const addResp = await fetch(`http://${process.env.HATS_ENDPOINT}/list`, {
            method: 'GET',      
        });
        var result = await addResp.json()
        res.send(result)
    }
})

app.use('/', router)

app.listen(PORT, () => {
    logger.info(`API Gateway started on port ${PORT}`)
})
