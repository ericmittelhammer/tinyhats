const Jimp = require('jimp')
const AWS = require('aws-sdk')
const bucket = 'bucket' // the bucketname without s3://
const photo  = 'input.jpg' // the name of file

const config = new AWS.Config({
  accessKeyId: process.env.S3_ID,
  secretAccessKey: process.env.S3_SECRET,
  region: process.env.AWS_REGION
})

const client = new AWS.Rekognition();

const findBaby = async (baby) => {
  const params = {
    Image: {
      // only accepts pure buffer
      "Bytes": baby
    },
    Attributes: ['ALL']
  }
  
  let data = await client.detectFaces(params).promise()
  // client.detectFaces(params, function(err, response) {
  //   if (err) {
  //     console.log(err, err.stack); // an error occurred
  //   } else {
  //     data = response
  //   }
  // })
  console.log(`Detected faces: ${JSON.stringify(data.FaceDetails[0].BoundingBox)}`)

  return data;
  // receive the response
  // let data = await resp.json();
  // console.log(data)
  // return data;
}

const overlayHat = async (hat, result, baby, translate, rotate) => {
  let hatImg = await Jimp.read(hat);
  const image = await Jimp.read(baby);
  let face = result.FaceDetails[0].BoundingBox

  let scale = 400

  hatImg = await hatImg.resize(face.Width*scale, face.Height*scale)
  hatImg = await hatImg.rotate(rotate)

  translate = translate * 0.3
  //  BoundingBox.Width:      ${data.BoundingBox.Width}`)
  image.composite(hatImg, face.Left*scale - face.Width*scale*translate, face.Top*scale - face.Height*0.8*scale, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacityDest: 1,
    opacitySource: 0.9
  })

  return await image.getBase64Async(Jimp.MIME_PNG)
}

exports.findBaby = findBaby
exports.overlayHat = overlayHat
