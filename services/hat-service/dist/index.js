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

  let hat = null;

  if (req.query.style == undefined) {
    _newrelic.addCustomAttribute('random', true);

    hat = await (0, _helpers.getRandomHat)();
  } else {
    _newrelic.addCustomAttribute('random', false);

    hat = await (0, _helpers.getSpecificHat)(req.query.style);
  }

  if (hat == null) {
    logger.info(`Hat style ${req.query.style} does not exist`);
    return res.status(400).send({
      message: 'This hat style does not exist! If you want this style - try submitting it'
    });
  }

  logger.info(`Going to apply ${numHats} ${req.query.style} hat(s) to image`);
  let b64Result = await (0, _helpers.requestManipulate)(req.face, hat, numHats);
  res.send(b64Result);
}

router.get('/hatme', async function hatmeGet(req, res, next) {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('qs', qs);

  _newrelic.addCustomAttribute('customFace', false);

  req.face = await (0, _helpers.defaultBoss)();
  await applyHats(req, res, next);
});
router.post('/hatme', upload.any(), async function hatmePost(req, res, next) {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('qs', qs);

  _newrelic.addCustomAttribute('customFace', true);

  req.face = req.files[0].buffer;
  await applyHats(req, res, next);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiZm9ybWF0IiwiY29tYmluZSIsImluZm8iLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwibW9kdWxlIiwiX19maWxlbmFtZSIsImVycm9ycyIsInN0YWNrIiwibmV3cmVsaWNGb3JtYXR0ZXIiLCJqc29uIiwidXBsb2FkIiwibXVsdGVyIiwiYXBwIiwiZXhwcmVzcyIsInJvdXRlciIsIlJvdXRlciIsIlBPUlQiLCJ1c2UiLCJyZXEiLCJyZXMiLCJuZXh0IiwidXJsIiwibGlzdGVuIiwibnVtSGF0cyIsImdldCIsImxpc3QiLCJkYXRhIiwibGVuZ3RoIiwibmV3cmVsaWMiLCJhZGRDdXN0b21BdHRyaWJ1dGUiLCJzZW5kIiwiYXBwbHlIYXRzIiwicXVlcnkiLCJudW1iZXIiLCJ1bmRlZmluZWQiLCJoYXQiLCJzdHlsZSIsInN0YXR1cyIsIm1lc3NhZ2UiLCJiNjRSZXN1bHQiLCJmYWNlIiwiaGF0bWVHZXQiLCJxcyIsInBhcnNlIiwicG9zdCIsImFueSIsImhhdG1lUG9zdCIsImZpbGVzIiwiYnVmZmVyIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQWdCQTs7QUFkQSxNQUFNQSxNQUFNLEdBQUdDLFFBQU8sQ0FBQ0MsWUFBUixDQUFxQjtBQUNoQ0MsRUFBQUEsS0FBSyxFQUFFLE1BRHlCO0FBRWhDQyxFQUFBQSxVQUFVLEVBQUUsQ0FDVixJQUFJSCxRQUFPLENBQUNHLFVBQVIsQ0FBbUJDLE9BQXZCLEVBRFUsQ0FGb0I7QUFLaENDLEVBQUFBLE1BQU0sRUFBRUwsUUFBTyxDQUFDSyxNQUFSLENBQWVDLE9BQWYsQ0FDSk4sUUFBTyxDQUFDSyxNQUFSLENBQWUsQ0FBQ0UsSUFBRCxFQUFPQyxJQUFQLEtBQWdCQyxNQUFNLENBQUNDLE1BQVAs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QUFDQWQsRUFBQUEsU0FBUSxDQUFDQyxrQkFBVCxDQUE0QixZQUE1QixFQUEwQyxJQUExQzs7QUFDQVgsRUFBQUEsR0FBRyxDQUFDc0IsSUFBSixHQUFXdEIsR0FBRyxDQUFDNkIsS0FBSixDQUFVLENBQVYsRUFBYUMsTUFBeEI7QUFDQSxRQUFNakIsU0FBUyxDQUFDYixHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWCxDQUFmO0FBQ0gsQ0FORCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBuZXdyZWxpYyBmcm9tICduZXdyZWxpYydcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgZXhwcmVzc0FzeW5jRXJyb3JzIGZyb20gJ2V4cHJlc3MtYXN5bmMtZXJyb3JzJ1xuaW1wb3J0IG11bHRlciBmcm9tICdtdWx0ZXInXG5pbXBvcnQgdXJsIGZyb20gJ3VybCdcbmltcG9ydCB3aW5zdG9uIGZyb20gJ3dpbnN0b24nXG5pbXBvcnQgbmV3cmVsaWNGb3JtYXR0ZXIgZnJvbSAnQG5ld3JlbGljL3dpbnN0b24tZW5yaWNoZXInXG5cbmNvbnN0IGxvZ2dlciA9IHdpbnN0b24uY3JlYXRlTG9nZ2VyKHtcbiAgICBsZXZlbDogJ2luZm8nLFxuICAgIHRyYW5zcG9ydHM6IFtcbiAgICAgIG5ldyB3aW5zdG9uLnRyYW5zcG9ydHMuQ29uc29sZSgpXG4gICAgXSxcbiAgICBmb3JtYXQ6IHdpbnN0b24uZm9ybWF0LmNvbWJpbmUoXG4gICAgICAgIHdpbnN0b24uZm9ybWF0KChpbmZvLCBvcHRzKSA9PiBPYmplY3QuYXNzaWduKGluZm8sIHttb2R1bGU6IF9fZmlsZW5hbWV9KSkoKSxcbiAgICAgICAgd2luc3Rvbi5mb3JtYXQuZXJyb3JzKHtzdGFjazogdHJ1ZX0pLFxuICAgICAgICBuZXdyZWxpY0Zvcm1hdHRlcigpLFxuICAgICAgICB3aW5zdG9uLmZvcm1hdC5qc29uKClcbiAgICApXG4gIH0pO1xuXG5cbmltcG9ydCB7IGRlZmF1bHRCb3NzLCBnZXRSYW5kb21IYXQsIGdldFNwZWNpZmljSGF0LCByZXF1ZXN0TWFuaXB1bGF0ZSwgZ2V0SGF0RGF0YSB9IGZyb20gJy4vc3JjL2hlbHBlcnMuanMnXG5jb25zdCB1cGxvYWQgPSBtdWx0ZXIoKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbmNvbnN0IFBPUlQgPSAxMzM3XG5cbi8vIGZvciB0ZXN0aW5nIGxvY2FsbHk6IG5vZGUgLXIgZG90ZW52L2NvbmZpZyBpbmRleC5qcyAgXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODMwNTEyMC9kaWZmZXJlbmNlcy1iZXR3ZWVuLWV4cHJlc3Mtcm91dGVyLWFuZC1hcHAtZ2V0XG5cbmFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICBsb2dnZXIuaW5mbyhgcmVxdWVzdGVkOiAke3JlcS51cmx9YCk7XG4gICAgbmV4dCgpO1xufSlcblxuYXBwLnVzZSgnLycsIHJvdXRlcilcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oYEhhdHMgU2VydmljZSBzdGFydGVkIG9uIHBvcnQgJHtQT1JUfWApO1xufSlcblxuYXN5bmMgZnVuY3Rpb24gbnVtSGF0cyhyZXEsIHJlcywgbmV4dCkge1xuXG4gICAgbmV4dCgpO1xufVxuXG5yb3V0ZXIuZ2V0KCcvbGlzdCcsIGFzeW5jIGZ1bmN0aW9uIGxpc3QocmVxLCByZXMpIHtcbiAgICBsb2dnZXIuaW5mbyhcIkdldHRpbmcgaGF0c1wiKVxuICAgIGxldCBkYXRhID0gYXdhaXQgZ2V0SGF0RGF0YSgpXG4gICAgbG9nZ2VyLmluZm8oYGZldGNoZWQgJHtkYXRhLmxlbmd0aH0gaGF0c2ApO1xuIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgnaGF0TGlzdFNpemUnLCBkYXRhLmxlbmd0aCk7XG4gICAgcmVzLnNlbmQoZGF0YSlcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBhcHBseUhhdHMocmVxLCByZXMsIG5leHQpIHtcbiAgICBsZXQgbnVtSGF0cyA9IDE7XG4gICAgaWYgKHJlcS5xdWVyeS5udW1iZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG51bUhhdHMgPSByZXEucXVlcnkubnVtYmVyIFxuICAgIH1cbiAgICBcbiAgICBsZXQgaGF0ID0gbnVsbDtcbiAgICBpZiAocmVxLnF1ZXJ5LnN0eWxlID09IHVuZGVmaW5lZCkge1xuICAgICAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ3JhbmRvbScsIHRydWUpO1xuICAgICAgICBoYXQgPSBhd2FpdCBnZXRSYW5kb21IYXQoKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncmFuZG9tJywgZmFsc2UpO1xuICAgICAgICBoYXQgPSBhd2FpdCBnZXRTcGVjaWZpY0hhdChyZXEucXVlcnkuc3R5bGUpO1xuICAgIH0gICAgXG4gICAgaWYgKGhhdCA9PSBudWxsKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKGBIYXQgc3R5bGUgJHtyZXEucXVlcnkuc3R5bGV9IGRvZXMgbm90IGV4aXN0YClcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGlzIGhhdCBzdHlsZSBkb2VzIG5vdCBleGlzdCEgSWYgeW91IHdhbnQgdGhpcyBzdHlsZSAtIHRyeSBzdWJtaXR0aW5nIGl0J1xuICAgICAgICAgfSk7ICAgICAgICAgICAgIFxuICAgIH1cbiAgICBsb2dnZXIuaW5mbyhgR29pbmcgdG8gYXBwbHkgJHtudW1IYXRzfSAke3JlcS5xdWVyeS5zdHlsZX0gaGF0KHMpIHRvIGltYWdlYCk7XG5cbiAgICBsZXQgYjY0UmVzdWx0ID0gYXdhaXQgcmVxdWVzdE1hbmlwdWxhdGUocmVxLmZhY2UsIGhhdCwgbnVtSGF0cylcbiAgICByZXMuc2VuZChiNjRSZXN1bHQpXG59XG5cbnJvdXRlci5nZXQoJy9oYXRtZScsIGFzeW5jIGZ1bmN0aW9uIGhhdG1lR2V0KHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgbGV0IHFzID0gdXJsLnBhcnNlKHJlcS51cmwpLnF1ZXJ5O1xuICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncXMnLCBxcyk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdjdXN0b21GYWNlJywgZmFsc2UpO1xuICAgIHJlcS5mYWNlID0gYXdhaXQgZGVmYXVsdEJvc3MoKVxuICAgIGF3YWl0IGFwcGx5SGF0cyhyZXEsIHJlcywgbmV4dCk7XG59KTtcblxucm91dGVyLnBvc3QoJy9oYXRtZScsIHVwbG9hZC5hbnkoKSwgYXN5bmMgZnVuY3Rpb24gaGF0bWVQb3N0KHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgbGV0IHFzID0gdXJsLnBhcnNlKHJlcS51cmwpLnF1ZXJ5O1xuICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncXMnLCBxcyk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdjdXN0b21GYWNlJywgdHJ1ZSk7XG4gICAgcmVxLmZhY2UgPSByZXEuZmlsZXNbMF0uYnVmZmVyXG4gICAgYXdhaXQgYXBwbHlIYXRzKHJlcSwgcmVzLCBuZXh0KTtcbn0pOyAiXX0=