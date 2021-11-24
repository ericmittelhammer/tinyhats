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

var _winston = require("winston");

var _winstonEnricher = require("@newrelic/winston-enricher");

const logger = _winston.createLogger({
  level: 'info',
  transports: [new _winston.transports.Console()],
  format: _winston.format.combine(_winston.format((info, opts) => Object.assign(info, {
    module: __filename
  }))(), _winstonEnricher(), _winston.format.json())
});

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
    logger.info(`File uploaded successfully. ${link}`);
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
      if (err) logger.error(err);
      if (result) logger.info({
        key: key,
        fileName: key + ext,
        url: link,
        description: name,
        approve: "false"
      });
      if (fields) logger.info(fields);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiZm9ybWF0IiwiY29tYmluZSIsImluZm8iLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwibW9kdWxlIiwiX19maWxlbmFtZSIsIm5ld3JlbGljRm9ybWF0dGVyIiwianNvbiIsIklEIiwicHJvY2VzcyIsImVudiIsIlMzX0lEIiwiU0VDUkVUIiwiUzNfU0VDUkVUIiwiQlVDS0VUX05BTUUiLCJIT1NUIiwiUEFTU1dPUkQiLCJjb24iLCJteXNxbCIsImNyZWF0ZUNvbm5lY3Rpb24iLCJob3N0IiwicG9ydCIsInVzZXIiLCJwYXNzd29yZCIsInMzIiwiQVdTIiwiUzMiLCJhY2Nlc3NLZXlJZCIsInNlY3JldEFjY2Vzc0tleSIsInVwbG9hZEZpbGUiLCJmaWxlTmFtZSIsImZpbGVDb250ZW50IiwibGluayIsImtleSIsInBhcmFtcyIsIkJ1Y2tldCIsIktleSIsIkJvZHkiLCJ1cGxvYWQiLCJlcnIiLCJkYXRhIiwiTG9jYXRpb24iLCJmaWxlRXh0IiwiZXh0IiwiZXhpdCIsInVuaXF1ZUlkIiwiaWQiLCJnZW5lcmF0ZVVuaXF1ZUlkIiwibGVuZ3RoIiwicHVzaDJSRFMiLCJuYW1lIiwiY29ubmVjdCIsInF1ZXJ5IiwicmVzdWx0IiwiZmllbGRzIiwiZXJyb3IiLCJ1cmwiLCJkZXNjcmlwdGlvbiIsImFwcHJvdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFFQSxNQUFNQSxNQUFNLEdBQUdDLFFBQU8sQ0FBQ0MsWUFBUixDQUFxQjtBQUNoQ0MsRUFBQUEsS0FBSyxFQUFFLE1BRHlCO0FBRWhDQyxFQUFBQSxVQUFVLEVBQUUsQ0FDVixJQUFJSCxRQUFPLENBQUNHLFVBQVIsQ0FBbUJDLE9BQXZCLEVBRFUsQ0FGb0I7QUFLaENDLEVB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SixDQUFZLFVBQVNaLEdBQVQsRUFBYztBQUN0QnRCLElBQUFBLEdBQUcsQ0FBQ21DLEtBQUosQ0FBVyxpRkFBZ0ZuQixHQUFJLE9BQU1BLEdBQUcsR0FBR1UsR0FBSSxPQUFNWCxJQUFLLE9BQU1rQixJQUFLLGFBQXJJLEVBQW1KLFVBQVNYLEdBQVQsRUFBY2MsTUFBZCxFQUFzQkMsTUFBdEIsRUFBOEI7QUFDN0ssVUFBSWYsR0FBSixFQUFTL0MsTUFBTSxDQUFDK0QsS0FBUCxDQUFhaEIsR0FBYjtBQUNULFVBQUljLE1BQUosRUFBWTdELE1BQU0sQ0FBQ1EsSUFBUCxDQUFZO0FBQUNpQyxRQUFBQSxHQUFHLEVBQUVBLEdBQU47QUFBV0gsUUFBQUEsUUFBUSxFQUFFRyxHQUFHLEdBQUdVLEdBQTNCO0FBQWdDYSxRQUFBQSxHQUFHLEVBQUV4QixJQUFyQztBQUEyQ3lCLFFBQUFBLFdBQVcsRUFBRVAsSUFBeEQ7QUFBOERRLFFBQUFBLE9BQU8sRUFBRTtBQUF2RSxPQUFaO0FBQ1osVUFBSUosTUFBSixFQUFZOUQsTUFBTSxDQUFDUSxJQUFQLENBQVlzRCxNQUFaO0FBQ2YsS0FKRCxFQURzQixDQU10QjtBQUNILEdBUEQ7QUFRQSxTQUFPO0FBQUNyQixJQUFBQSxHQUFHLEVBQUVBLEdBQU47QUFBV0gsSUFBQUEsUUFBUSxFQUFFRyxHQUFHLEdBQUdVLEdBQTNCO0FBQWdDYSxJQUFBQSxHQUFHLEVBQUV4QixJQUFyQztBQUEyQ3lCLElBQUFBLFdBQVcsRUFBRVAsSUFBeEQ7QUFBOERRLElBQUFBLE9BQU8sRUFBRTtBQUF2RSxHQUFQO0FBQ0g7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0IGdlbmVyYXRlVW5pcXVlSWQgZnJvbSAnZ2VuZXJhdGUtdW5pcXVlLWlkJ1xuaW1wb3J0IG15c3FsIGZyb20gJ215c3FsJ1xuXG5pbXBvcnQgd2luc3RvbiBmcm9tICd3aW5zdG9uJ1xuaW1wb3J0IG5ld3JlbGljRm9ybWF0dGVyIGZyb20gJ0BuZXdyZWxpYy93aW5zdG9uLWVucmljaGVyJ1xuXG5jb25zdCBsb2dnZXIgPSB3aW5zdG9uLmNyZWF0ZUxvZ2dlcih7XG4gICAgbGV2ZWw6ICdpbmZvJyxcbiAgICB0cmFuc3BvcnRzOiBbXG4gICAgICBuZXcgd2luc3Rvbi50cmFuc3BvcnRzLkNvbnNvbGUoKVxuICAgIF0sXG4gICAgZm9ybWF0OiB3aW5zdG9uLmZvcm1hdC5jb21iaW5lKFxuICAgICAgICB3aW5zdG9uLmZvcm1hdCgoaW5mbywgb3B0cykgPT4gT2JqZWN0LmFzc2lnbihpbmZvLCB7bW9kdWxlOiBfX2ZpbGVuYW1lfSkpKCksXG4gICAgICAgIG5ld3JlbGljRm9ybWF0dGVyKCksXG4gICAgICAgIHdpbnN0b24uZm9ybWF0Lmpzb24oKVxuICAgIClcbiAgfSk7XG5cbmNvbnN0IElEID0gcHJvY2Vzcy5lbnYuUzNfSUQ7XG5jb25zdCBTRUNSRVQgPSBwcm9jZXNzLmVudi5TM19TRUNSRVQ7XG5jb25zdCBCVUNLRVRfTkFNRSA9ICd0aW55aGF0cyc7XG5cbmNvbnN0IEhPU1QgPSBwcm9jZXNzLmVudi5IT1NUO1xuY29uc3QgUEFTU1dPUkQgPSBwcm9jZXNzLmVudi5QQVNTV09SRDtcblxuY29uc3QgY29uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbih7XG4gICAgaG9zdDogSE9TVCxcbiAgICBwb3J0OiAnMzMwNicsXG4gICAgdXNlcjogXCJhZG1pblwiLFxuICAgIHBhc3N3b3JkOiBQQVNTV09SRCxcbn0pO1xuXG5jb25zdCBzMyA9IG5ldyBBV1MuUzMoe1xuICAgIGFjY2Vzc0tleUlkOiBJRCxcbiAgICBzZWNyZXRBY2Nlc3NLZXk6IFNFQ1JFVFxufSk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGxvYWRGaWxlKGZpbGVOYW1lLCBmaWxlQ29udGVudCkge1xuICAgIGxldCBsaW5rID0gXCJcIlxuICAgIGxldCBrZXkgPSBmaWxlTmFtZVxuICAgIC8vIFNldHRpbmcgdXAgUzMgdXBsb2FkIHBhcmFtZXRlcnNcbiAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIEJ1Y2tldDogQlVDS0VUX05BTUUsXG4gICAgICAgIEtleToga2V5LCAvLyBGaWxlIG5hbWUgeW91IHdhbnQgdG8gc2F2ZSBhcyBpbiBTM1xuICAgICAgICBCb2R5OiBmaWxlQ29udGVudFxuICAgIH07XG5cbiAgICAvLyBVcGxvYWRpbmcgZmlsZXMgdG8gdGhlIGJ1Y2tldFxuICAgIHMzLnVwbG9hZChwYXJhbXMsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIGxpbmsgPSBkYXRhLkxvY2F0aW9uXG4gICAgICAgIGxvZ2dlci5pbmZvKGBGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseS4gJHtsaW5rfWApO1xuICAgIH0pO1xuICAgIHJldHVybiBgaHR0cHM6Ly8ke0JVQ0tFVF9OQU1FfS5zMy5hbWF6b25hd3MuY29tLyR7a2V5fWBcbn07XG5cbmV4cG9ydCBjb25zdCBmaWxlRXh0ID0gKGV4dCkgPT4ge1xuICAgIGlmIChleHQgPT0gXCJpbWFnZS9wbmdcIikge1xuICAgICAgICByZXR1cm4gJy5wbmcnXG4gICAgfSBlbHNlIGlmIChleHQgPT0gXCJpbWFnZS9qcGVnXCIpIHtcbiAgICAgICAgcmV0dXJuICcuanBlZydcbiAgICB9IGVsc2UgaWYgKGV4dCA9PSBcImltYWdlL2pwZ1wiKSB7XG4gICAgICAgIHJldHVybiAnLmpwZydcbiAgICB9IGVsc2Uge1xuICAgICAgICBwcm9jZXNzLmV4aXQoKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHVuaXF1ZUlkID0gKCkgPT4ge1xuICAgIGNvbnN0IGlkID0gZ2VuZXJhdGVVbmlxdWVJZCh7XG4gICAgICAgIGxlbmd0aDogMTZcbiAgICB9KTtcbiAgICAvLyBnZW5lcmF0ZSBsZW5ndGggMTYgcmFuZG9tIGZpbGUgbmFtZVxuXG4gICAgcmV0dXJuIGlkXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwdXNoMlJEUyhrZXksIGV4dCwgbmFtZSwgbGluaykge1xuICAgIGNvbi5jb25uZWN0KGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb24ucXVlcnkoYElOU0VSVCBJTlRPIG1haW4uaW1hZ2VzIChrZXlJZCwgZmlsZU5hbWUsIHVybCwgZGVzY3JpcHRpb24sIGFwcHJvdmUpIFZBTFVFUyAoJyR7a2V5fScsICcke2tleSArIGV4dH0nLCAnJHtsaW5rfScsICcke25hbWV9JywgJ2ZhbHNlJylgLCBmdW5jdGlvbihlcnIsIHJlc3VsdCwgZmllbGRzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSBsb2dnZXIuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIGxvZ2dlci5pbmZvKHtrZXk6IGtleSwgZmlsZU5hbWU6IGtleSArIGV4dCwgdXJsOiBsaW5rLCBkZXNjcmlwdGlvbjogbmFtZSwgYXBwcm92ZTogXCJmYWxzZVwifSk7XG4gICAgICAgICAgICBpZiAoZmllbGRzKSBsb2dnZXIuaW5mbyhmaWVsZHMpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gY29ubmVjdCB0byBteXNxbCBhbmQgcHVzaCBkYXRhXG4gICAgfSk7XG4gICAgcmV0dXJuIHtrZXk6IGtleSwgZmlsZU5hbWU6IGtleSArIGV4dCwgdXJsOiBsaW5rLCBkZXNjcmlwdGlvbjogbmFtZSwgYXBwcm92ZTogXCJmYWxzZVwifVxufTsiXX0=