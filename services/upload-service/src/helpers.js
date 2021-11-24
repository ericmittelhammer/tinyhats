import AWS from 'aws-sdk';
import generateUniqueId from 'generate-unique-id'
import mysql from 'mysql'

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

const ID = process.env.S3_ID;
const SECRET = process.env.S3_SECRET;
const BUCKET_NAME = 'tinyhats';

const HOST = process.env.HOST;
const PASSWORD = process.env.PASSWORD;

const con = mysql.createConnection({
    host: HOST,
    port: '3306',
    user: "admin",
    password: PASSWORD,
});

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

export async function uploadFile(fileName, fileContent) {
    let link = ""
    let key = fileName
    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: key, // File name you want to save as in S3
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, (err, data) => {
        if (err) {
            throw err;
        }
        link = data.Location
        logger.info(`File uploaded successfully. ${link}`);
    });
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
};

export const fileExt = (ext) => {
    if (ext == "image/png") {
        return '.png'
    } else if (ext == "image/jpeg") {
        return '.jpeg'
    } else if (ext == "image/jpg") {
        return '.jpg'
    } else {
        process.exit()
    }
}

export const uniqueId = () => {
    const id = generateUniqueId({
        length: 16
    });
    // generate length 16 random file name

    return id
}

export async function push2RDS(key, ext, name, link) {
    con.connect(function(err) {
        con.query(`INSERT INTO main.images (keyId, fileName, url, description, approve) VALUES ('${key}', '${key + ext}', '${link}', '${name}', 'false')`, function(err, result, fields) {
            if (err) logger.error(err);
            if (result) logger.info({key: key, fileName: key + ext, url: link, description: name, approve: "false"});
            if (fields) logger.info(fields);
        });
        // connect to mysql and push data
    });
    return {key: key, fileName: key + ext, url: link, description: name, approve: "false"}
};