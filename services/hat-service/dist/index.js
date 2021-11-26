"use strict";

var _newrelic = require("newrelic");

var _express = require("express");

var _expressAsyncErrors = require("express-async-errors");

var _multer = require("multer");

var _url = require("url");

var _winston = require("winston");

var _winstonEnricher = require("@newrelic/winston-enricher");

var _helpers = require("./src/helpers.js");

const logger = _winston.createLogger({
  level: 'info',
  transports: [new _winston.transports.Console()],
  format: _winston.format.combine(_winston.format((info, opts) => Object.assign(info, {
    module: __filename
  }))(), _winston.format.errors({
    stack: true
  }), _winstonEnricher(), _winston.format.json())
});

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 1337; // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use(function (req, res, next) {
  logger.info(`requested: ${req.url}`);
  next();
});
app.use('/', router);
app.listen(PORT, () => {
  logger.info(`Hats Service started on port ${PORT}`);
});

async function numHats(req, res, next) {
  next();
}

router.get('/list', async function list(req, res) {
  logger.info("Getting hats");
  let data = await (0, _helpers.getHatData)();
  logger.info(`fetched ${data.length} hats`);

  _newrelic.addCustomAttribute('hatListSize', data.length);

  res.send(data);
});

async function applyHats(req, res, next) {
  let numHats = 1;

  if (req.query.number != undefined) {
    numHats = req.query.number;
  }

  let sanitizedHatStyle = req.query.style.toLower();
  let hat = null;

  if (req.query.style == undefined) {
    _newrelic.addCustomAttribute('random', true);

    hat = await (0, _helpers.getRandomHat)();
  } else {
    _newrelic.addCustomAttribute('random', false);

    hat = await (0, _helpers.getSpecificHat)(sanitizedHatStyle);
  }

  if (hat == null) {
    logger.info(`Hat style ${req.query.style} does not exist`);
    throw new Error(`Hat style ${req.query.style} does not exist`);
  }

  logger.info(`Going to apply ${numHats} ${req.query.style} hats to image`);
  let b64Result = await (0, _helpers.requestManipulate)(req.face, hat, numHats);
  res.send(b64Result);
}

