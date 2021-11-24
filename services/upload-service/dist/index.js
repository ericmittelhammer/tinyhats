"use strict";

var _express = require("express");

var _multer = require("multer");

var _helpers = require("./src/helpers.js");

var _winston = require("winston");

var _winstonEnricher = require("@newrelic/winston-enricher");

require('newrelic');

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 8080;

const logger = _winston.createLogger({
  level: 'info',
  transports: [new _winston.transports.Console()],
  format: _winston.format.combine(_winston.format((info, opts) => Object.assign(info, {
    module: __filename
  }))(), _winstonEnricher(), _winston.format.json())
}); // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get


app.use('/', router);
app.listen(PORT, () => {
  logger.info(`Upload Service started on port ${PORT}`);
});
router.post('/upload', upload.any(), async (req, res) => {
  logger.info("Started");
  let image = req.files[0].buffer;
  let name = req.body.name.toLowerCase();
  let fileName = (0, _helpers.uniqueId)(); // parse from body

  logger.info(fileName, name, image); // determine file extension

  let ext = (0, _helpers.fileExt)(req.body.mimeType); // base64 image to binary data

  logger.info("Image received");
  let imageData = Buffer.from(image, 'base64'); // upload to s3

  let link = await (0, _helpers.uploadFile)(fileName + ext, imageData); // push to rds

  let data = await (0, _helpers.push2RDS)(fileName, ext, name, link);
  res.send(data);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJ1cGxvYWQiLCJtdWx0ZXIiLCJhcHAiLCJleHByZXNzIiwicm91dGVyIiwiUm91dGVyIiwiUE9SVCIsImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiZm9ybWF0IiwiY29tYmluZSIsImluZm8iLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwibW9kdWxlIiwiX19maWxlbmFtZSIsIm5ld3JlbGljRm9ybWF0dGVyIiwianNvbiIsInVzZSIsImxpc3RlbiIsInBvc3QiLCJhbnkiLCJyZXEiLCJyZXMiLCJpbWFnZSIsImZpbGVzIiwiYnVmZmVyIiwibmFtZSIsImJvZHkiLCJ0b0xvd2VyQ2FzZSIsImZpbGVOYW1lIiwiZXh0IiwibWltZVR5cGUiLCJpbWFnZURhdGEiLCJCdWZmZXIiLCJmcm9tIiwibGluayIsImRhdGEiLCJzZW5kIl0sIm1hcHBpbmdzIjoiOztBQUNBOztBQUNBOztBQUdBOztBQUlBOztBQUNBOztBQVZBQSxPQUFPLENBQUMsVUFBRCxDQUFQOztBQUdBLE1BQU1DLE1BQU0sR0FBR0MsT0FBTSxFQUFyQjs7QUFDQSxNQUFNQyxHQUFHLEdBQUdDLFFBQU8sRUFBbkI7O0FBRUEsSUFBSUMsTUFBTSxHQUFHRCxRQUFPLENBQUNFLE1BQVIsRUFBYjs7QUFDQSxNQUFNQyxJQUFJLEdBQUcsSUFBYjs7QUFLQSxNQUFNQyxNQUFNLEdBQUdDLFFBQU8sQ0FBQ0MsWUFBUixDQUFxQjtBQUNoQ0MsRUFBQUEsS0FBSyxFQUFFLE1BRHlCO0FBRWhDQyxFQUFBQSxVQUFVLEVBQUUsQ0FDVixJQUFJSCxRQUFPLENBQUNHLFVBQVIsQ0FBbUJDLE9BQXZCLEVBRFUsQ0FGb0I7QUFLaENDLEVBQUFBLE1BQU0sRUFBRUwsUUFBTyxDQUFDSyxNQUFSLENBQWVDLE9BQWYsQ0FDSk4sUUFBTyxDQUFDSyxNQUFSLENBQWUsQ0FBQ0UsSUFBRCxFQUFPQyxJQUFQLEtBQWdCQyxNQUFNLENBQUNDLE1BQVAsQ0FBY0gsSUFBZCxFQUFvQjtBQUFDSSxJQUFBQSxNQUFNLEVBQUVDO0FBQVQsR0FBcEIsQ0FBL0IsR0FESSxFQUVKQyxnQkFBaUIsRUFGYixFQUdKYixRQUFPLENBQUNLLE1BQVIsQ0FBZVMsSUFBZixFQUhJO0FBTHdCLENBQXJCLENBQWYsQyxDQVlBO0FBQ0E7OztBQUdBcEIsR0FBRyxDQUFDcUIsR0FBSixDQUFRLEdBQVIsRUFBYW5CLE1BQWI7QUFFQUYsR0FBRyxDQUFDc0IsTUFBSixDQUFXbEIsSUFBWCxFQUFpQixNQUFNO0FBQ25CQyxFQUFBQSxNQUFNLENBQUNRLElBQVAsQ0FBYSxrQ0FBaUNULElBQUssRUFBbkQ7QUFDSCxDQUZEO0FBSUFGLE1BQU0sQ0FBQ3FCLElBQVAsQ0FBWSxTQUFaLEVBQXVCekIsTUFBTSxDQUFDMEIsR0FBUCxFQUF2QixFQUFxQyxPQUFNQyxHQUFOLEVBQVdDLEdBQVgsS0FBbUI7QUFDcERyQixFQUFBQSxNQUFNLENBQUNRLElBQVAsQ0FBWSxTQUFaO0FBQ0EsTUFBSWMsS0FBSyxHQUFHRixHQUFHLENBQUNHLEtBQUosQ0FBVSxDQUFWLEVBQWFDLE1BQXpCO0FBQ0EsTUFBSUMsSUFBSSxHQUFHTCxHQUFHLENBQUNNLElBQUosQ0FBU0QsSUFBVCxDQUFjRSxXQUFkLEVBQVg7QUFDQSxNQUFJQyxRQUFRLEdBQUcsd0JBQWYsQ0FKb0QsQ0FLcEQ7O0FBQ0E1QixFQUFBQSxNQUFNLENBQUNRLElBQVAsQ0FBWW9CLFFBQVosRUFBc0JILElBQXRCLEVBQTRCSCxLQUE1QixFQU5vRCxDQVFwRDs7QUFDQSxNQUFJTyxHQUFHLEdBQUcsc0JBQVFULEdBQUcsQ0FBQ00sSUFBSixDQUFTSSxRQUFqQixDQUFWLENBVG9ELENBV3BEOztBQUNBOUIsRUFBQUEsTUFBTSxDQUFDUSxJQUFQLENBQVksZ0JBQVo7QUFDQSxNQUFJdUIsU0FBUyxHQUFHQyxNQUFNLENBQUNDLElBQVAsQ0FBWVgsS0FBWixFQUFtQixRQUFuQixDQUFoQixDQWJvRCxDQWVwRDs7QUFDQSxNQUFJWSxJQUFJLEdBQUcsTUFBTSx5QkFBV04sUUFBUSxHQUFHQyxHQUF0QixFQUEyQkUsU0FBM0IsQ0FBakIsQ0FoQm9ELENBa0JwRDs7QUFDQSxNQUFJSSxJQUFJLEdBQUcsTUFBTSx1QkFBU1AsUUFBVCxFQUFtQkMsR0FBbkIsRUFBd0JKLElBQXhCLEVBQThCUyxJQUE5QixDQUFqQjtBQUNBYixFQUFBQSxHQUFHLENBQUNlLElBQUosQ0FBU0QsSUFBVDtBQUNELENBckJIIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSgnbmV3cmVsaWMnKTtcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgbXVsdGVyIGZyb20gJ211bHRlcidcbmNvbnN0IHVwbG9hZCA9IG11bHRlcigpXG5jb25zdCBhcHAgPSBleHByZXNzKClcbmltcG9ydCB7IHVuaXF1ZUlkLCB1cGxvYWRGaWxlLCBmaWxlRXh0LCBwdXNoMlJEUyB9IGZyb20gJy4vc3JjL2hlbHBlcnMuanMnXG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbmNvbnN0IFBPUlQgPSA4MDgwXG5cbmltcG9ydCB3aW5zdG9uIGZyb20gJ3dpbnN0b24nXG5pbXBvcnQgbmV3cmVsaWNGb3JtYXR0ZXIgZnJvbSAnQG5ld3JlbGljL3dpbnN0b24tZW5yaWNoZXInXG5cbmNvbnN0IGxvZ2dlciA9IHdpbnN0b24uY3JlYXRlTG9nZ2VyKHtcbiAgICBsZXZlbDogJ2luZm8nLFxuICAgIHRyYW5zcG9ydHM6IFtcbiAgICAgIG5ldyB3aW5zdG9uLnRyYW5zcG9ydHMuQ29uc29sZSgpXG4gICAgXSxcbiAgICBmb3JtYXQ6IHdpbnN0b24uZm9ybWF0LmNvbWJpbmUoXG4gICAgICAgIHdpbnN0b24uZm9ybWF0KChpbmZvLCBvcHRzKSA9PiBPYmplY3QuYXNzaWduKGluZm8sIHttb2R1bGU6IF9fZmlsZW5hbWV9KSkoKSxcbiAgICAgICAgbmV3cmVsaWNGb3JtYXR0ZXIoKSxcbiAgICAgICAgd2luc3Rvbi5mb3JtYXQuanNvbigpXG4gICAgKVxuICB9KTtcblxuLy8gZm9yIHRlc3RpbmcgbG9jYWxseTogbm9kZSAtciBkb3RlbnYvY29uZmlnIGluZGV4LmpzICBcbi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI4MzA1MTIwL2RpZmZlcmVuY2VzLWJldHdlZW4tZXhwcmVzcy1yb3V0ZXItYW5kLWFwcC1nZXRcblxuXG5hcHAudXNlKCcvJywgcm91dGVyKVxuXG5hcHAubGlzdGVuKFBPUlQsICgpID0+IHtcbiAgICBsb2dnZXIuaW5mbyhgVXBsb2FkIFNlcnZpY2Ugc3RhcnRlZCBvbiBwb3J0ICR7UE9SVH1gKVxufSlcblxucm91dGVyLnBvc3QoJy91cGxvYWQnLCB1cGxvYWQuYW55KCksIGFzeW5jKHJlcSwgcmVzKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oXCJTdGFydGVkXCIpXG4gICAgbGV0IGltYWdlID0gcmVxLmZpbGVzWzBdLmJ1ZmZlclxuICAgIGxldCBuYW1lID0gcmVxLmJvZHkubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGxldCBmaWxlTmFtZSA9IHVuaXF1ZUlkKClcbiAgICAvLyBwYXJzZSBmcm9tIGJvZHlcbiAgICBsb2dnZXIuaW5mbyhmaWxlTmFtZSwgbmFtZSwgaW1hZ2UpXG5cbiAgICAvLyBkZXRlcm1pbmUgZmlsZSBleHRlbnNpb25cbiAgICBsZXQgZXh0ID0gZmlsZUV4dChyZXEuYm9keS5taW1lVHlwZSlcblxuICAgIC8vIGJhc2U2NCBpbWFnZSB0byBiaW5hcnkgZGF0YVxuICAgIGxvZ2dlci5pbmZvKFwiSW1hZ2UgcmVjZWl2ZWRcIilcbiAgICBsZXQgaW1hZ2VEYXRhID0gQnVmZmVyLmZyb20oaW1hZ2UsICdiYXNlNjQnKVxuXG4gICAgLy8gdXBsb2FkIHRvIHMzXG4gICAgbGV0IGxpbmsgPSBhd2FpdCB1cGxvYWRGaWxlKGZpbGVOYW1lICsgZXh0LCBpbWFnZURhdGEpXG5cbiAgICAvLyBwdXNoIHRvIHJkc1xuICAgIGxldCBkYXRhID0gYXdhaXQgcHVzaDJSRFMoZmlsZU5hbWUsIGV4dCwgbmFtZSwgbGluaylcbiAgICByZXMuc2VuZChkYXRhKSBcbiAgfSk7Il19