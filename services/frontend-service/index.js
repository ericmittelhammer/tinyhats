require('newrelic')
var express = require('express');
var app = express();
var router = express.Router();
var multer = require('multer');
const upload = multer();
var fetch = require('node-fetch');
var dirname = require('path').dirname;
var fileURLToPath = require('url').fileURLToPath;
var FormData = require('form-data')

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

router.get('/photo', function (req, res) {
    res.sendFile(path + '/pages/photo.html');
});

router.get('/admin', function (req, res) {
    res.sendFile(path + '/pages/admin.html');
});

router.get('/api/hat', upload.any(), async function (req, res) {
    let baseUrl = "http://gateway-service:80";
    const number = req.query.number ? req.query.number : "1";
    //console.log(req.body);
    let type = req.headers.type;
    //console.log(type);

    if (type) {
        baseUrl += `/${type}`;
    }

    baseUrl += `?number=${number}`;


    //console.log(baseUrl);
    let resp = await fetch(baseUrl);
    let data = await resp.json();
    //console.log(data);
    res.send(data);
});

router.post('/api/hat', upload.any(), async function (req, res) {
    console.log("post data");
    let baseUrl = "http://gateway-service:80";
    const number = req.query.number ? req.query.number : "1";

    let file = req.files[0].buffer;

    let formData = await createForm(file);
    const formHeaders = await formData.getHeaders();
    let type = req.headers.type;
    console.log(file);
    let options = {
        method: "POST",
        body: formData,
        headers: {
            ...formHeaders,
        },
    };

    if (type) {
        baseUrl += `/${type}`;
    }
    baseUrl += `?number=${number}`;
    console.log(baseUrl);
    let resp = await fetch(baseUrl, options);
    let data = await resp.json();
    console.log(data);
    res.send(data);

});

async function createForm(file) {
    let formData = new FormData()
    formData.append('file', file, { filename: "file", data: file })
    console.log("Posting to Manipulate")

    return formData
}

router.get('/api/list', async function (req, res) {
    const baseUrl = "http://gateway-service:80/api/hats";

    const resp = await fetch(baseUrl);
    const data = await resp.json();
    console.log(data);
    res.send(data);
});


router.get('/api/admin', async function (req, res) {
    let baseUrl = "http://gateway-service:80/admin"
    let resp = await fetch(baseUrl);
    let data = await resp.json();
    res.send(data);
});

router.get('/api/admin/moderate', async function (req, res) {
    let id = req.query.id;
    let approve = req.query.approve;

    let baseUrl = `http://gateway-service:80/moderate?id=${id}&approve=${approve}`;

    let resp = await fetch(baseUrl);
    let data = await resp.json();
    console.log(data);
    res.send(data);

});

app.listen(process.env.PORT || 3000,
    () => console.log("Server is running..."));