router.get('/hatme', async function hatmeGet(req, res, next) {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('requestedStyle', qs.style);

  _newrelic.addCustomAttribute('customFace', false);

  req.face = await (0, _helpers.defaultBoss)();
  await applyHats(req, res, next);
});
router.post('/hatme', upload.any(), async function hatmePost(req, res, next) {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('requestedStyle', qs.style);

  _newrelic.addCustomAttribute('customFace', true);

  req.face = req.files[0].buffer;
  await applyHats(req, res, next);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiZm9ybWF0IiwiY29tYmluZSIsImluZm8iLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwibW9kdWxlIiwiX19maWxlbmFtZSIsImVycm9ycyIsInN0YWNrIiwibmV3cmVsaWNGb3JtYXR0ZXIiLCJqc29uIiwidXBsb2FkIiwibXVsdGVyIiwiYXBwIiwiZXhwcmVzcyIsInJvdXRlciIsIlJvdXRlciIsIlBPUlQiLCJ1c2UiLCJyZXEiLCJyZXMiLCJuZXh0IiwidXJsIiwibGlzdGVuIiwibnVtSGF0cyIsImdldCIsImxpc3QiLCJkYXRhIiwibGVuZ3RoIiwibmV3cmVsaWMiLCJhZGRDdXN0b21BdHRyaWJ1dGUiLCJzZW5kIiwiYXBwbHlIYXRzIiwicXVlcnkiLCJudW1iZXIiLCJ1bmRlZmluZWQiLCJzYW5pdGl6ZWRIYXRTdHlsZSIsInN0eWxlIiwidG9Mb3dlciIsImhhdCIsIkVycm9yIiwiYjY0UmVzdWx0IiwiZmFjZSIsImhhdG1lR2V0IiwicXMiLCJwYXJzZSIsInBvc3QiLCJhbnkiLCJoYXRtZVBvc3QiLCJmaWxlcyIsImJ1ZmZlciJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFnQkE7O0FBZEEsTUFBTUEsTUFBTSxHQUFHQyxRQUFPLENBQUNDLFlBQVIsQ0FBcUI7QUFDaENDLEVBQUFBLEtBQUssRUFBRSxNQUR5QjtBQUVoQ0MsRUFBQUEsVUFBVSxFQUFFLENBQ1YsSUFBSUgsUUFBTyxDQUFDRyxVQUFSLENBQW1CQyxPQUF2QixFQURVLENBRm9CO0FBS2hDQyxFQUFBQSxNQUFNLEVBQUVMLFFBQU8sQ0FBQ0ssTUFBUixDQUFlQyxPQUFmLENBQ0pOLFFBQU8sQ0FBQ0ssTUFBUixDQUFlLENBQUNFLElBQUQsRUFBT0MsSUFBUCxLQUFn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QUNBSixFQUFBQSxTQUFRLENBQUNDLGtCQUFULENBQTRCLGdCQUE1QixFQUE4Q2MsRUFBRSxDQUFDUCxLQUFqRDs7QUFDQVIsRUFBQUEsU0FBUSxDQUFDQyxrQkFBVCxDQUE0QixZQUE1QixFQUEwQyxJQUExQzs7QUFDQVgsRUFBQUEsR0FBRyxDQUFDdUIsSUFBSixHQUFXdkIsR0FBRyxDQUFDOEIsS0FBSixDQUFVLENBQVYsRUFBYUMsTUFBeEI7QUFDQSxRQUFNbEIsU0FBUyxDQUFDYixHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWCxDQUFmO0FBQ0gsQ0FORCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBuZXdyZWxpYyBmcm9tICduZXdyZWxpYydcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgZXhwcmVzc0FzeW5jRXJyb3JzIGZyb20gJ2V4cHJlc3MtYXN5bmMtZXJyb3JzJ1xuaW1wb3J0IG11bHRlciBmcm9tICdtdWx0ZXInXG5pbXBvcnQgdXJsIGZyb20gJ3VybCdcbmltcG9ydCB3aW5zdG9uIGZyb20gJ3dpbnN0b24nXG5pbXBvcnQgbmV3cmVsaWNGb3JtYXR0ZXIgZnJvbSAnQG5ld3JlbGljL3dpbnN0b24tZW5yaWNoZXInXG5cbmNvbnN0IGxvZ2dlciA9IHdpbnN0b24uY3JlYXRlTG9nZ2VyKHtcbiAgICBsZXZlbDogJ2luZm8nLFxuICAgIHRyYW5zcG9ydHM6IFtcbiAgICAgIG5ldyB3aW5zdG9uLnRyYW5zcG9ydHMuQ29uc29sZSgpXG4gICAgXSxcbiAgICBmb3JtYXQ6IHdpbnN0b24uZm9ybWF0LmNvbWJpbmUoXG4gICAgICAgIHdpbnN0b24uZm9ybWF0KChpbmZvLCBvcHRzKSA9PiBPYmplY3QuYXNzaWduKGluZm8sIHttb2R1bGU6IF9fZmlsZW5hbWV9KSkoKSxcbiAgICAgICAgd2luc3Rvbi5mb3JtYXQuZXJyb3JzKHtzdGFjazogdHJ1ZX0pLFxuICAgICAgICBuZXdyZWxpY0Zvcm1hdHRlcigpLFxuICAgICAgICB3aW5zdG9uLmZvcm1hdC5qc29uKClcbiAgICApXG4gIH0pO1xuXG5cbmltcG9ydCB7IGRlZmF1bHRCb3NzLCBnZXRSYW5kb21IYXQsIGdldFNwZWNpZmljSGF0LCByZXF1ZXN0TWFuaXB1bGF0ZSwgZ2V0SGF0RGF0YSB9IGZyb20gJy4vc3JjL2hlbHBlcnMuanMnXG5jb25zdCB1cGxvYWQgPSBtdWx0ZXIoKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbmNvbnN0IFBPUlQgPSAxMzM3XG5cbi8vIGZvciB0ZXN0aW5nIGxvY2FsbHk6IG5vZGUgLXIgZG90ZW52L2NvbmZpZyBpbmRleC5qcyAgXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODMwNTEyMC9kaWZmZXJlbmNlcy1iZXR3ZWVuLWV4cHJlc3Mtcm91dGVyLWFuZC1hcHAtZ2V0XG5cbmFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICBsb2dnZXIuaW5mbyhgcmVxdWVzdGVkOiAke3JlcS51cmx9YCk7XG4gICAgbmV4dCgpO1xufSlcblxuYXBwLnVzZSgnLycsIHJvdXRlcilcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oYEhhdHMgU2VydmljZSBzdGFydGVkIG9uIHBvcnQgJHtQT1JUfWApO1xufSlcblxuYXN5bmMgZnVuY3Rpb24gbnVtSGF0cyhyZXEsIHJlcywgbmV4dCkge1xuXG4gICAgbmV4dCgpO1xufVxuXG5yb3V0ZXIuZ2V0KCcvbGlzdCcsIGFzeW5jIGZ1bmN0aW9uIGxpc3QocmVxLCByZXMpIHtcbiAgICBsb2dnZXIuaW5mbyhcIkdldHRpbmcgaGF0c1wiKVxuICAgIGxldCBkYXRhID0gYXdhaXQgZ2V0SGF0RGF0YSgpXG4gICAgbG9nZ2VyLmluZm8oYGZldGNoZWQgJHtkYXRhLmxlbmd0aH0gaGF0c2ApO1xuIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgnaGF0TGlzdFNpemUnLCBkYXRhLmxlbmd0aCk7XG4gICAgcmVzLnNlbmQoZGF0YSlcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBhcHBseUhhdHMocmVxLCByZXMsIG5leHQpIHtcbiAgICBsZXQgbnVtSGF0cyA9IDE7XG4gICAgaWYgKHJlcS5xdWVyeS5udW1iZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG51bUhhdHMgPSByZXEucXVlcnkubnVtYmVyIFxuICAgIH1cbiAgICBcbiAgICBsZXQgc2FuaXRpemVkSGF0U3R5bGUgPSByZXEucXVlcnkuc3R5bGUudG9Mb3dlcigpO1xuXG4gICAgbGV0IGhhdCA9IG51bGw7XG4gICAgaWYgKHJlcS5xdWVyeS5zdHlsZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdyYW5kb20nLCB0cnVlKTtcbiAgICAgICAgaGF0ID0gYXdhaXQgZ2V0UmFuZG9tSGF0KClcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ3JhbmRvbScsIGZhbHNlKTtcbiAgICAgICAgaGF0ID0gYXdhaXQgZ2V0U3BlY2lmaWNIYXQoc2FuaXRpemVkSGF0U3R5bGUpO1xuICAgIH0gICAgXG4gICAgaWYgKGhhdCA9PSBudWxsKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKGBIYXQgc3R5bGUgJHtyZXEucXVlcnkuc3R5bGV9IGRvZXMgbm90IGV4aXN0YClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIYXQgc3R5bGUgJHtyZXEucXVlcnkuc3R5bGV9IGRvZXMgbm90IGV4aXN0YCk7XG5cbiAgICB9XG4gICAgbG9nZ2VyLmluZm8oYEdvaW5nIHRvIGFwcGx5ICR7bnVtSGF0c30gJHtyZXEucXVlcnkuc3R5bGV9IGhhdHMgdG8gaW1hZ2VgKTtcblxuICAgIGxldCBiNjRSZXN1bHQgPSBhd2FpdCByZXF1ZXN0TWFuaXB1bGF0ZShyZXEuZmFjZSwgaGF0LCBudW1IYXRzKVxuICAgIHJlcy5zZW5kKGI2NFJlc3VsdClcbn1cblxucm91dGVyLmdldCgnL2hhdG1lJywgYXN5bmMgZnVuY3Rpb24gaGF0bWVHZXQocmVxLCByZXMsIG5leHQpIHtcbiAgICBsZXQgcXMgPSB1cmwucGFyc2UocmVxLnVybCkucXVlcnk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdyZXF1ZXN0ZWRTdHlsZScsIHFzLnN0eWxlKTtcbiAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ2N1c3RvbUZhY2UnLCBmYWxzZSk7XG4gICAgcmVxLmZhY2UgPSBhd2FpdCBkZWZhdWx0Qm9zcygpXG4gICAgYXdhaXQgYXBwbHlIYXRzKHJlcSwgcmVzLCBuZXh0KTtcbn0pO1xuXG5yb3V0ZXIucG9zdCgnL2hhdG1lJywgdXBsb2FkLmFueSgpLCBhc3luYyBmdW5jdGlvbiBoYXRtZVBvc3QocmVxLCByZXMsIG5leHQpIHtcbiAgICBsZXQgcXMgPSB1cmwucGFyc2UocmVxLnVybCkucXVlcnk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdyZXF1ZXN0ZWRTdHlsZScsIHFzLnN0eWxlKTtcbiAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ2N1c3RvbUZhY2UnLCB0cnVlKTtcbiAgICByZXEuZmFjZSA9IHJlcS5maWxlc1swXS5idWZmZXJcbiAgICBhd2FpdCBhcHBseUhhdHMocmVxLCByZXMsIG5leHQpO1xufSk7ICJdfQ==