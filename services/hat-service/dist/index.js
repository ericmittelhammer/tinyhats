"use strict";

var _newrelic = require("newrelic");

var _express = require("express");

var _multer = require("multer");

var _url = require("url");

var _winston = require("winston");

var _winstonEnricher = require("@newrelic/winston-enricher");

var _helpers = require("./src/helpers.js");

const logger = _winston.createLogger({
  level: 'info',
  transports: [new _winston.transports.Console()],
  format: _winston.format.combine(_winston.format.label({
    module: 'index.js'
  }), _winstonEnricher(), _winston.format.json())
});

const upload = _multer();

const app = _express();

var router = _express.Router();

const PORT = 1337; // for testing locally: node -r dotenv/config index.js  
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get

app.use(function (req, res, next) {
  logger.info("requested", {
    url: req.url
  });
  next();
});
app.use('/', router);
app.listen(PORT, () => {
  logger.info(`Hats Service started on port ${PORT}`);
});

async function numHats(req, res, next) {
  next();
}

router.get('/list', async (req, res) => {
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
    logger.info(`Coudln't find hat style ${req.query.style}`);
    return res.status(400).send({
      message: 'This hat style does not exist! If you want this style - try submitting it'
    });
  }

  logger.info(`Got hat ${req.query.style}`);
  let b64Result = await (0, _helpers.requestManipulate)(req.face, hat, numHats);
  res.send(b64Result);
}

