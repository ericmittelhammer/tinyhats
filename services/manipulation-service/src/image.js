const newrelic = require('newrelic');
const Jimp = require('jimp')
const faceapi = require('face-api.js')
const canvas = require('canvas')
require('@tensorflow/tfjs-node');


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

const { Canvas, Image, ImageData } = canvas  
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const findFace = async function findFace(baby) {
  const image = await canvas.loadImage(baby)
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./weights')
  // const Canvas = canvas.createCanvas(image.width, image.height)
  // const ctx = Canvas.getContext('2d')
  // ctx.drawImage(image, 0, 0, image.width, image.height)
  // logger.info(ctx)

  const fullFaceDescription = await newrelic.startSegment('faceapi.detectAllFaces', true, async () => {
    return await faceapi.detectAllFaces(image)
  });
  // use await to retrieve face data

  let relData = fullFaceDescription[0]._box
  logger.info(`Detected faces: ${JSON.stringify(relData)}`)

  return relData;
  // {"_x":225.59293228387833,"_y":122.78662695563085,"_width":183.89773482084274,"_height":181.8649869230835}
}

const overlayHat = async function overlayHat(hat, result, baby, translate, rotate) {
  let hatImg = await Jimp.read(hat);
  const image = await Jimp.read(baby);
  let jimpFace = image.bitmap

  let width = result._width
  let height = result._height
  let left = result._x
  let top = result._y
  //logger.info(width, height, left, top)
  //  BoundingBox.Width:      ${data.BoundingBox.Width}`)

  hatImg = await hatImg.resize(width, height)
  hatImg = await hatImg.rotate(rotate)

  translate = translate * 0.3
  newrelic.startSegment('image.composite', true, function() {
    image.composite(hatImg, left - width*translate, top - height*1.2, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacityDest: 1,
      opacitySource: 0.9
    })
  });

  return await image.getBase64Async(Jimp.MIME_PNG)
}

exports.findFace = findFace
exports.overlayHat = overlayHat
