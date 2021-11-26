require('newrelic')
var express = require('express');
require('express-async-errors');
var app = express();
var router = express.Router();
var multer = require('multer');
const upload = multer();
var fetch = require('node-fetch');
var dirname = require('path').dirname;
var url = require('url');
var fileURLToPath = url.fileURLToPath;
var FormData = require('form-data')

const winston = require('winston');
const newrelicFormatter = require('@newrelic/winston-enricher');


const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format((info, opts) => Object.assign(info, {module: __filename}))(),
        newrelicFormatter(),
        winston.format.errors({stack: true}),
        winston.format.json()
    )
  });

// express is what helps us "route" the html pages. Usually on websites, you don't see /index.html. 
// Why? Because they use routing! When you navigate to /about, the web server with THIS code returns the HTML about.html page.

const dn = dirname(__filename);
app.set('view engine', 'ejs');
app.set('views', dn);

// this is just setting up configuration for where all the files are.
const path = dn;

//__dirname is the current directory we are in. Remember that every website literally has a computer running behind it!
app.use('/', router);
app.use('/assets', express.static(path + '/assets'))

// this is telling the website WHERE all of our "asset" files are. Asset files include CSS for styling, JS for Bootstrap to make it pretty, and images.

router.get('/', function (req, res) {
    res.sendFile(path + '/pages/index.html');
});

// The logic here: when someone navigates to www.cybercatamounts.herokuapp.com, the website will return the content on the "index.html" page.
// Why is it router.get? Because when you enter something in your browser, you are making a GET request.

router.get('/photo', function photo(req, res) {
    res.sendFile(path + '/pages/photo.html');
});

router.get('/admin', function admin(req, res) {
    res.sendFile(path + '/pages/admin.html');
});

router.get('/api/hat', upload.any(), async function hatGet(req, res) {
    let baseUrl = new url.URL("http://gateway-service:80/hatme");
    const number = req.query.number ? req.query.number : "1";
    //logger.info(req.body);
    let type = req.headers.type;
    //logger.info(type);

    if (type) {
        baseUrl.searchParams.append('style', type);
    }

    baseUrl.searchParams.append('number', number);


    logger.info(`GET ${baseUrl}`);
    let resp = await fetch(baseUrl.toString());
    let data = await resp.json();
    //logger.info(data);
    res.send(data);
});

router.post('/api/hat', upload.any(), async function hatPost(req, res) {
    logger.info("posting custom photo");
    let baseUrl = new url.URL("http://gateway-service:80/hatme");
    const number = req.query.number ? req.query.number : "1";

    let file = req.files[0].buffer;

    let formData = await createForm(file);
    const formHeaders = await formData.getHeaders();
    let type = req.headers.type;
    //logger.info(file);
    let options = {
        method: "POST",
        body: formData,
        headers: {
            ...formHeaders,
        },
    };

    if (type) {
        baseUrl.searchParams.append('style', type);
    }

    baseUrl.searchParams.append('number', number);
    logger.info(`POST ${baseUrl}`);
    let resp = await fetch(baseUrl, options);
    let data = await resp.json();
    //logger.info(data);
    res.send(data);

});

async function createForm(file) {
    let formData = new FormData()
    formData.append('file', file, { filename: "file", data: file })

    return formData
}

router.get('/api/list', async function list(req, res) {
    const baseUrl = "http://gateway-service:80/api/hats";

    logger.info(`GET ${baseUrl}`);
    const resp = await fetch(baseUrl);
    const data = await resp.json();
    res.send(data);
});


router.get('/api/admin', async function admin(req, res) {
    let baseUrl = "http://gateway-service:80/admin"
    logger.info(`GET ${baseUrl}`);
    let resp = await fetch(baseUrl);
    let data = await resp.json();
    res.send(data);
});

router.get('/api/admin/moderate', async function moderate(req, res) {
    let id = req.query.id;
    let approve = req.query.approve;

    let baseUrl = `http://gateway-service:80/moderate?id=${id}&approve=${approve}`;

    logger.info(`GET ${baseUrl}`);
    let resp = await fetch(baseUrl);
    let data = await resp.json();
    //logger.info(data);
    res.send(data);

});

app.listen(process.env.PORT || 3000,
    () => logger.info("Server is running..."));