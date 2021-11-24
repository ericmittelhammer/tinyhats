import newrelic from 'newrelic';
import { connect } from 'http2';
import mysql from 'mysql2'
import fetch from 'node-fetch'
import FormData from 'form-data'
import winston from 'winston'
import newrelicFormatter from '@newrelic/winston-enricher'

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
const HOST = process.env.HOST;
const PASSWORD = process.env.PASSWORD;

const pool = mysql.createPool({
    host: HOST,
    port: '3306',
    user: "admin",
    password: PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 3
});

export async function listPictures() {
    var sql = "SELECT * FROM main.images WHERE approve='true'";
    const results = await pool.promise().query(sql)
    return results
};

export async function downloadBuffer(url) {
    let resp = await fetch(url,{
        method: 'GET',
    })

    // receive the response
    let data = await resp.arrayBuffer()
    return data
}

export async function getSpecificHat(style) {
    var sql = `SELECT * FROM main.images WHERE BINARY description='${style}' AND approve='true'`;
    const results = await pool.promise().query(sql)
        .catch(err => logger.error(err))
    //logger.info(`getSpecificHat results: ${JSON.stringify(results)}`);
    let hatList = results[0]
    //logger.info(`hatList: ${JSON.stringify(hatList)}`)
    if (hatList.length == 0){
        return null
    }

    let randNum = Math.floor(Math.random() * hatList.length)
    let hat = hatList[randNum];
    let hatLink = hat.url
    newrelic.addCustomAttribute('style', 'goop');
    logger.info(`hatLink: ${hatLink}`)

    let image = await downloadBuffer(hatLink)
    image = Buffer.from(image)

    return image
}

export async function getHatData() {
    var sql = `SELECT description, url FROM main.images WHERE approve='true'`;
    const results = await pool.promise().query(sql)
    //logger.info(`gethatdata results: ${results}`);
    let hatList = results[0]
    //logger.info(hatList)

    return hatList
}

export async function getRandomHat() {
    // get random hat picture
    let hats = await listPictures()
    let hatList = hats[0]
    //logger.info(`getRandomHat hatlistL ${hatList}`);

    let randNum = Math.floor(Math.random() * hatList.length)
    let hat = hatList[randNum];
    let hatLink = hat.url;
    newrelic.addCustomAttribute('style', hat.description);
    logger.info(`getRandomHat hatLink ${hatLink}`);

    let image = await downloadBuffer(hatLink)
    image = Buffer.from(image)
    return image
}

export async function defaultBoss() {
    //my fav boss ever
    let johnKinmonth = await downloadBuffer("https://user-images.githubusercontent.com/69332964/128645143-86405a62-691b-4de9-8500-b9362675e1db.png");
    johnKinmonth = Buffer.from(johnKinmonth)

    return johnKinmonth
}

export async function requestManipulate(face, hat, numberHats) {
    // hit the upload endpoint to upload image and retrieve unique image id
    let faceData = face
    for (var i = numberHats; i >= 1; i--) {
        logger.info(`Applying hat ${i} of ${numberHats}`)
        let translate = i*0.6
        let rotate = i*10
        let formData = await createForm(faceData, hat)
        const formHeaders = formData.getHeaders();
        const manUrl = `http://${process.env.MANIPULATE_ENDPOINT}/manipulate?translate=${translate}&rotate=${rotate}`;
        logger.info(`POST ${manUrl}`)
        const manipulateRequest = await fetch(manUrl, {
            method: 'POST',
            body: formData,
                headers: {
                ...formHeaders,
                },        
        });
    
        var b64Result = await manipulateRequest.json()

        if (i == 1) {
            faceData = b64Result
        } else {
            faceData = Buffer.from(b64Result.finalBaby.replace("data:image/png;base64,", ""), "base64");
        }

        logger.info(`Received response from /manipulate [hat ${i}]`)
    }

    return faceData
}

async function createForm(face, hat) {
    let formData = new FormData()
    formData.append('file', face, {filename: "face", data: face})
    formData.append('file', hat, {filename: "hat", data: hat})

    return formData
}