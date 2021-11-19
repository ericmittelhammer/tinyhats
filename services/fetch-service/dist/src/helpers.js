"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultBoss = defaultBoss;
exports.downloadBuffer = downloadBuffer;
exports.getHatData = getHatData;
exports.getRandomHat = getRandomHat;
exports.getSpecificHat = getSpecificHat;
exports.listPictures = listPictures;
exports.requestManipulate = requestManipulate;

var _http = require("http2");

var _mysql = require("mysql2");

var _nodeFetch = require("node-fetch");

var _formData = require("form-data");

const HOST = process.env.HOST;
const PASSWORD = process.env.PASSWORD;

const con = _mysql.createConnection({
  host: HOST,
  port: '3306',
  user: "admin",
  password: PASSWORD
});

async function listPictures() {
  var sql = "SELECT * FROM main.images WHERE approve='true'";
  const results = await con.promise().query(sql);
  return results;
}

;

async function downloadBuffer(url) {
  let resp = await _nodeFetch(url, {
    method: 'GET'
  }); // receive the response

  let data = await resp.arrayBuffer();
  return data;
}

async function getSpecificHat(style) {
  var sql = `SELECT * FROM main.images WHERE BINARY description='${style}' AND approve='true'`;
  const results = await con.promise().query(sql).catch(err => console.log(err));
  let hatList = results[0];
  console.log(hatList);

  if (hatList.length == 0) {
    return null;
  }

  let randNum = Math.floor(Math.random() * hatList.length);
  let hatLink = hatList[randNum].url;
  console.log(hatLink);
  let image = await downloadBuffer(hatLink);
  image = Buffer.from(image);
  return image;
}

async function getHatData() {
  var sql = `SELECT description, url FROM main.images WHERE approve='true'`;
  const results = await con.promise().query(sql);
  let hatList = results[0];
  console.log(hatList);
  return hatList;
}

async function getRandomHat() {
  // get random hat picture
  let hats = await listPictures();
  let hatList = hats[0];
  console.log(hatList);
  let randNum = Math.floor(Math.random() * hatList.length);
  let hatLink = hatList[randNum].url;
  console.log(hatLink);
  let image = await downloadBuffer(hatLink);
  image = Buffer.from(image);
  return image;
}

async function defaultBoss() {
  //my fav boss ever
  let johnKinmonth = await downloadBuffer("https://user-images.githubusercontent.com/69332964/128645143-86405a62-691b-4de9-8500-b9362675e1db.png");
  johnKinmonth = Buffer.from(johnKinmonth);
  return johnKinmonth;
}

async function requestManipulate(face, hat, numberHats) {
  // hit the upload endpoint to upload image and retrieve unique image id
  let faceData = face;
  console.log("Start loop");
  console.log(numberHats);

  for (var i = numberHats; i >= 1; i--) {
    console.log(i);
    let translate = i * 0.6;
    let rotate = i * 10;
    let formData = await createForm(faceData, hat);
    const formHeaders = formData.getHeaders();
    const manipulateRequest = await _nodeFetch(`http://${process.env.MANIPULATE_ENDPOINT}/manipulate?translate=${translate}&rotate=${rotate}`, {
      method: 'POST',
      body: formData,
      headers: { ...formHeaders
      }
    });
    var b64Result = await manipulateRequest.json();

    if (i == 1) {
      faceData = b64Result;
    } else {
      faceData = Buffer.from(b64Result.finalBaby.replace("data:image/png;base64,", ""), "base64");
    }

    console.log(`Received response from /manipulate [${i}]`);
  }

  return faceData;
}

async function createForm(face, hat) {
  let formData = new _formData();
  formData.append('file', face, {
    filename: "face",
    data: face
  });
  formData.append('file', hat, {
    filename: "hat",
    data: hat
  });
  console.log("Posting to Manipulate");
  return formData;
}