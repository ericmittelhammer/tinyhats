"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fileExt = void 0;
exports.push2RDS = push2RDS;
exports.uniqueId = void 0;
exports.uploadFile = uploadFile;

var _awsSdk = require("aws-sdk");

var _generateUniqueId = require("generate-unique-id");

var _mysql = require("mysql");

const ID = process.env.S3_ID;
const SECRET = process.env.S3_SECRET;
const BUCKET_NAME = 'tinyhats';
const HOST = process.env.HOST;
const PASSWORD = process.env.PASSWORD;

const con = _mysql.createConnection({
  host: HOST,
  port: '3306',
  user: "admin",
  password: PASSWORD
});

const s3 = new _awsSdk.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET
});

async function uploadFile(fileName, fileContent) {
  let link = "";
  let key = fileName; // Setting up S3 upload parameters

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    // File name you want to save as in S3
    Body: fileContent
  }; // Uploading files to the bucket

  s3.upload(params, (err, data) => {
    if (err) {
      throw err;
    }

    link = data.Location;
    console.log(`File uploaded successfully. ${link}`);
  });
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

;

const fileExt = ext => {
  if (ext == "image/png") {
    return '.png';
  } else if (ext == "image/jpeg") {
    return '.jpeg';
  } else if (ext == "image/jpg") {
    return '.jpg';
  } else {
    process.exit();
  }
};

exports.fileExt = fileExt;

const uniqueId = () => {
  const id = _generateUniqueId({
    length: 16
  }); // generate length 16 random file name


  return id;
};

exports.uniqueId = uniqueId;

async function push2RDS(key, ext, name, link) {
  con.connect(function (err) {
    con.query(`INSERT INTO main.images (keyId, fileName, url, description, approve) VALUES ('${key}', '${key + ext}', '${link}', '${name}', 'false')`, function (err, result, fields) {
      if (err) console.log(err);
      if (result) console.log({
        key: key,
        fileName: key + ext,
        url: link,
        description: name,
        approve: "false"
      });
      if (fields) console.log(fields);
    }); // connect to mysql and push data
  });
  return {
    key: key,
    fileName: key + ext,
    url: link,
    description: name,
    approve: "false"
  };
}

;