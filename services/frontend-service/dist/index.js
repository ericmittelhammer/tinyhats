"use strict";

var _express = require("express");

var _multer = require("multer");

var _nodeFetch = require("node-fetch");

var _path = require("path");

var _url = require("url");

var _formData = require("form-data");

require('newrelic');

var app = _express();

var router = _express.Router();

const upload = _multer();

// express is what helps us "route" the html pages. Usually on websites, you don't see /index.html. 
// Why? Because they use routing! When you navigate to /about, the web server with THIS code returns the HTML about.html page.
const _dirname = (0, _path.dirname)((0, _url.fileURLToPath)(import.meta.url));

app.set('view engine', 'ejs');
app.set('views', _dirname); // this is just setting up configuration for where all the files are.

const path = _dirname; //__dirname is the current directory we are in. Remember that every website literally has a computer running behind it!

app.use('/', router);
app.use('/assets', _express.static(path + '/assets')); // this is telling the website WHERE all of our "asset" files are. Asset files include CSS for styling, JS for Bootstrap to make it pretty, and images.

router.get('/', function (req, res) {
  res.sendFile(path + '/pages/index.html');
}); // The logic here: when someone navigates to www.cybercatamounts.herokuapp.com, the website will return the content on the "index.html" page.
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
  console.log(req.body);
  let type = req.headers.type;
  console.log(type);

  if (type) {
    baseUrl += `/${type}`;
  }

  baseUrl += `?number=${number}`;
  console.log(baseUrl);
  let resp = await _nodeFetch(baseUrl);
  let data = await resp.json();
  console.log(data);
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
    headers: { ...formHeaders
    }
  };

  if (type) {
    baseUrl += `/${type}`;
  }

  baseUrl += `?number=${number}`;
  console.log(baseUrl);
  let resp = await _nodeFetch(baseUrl, options);
  let data = await resp.json();
  console.log(data);
  res.send(data);
});

async function createForm(file) {
  let formData = new _formData();
  formData.append('file', file, {
    filename: "file",
    data: file
  });
  console.log("Posting to Manipulate");
  return formData;
}

router.get('/api/list', async function (req, res) {
  const baseUrl = "http://gateway-service:80/api/hats";
  const resp = await _nodeFetch(baseUrl);
  const data = await resp.json();
  console.log(data);
  res.send(data);
});
router.get('/api/admin', async function (req, res) {
  let baseUrl = "http://gateway-service:80/admin";
  let resp = await _nodeFetch(baseUrl);
  let data = await resp.json();
  res.send(data);
});
router.get('/api/admin/moderate', async function (req, res) {
  let id = req.query.id;
  let approve = req.query.approve;
  let baseUrl = `http://gateway-service:80/moderate?id=${id}&approve=${approve}`;
  let resp = await _nodeFetch(baseUrl);
  let data = await resp.json();
  console.log(data);
  res.send(data);
});
app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));