router.get('/hatme', async (req, res, next) => {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('qs', qs);

  _newrelic.addCustomAttribute('customFace', false);

  req.face = await (0, _helpers.defaultBoss)();
  await applyHats(req, res, next);
});
router.post('/hatme', upload.any(), async (req, res, next) => {
  let qs = _url.parse(req.url).query;

  _newrelic.addCustomAttribute('qs', qs);

  _newrelic.addCustomAttribute('customFace', true);

  req.face = req.files[0].buffer;
  await applyHats(req, res, next);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiZm9ybWF0IiwiY29tYmluZSIsImxhYmVsIiwibW9kdWxlIiwibmV3cmVsaWNGb3JtYXR0ZXIiLCJqc29uIiwidXBsb2FkIiwibXVsdGVyIiwiYXBwIiwiZXhwcmVzcyIsInJvdXRlciIsIlJvdXRlciIsIlBPUlQiLCJ1c2UiLCJyZXEiLCJyZXMiLCJuZXh0IiwiaW5mbyIsInVybCIsImxpc3RlbiIsIm51bUhhdHMiLCJnZXQiLCJkYXRhIiwibGVuZ3RoIiwibmV3cmVsaWMiLCJhZGRDdXN0b21BdHRyaWJ1dGUiLCJzZW5kIiwiYXBwbHlIYXRzIiwicXVlcnkiLCJudW1iZXIiLCJ1bmRlZmluZWQiLCJoYXQiLCJzdHlsZSIsInN0YXR1cyIsIm1lc3NhZ2UiLCJiNjRSZXN1bHQiLCJmYWNlIiwicXMiLCJwYXJzZSIsInBvc3QiLCJhbnkiLCJmaWxlcyIsImJ1ZmZlciJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFlQTs7QUFiQSxNQUFNQSxNQUFNLEdBQUdDLFFBQU8sQ0FBQ0MsWUFBUixDQUFxQjtBQUNoQ0MsRUFBQUEsS0FBSyxFQUFFLE1BRHlCO0FBRWhDQyxFQUFBQSxVQUFVLEVBQUUsQ0FDVixJQUFJSCxRQUFPLENBQUNHLFVBQVIsQ0FBbUJDLE9BQXZCLEVBRFUsQ0FGb0I7QUFLaENDLEVBQUFBLE1BQU0sRUFBRUwsUUFBTyxDQUFDSyxNQUFSLENBQWVDLE9BQWYsQ0FDSk4sUUFBTyxDQUFDSyxNQUFSLENBQWVFLEtBQWYsQ0FBcUI7QUFBRUMsSUFBQUEsTUFBTSxFQUFFO0FBQVYsR0FBckIsQ0FESSxFQUVKQyxnQkFBaUIsRUFGYixFQUdKVCxRQUFPLENBQUNLLE1BQVIsQ0FBZUssSUFBZixFQUhJO0FBTHdCLENBQXJCLENBQWY7O0FBY0Es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cnQgZXhwcmVzcyBmcm9tICdleHByZXNzJ1xuaW1wb3J0IG11bHRlciBmcm9tICdtdWx0ZXInXG5pbXBvcnQgdXJsIGZyb20gJ3VybCdcbmltcG9ydCB3aW5zdG9uIGZyb20gJ3dpbnN0b24nXG5pbXBvcnQgbmV3cmVsaWNGb3JtYXR0ZXIgZnJvbSAnQG5ld3JlbGljL3dpbnN0b24tZW5yaWNoZXInXG5cbmNvbnN0IGxvZ2dlciA9IHdpbnN0b24uY3JlYXRlTG9nZ2VyKHtcbiAgICBsZXZlbDogJ2luZm8nLFxuICAgIHRyYW5zcG9ydHM6IFtcbiAgICAgIG5ldyB3aW5zdG9uLnRyYW5zcG9ydHMuQ29uc29sZSgpXG4gICAgXSxcbiAgICBmb3JtYXQ6IHdpbnN0b24uZm9ybWF0LmNvbWJpbmUoXG4gICAgICAgIHdpbnN0b24uZm9ybWF0LmxhYmVsKHsgbW9kdWxlOiAnaW5kZXguanMnIH0pLFxuICAgICAgICBuZXdyZWxpY0Zvcm1hdHRlcigpLFxuICAgICAgICB3aW5zdG9uLmZvcm1hdC5qc29uKClcbiAgICApXG4gIH0pO1xuXG5cbmltcG9ydCB7IGRlZmF1bHRCb3NzLCBnZXRSYW5kb21IYXQsIGdldFNwZWNpZmljSGF0LCByZXF1ZXN0TWFuaXB1bGF0ZSwgZ2V0SGF0RGF0YSB9IGZyb20gJy4vc3JjL2hlbHBlcnMuanMnXG5jb25zdCB1cGxvYWQgPSBtdWx0ZXIoKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbmNvbnN0IFBPUlQgPSAxMzM3XG5cbi8vIGZvciB0ZXN0aW5nIGxvY2FsbHk6IG5vZGUgLXIgZG90ZW52L2NvbmZpZyBpbmRleC5qcyAgXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODMwNTEyMC9kaWZmZXJlbmNlcy1iZXR3ZWVuLWV4cHJlc3Mtcm91dGVyLWFuZC1hcHAtZ2V0XG5cbmFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICBsb2dnZXIuaW5mbyhcInJlcXVlc3RlZFwiLCB7dXJsOiByZXEudXJsfSk7XG4gICAgbmV4dCgpO1xufSlcblxuYXBwLnVzZSgnLycsIHJvdXRlcilcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oYEhhdHMgU2VydmljZSBzdGFydGVkIG9uIHBvcnQgJHtQT1JUfWApO1xufSlcblxuYXN5bmMgZnVuY3Rpb24gbnVtSGF0cyhyZXEsIHJlcywgbmV4dCkge1xuXG4gICAgbmV4dCgpO1xufVxuXG5yb3V0ZXIuZ2V0KCcvbGlzdCcsIGFzeW5jKHJlcSwgcmVzKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oXCJHZXR0aW5nIGhhdHNcIilcbiAgICBsZXQgZGF0YSA9IGF3YWl0IGdldEhhdERhdGEoKVxuICAgIGxvZ2dlci5pbmZvKGBmZXRjaGVkICR7ZGF0YS5sZW5ndGh9IGhhdHNgKTtcbiBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ2hhdExpc3RTaXplJywgZGF0YS5sZW5ndGgpO1xuICAgIHJlcy5zZW5kKGRhdGEpXG59KTtcblxuYXN5bmMgZnVuY3Rpb24gYXBwbHlIYXRzKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgbGV0IG51bUhhdHMgPSAxO1xuICAgIGlmIChyZXEucXVlcnkubnVtYmVyICE9IHVuZGVmaW5lZCkge1xuICAgICAgICBudW1IYXRzID0gcmVxLnF1ZXJ5Lm51bWJlciBcbiAgICB9XG4gICAgXG4gICAgbGV0IGhhdCA9IG51bGw7XG4gICAgaWYgKHJlcS5xdWVyeS5zdHlsZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdyYW5kb20nLCB0cnVlKTtcbiAgICAgICAgaGF0ID0gYXdhaXQgZ2V0UmFuZG9tSGF0KClcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ3JhbmRvbScsIGZhbHNlKTtcbiAgICAgICAgaGF0ID0gYXdhaXQgZ2V0U3BlY2lmaWNIYXQocmVxLnF1ZXJ5LnN0eWxlKTtcbiAgICB9ICAgIFxuICAgIGlmIChoYXQgPT0gbnVsbCkge1xuICAgICAgICBsb2dnZXIuaW5mbyhgQ291ZGxuJ3QgZmluZCBoYXQgc3R5bGUgJHtyZXEucXVlcnkuc3R5bGV9YClcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGlzIGhhdCBzdHlsZSBkb2VzIG5vdCBleGlzdCEgSWYgeW91IHdhbnQgdGhpcyBzdHlsZSAtIHRyeSBzdWJtaXR0aW5nIGl0J1xuICAgICAgICAgfSk7ICAgICAgICAgICAgIFxuICAgIH1cbiAgICBsb2dnZXIuaW5mbyhgR290IGhhdCAke3JlcS5xdWVyeS5zdHlsZX1gKTtcbiAgICBsZXQgYjY0UmVzdWx0ID0gYXdhaXQgcmVxdWVzdE1hbmlwdWxhdGUocmVxLmZhY2UsIGhhdCwgbnVtSGF0cylcbiAgICByZXMuc2VuZChiNjRSZXN1bHQpXG59XG5cbnJvdXRlci5nZXQoJy9oYXRtZScsIGFzeW5jKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgbGV0IHFzID0gdXJsLnBhcnNlKHJlcS51cmwpLnF1ZXJ5O1xuICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncXMnLCBxcyk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdjdXN0b21GYWNlJywgZmFsc2UpO1xuICAgIHJlcS5mYWNlID0gYXdhaXQgZGVmYXVsdEJvc3MoKVxuICAgIGF3YWl0IGFwcGx5SGF0cyhyZXEsIHJlcywgbmV4dCk7XG59KTtcblxucm91dGVyLnBvc3QoJy9oYXRtZScsIHVwbG9hZC5hbnkoKSwgYXN5bmMocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBsZXQgcXMgPSB1cmwucGFyc2UocmVxLnVybCkucXVlcnk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdxcycsIHFzKTtcbiAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ2N1c3RvbUZhY2UnLCB0cnVlKTtcbiAgICByZXEuZmFjZSA9IHJlcS5maWxlc1swXS5idWZmZXJcbiAgICBhd2FpdCBhcHBseUhhdHMocmVxLCByZXMsIG5leHQpO1xufSk7ICJdfQ==