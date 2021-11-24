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
  format: _winston.format.combine(_winston.format((info, opts) => Object.assign(info, {
    module: __filename
  }))(), _winstonEnricher(), _winston.format.json())
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiZm9ybWF0IiwiY29tYmluZSIsImluZm8iLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwibW9kdWxlIiwiX19maWxlbmFtZSIsIm5ld3JlbGljRm9ybWF0dGVyIiwianNvbiIsInVwbG9hZCIsIm11bHRlciIsImFwcCIsImV4cHJlc3MiLCJyb3V0ZXIiLCJSb3V0ZXIiLCJQT1JUIiwidXNlIiwicmVxIiwicmVzIiwibmV4dCIsInVybCIsImxpc3RlbiIsIm51bUhhdHMiLCJnZXQiLCJkYXRhIiwibGVuZ3RoIiwibmV3cmVsaWMiLCJhZGRDdXN0b21BdHRyaWJ1dGUiLCJzZW5kIiwiYXBwbHlIYXRzIiwicXVlcnkiLCJudW1iZXIiLCJ1bmRlZmluZWQiLCJoYXQiLCJzdHlsZSIsInN0YXR1cyIsIm1lc3NhZ2UiLCJiNjRSZXN1bHQiLCJmYWNlIiwicXMiLCJwYXJzZSIsInBvc3QiLCJhbnkiLCJmaWxlcyIsImJ1ZmZlciJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFlQTs7QUFiQSxNQUFNQSxNQUFNLEdBQUdDLFFBQU8sQ0FBQ0MsWUFBUixDQUFxQjtBQUNoQ0MsRUFBQUEsS0FBSyxFQUFFLE1BRHlCO0FBRWhDQyxFQUFBQSxVQUFVLEVBQUUsQ0FDVixJQUFJSCxRQUFPLENBQUNHLFVBQVIsQ0FBbUJDLE9BQXZCLEVBRFUsQ0FGb0I7QUFLaENDLEVBQUFBLE1BQU0sRUFBRUwsUUFBTyxDQUFDSyxNQUFSLENBQWVDLE9BQWYsQ0FDSk4sUUFBTyxDQUFDSyxNQUFSLENBQWUsQ0FBQ0UsSUFBRCxFQUFPQyxJQUFQLEtBQWdCQyxNQUFNLENBQUNDLE1BQVAsQ0FBY0gsSUFBZCxFQUFvQjtBQUFDSSxJQUFBQSxNQUFNLEVBQUVDO0FBQVQsR0FBcEIsQ0FB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QU4sRUFBV0MsSUFBWCxDQUFmO0FBQ0gsQ0FORCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBuZXdyZWxpYyBmcm9tICduZXdyZWxpYydcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgbXVsdGVyIGZyb20gJ211bHRlcidcbmltcG9ydCB1cmwgZnJvbSAndXJsJ1xuaW1wb3J0IHdpbnN0b24gZnJvbSAnd2luc3RvbidcbmltcG9ydCBuZXdyZWxpY0Zvcm1hdHRlciBmcm9tICdAbmV3cmVsaWMvd2luc3Rvbi1lbnJpY2hlcidcblxuY29uc3QgbG9nZ2VyID0gd2luc3Rvbi5jcmVhdGVMb2dnZXIoe1xuICAgIGxldmVsOiAnaW5mbycsXG4gICAgdHJhbnNwb3J0czogW1xuICAgICAgbmV3IHdpbnN0b24udHJhbnNwb3J0cy5Db25zb2xlKClcbiAgICBdLFxuICAgIGZvcm1hdDogd2luc3Rvbi5mb3JtYXQuY29tYmluZShcbiAgICAgICAgd2luc3Rvbi5mb3JtYXQoKGluZm8sIG9wdHMpID0+IE9iamVjdC5hc3NpZ24oaW5mbywge21vZHVsZTogX19maWxlbmFtZX0pKSgpLFxuICAgICAgICBuZXdyZWxpY0Zvcm1hdHRlcigpLFxuICAgICAgICB3aW5zdG9uLmZvcm1hdC5qc29uKClcbiAgICApXG4gIH0pO1xuXG5cbmltcG9ydCB7IGRlZmF1bHRCb3NzLCBnZXRSYW5kb21IYXQsIGdldFNwZWNpZmljSGF0LCByZXF1ZXN0TWFuaXB1bGF0ZSwgZ2V0SGF0RGF0YSB9IGZyb20gJy4vc3JjL2hlbHBlcnMuanMnXG5jb25zdCB1cGxvYWQgPSBtdWx0ZXIoKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbmNvbnN0IFBPUlQgPSAxMzM3XG5cbi8vIGZvciB0ZXN0aW5nIGxvY2FsbHk6IG5vZGUgLXIgZG90ZW52L2NvbmZpZyBpbmRleC5qcyAgXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODMwNTEyMC9kaWZmZXJlbmNlcy1iZXR3ZWVuLWV4cHJlc3Mtcm91dGVyLWFuZC1hcHAtZ2V0XG5cbmFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICBsb2dnZXIuaW5mbyhcInJlcXVlc3RlZFwiLCB7dXJsOiByZXEudXJsfSk7XG4gICAgbmV4dCgpO1xufSlcblxuYXBwLnVzZSgnLycsIHJvdXRlcilcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oYEhhdHMgU2VydmljZSBzdGFydGVkIG9uIHBvcnQgJHtQT1JUfWApO1xufSlcblxuYXN5bmMgZnVuY3Rpb24gbnVtSGF0cyhyZXEsIHJlcywgbmV4dCkge1xuXG4gICAgbmV4dCgpO1xufVxuXG5yb3V0ZXIuZ2V0KCcvbGlzdCcsIGFzeW5jKHJlcSwgcmVzKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oXCJHZXR0aW5nIGhhdHNcIilcbiAgICBsZXQgZGF0YSA9IGF3YWl0IGdldEhhdERhdGEoKVxuICAgIGxvZ2dlci5pbmZvKGBmZXRjaGVkICR7ZGF0YS5sZW5ndGh9IGhhdHNgKTtcbiBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ2hhdExpc3RTaXplJywgZGF0YS5sZW5ndGgpO1xuICAgIHJlcy5zZW5kKGRhdGEpXG59KTtcblxuYXN5bmMgZnVuY3Rpb24gYXBwbHlIYXRzKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgbGV0IG51bUhhdHMgPSAxO1xuICAgIGlmIChyZXEucXVlcnkubnVtYmVyICE9IHVuZGVmaW5lZCkge1xuICAgICAgICBudW1IYXRzID0gcmVxLnF1ZXJ5Lm51bWJlciBcbiAgICB9XG4gICAgXG4gICAgbGV0IGhhdCA9IG51bGw7XG4gICAgaWYgKHJlcS5xdWVyeS5zdHlsZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdyYW5kb20nLCB0cnVlKTtcbiAgICAgICAgaGF0ID0gYXdhaXQgZ2V0UmFuZG9tSGF0KClcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ3JhbmRvbScsIGZhbHNlKTtcbiAgICAgICAgaGF0ID0gYXdhaXQgZ2V0U3BlY2lmaWNIYXQocmVxLnF1ZXJ5LnN0eWxlKTtcbiAgICB9ICAgIFxuICAgIGlmIChoYXQgPT0gbnVsbCkge1xuICAgICAgICBsb2dnZXIuaW5mbyhgQ291ZGxuJ3QgZmluZCBoYXQgc3R5bGUgJHtyZXEucXVlcnkuc3R5bGV9YClcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGlzIGhhdCBzdHlsZSBkb2VzIG5vdCBleGlzdCEgSWYgeW91IHdhbnQgdGhpcyBzdHlsZSAtIHRyeSBzdWJtaXR0aW5nIGl0J1xuICAgICAgICAgfSk7ICAgICAgICAgICAgIFxuICAgIH1cbiAgICBsb2dnZXIuaW5mbyhgR290IGhhdCAke3JlcS5xdWVyeS5zdHlsZX1gKTtcbiAgICBsZXQgYjY0UmVzdWx0ID0gYXdhaXQgcmVxdWVzdE1hbmlwdWxhdGUocmVxLmZhY2UsIGhhdCwgbnVtSGF0cylcbiAgICByZXMuc2VuZChiNjRSZXN1bHQpXG59XG5cbnJvdXRlci5nZXQoJy9oYXRtZScsIGFzeW5jKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgbGV0IHFzID0gdXJsLnBhcnNlKHJlcS51cmwpLnF1ZXJ5O1xuICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncXMnLCBxcyk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdjdXN0b21GYWNlJywgZmFsc2UpO1xuICAgIHJlcS5mYWNlID0gYXdhaXQgZGVmYXVsdEJvc3MoKVxuICAgIGF3YWl0IGFwcGx5SGF0cyhyZXEsIHJlcywgbmV4dCk7XG59KTtcblxucm91dGVyLnBvc3QoJy9oYXRtZScsIHVwbG9hZC5hbnkoKSwgYXN5bmMocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBsZXQgcXMgPSB1cmwucGFyc2UocmVxLnVybCkucXVlcnk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdxcycsIHFzKTtcbiAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ2N1c3RvbUZhY2UnLCB0cnVlKTtcbiAgICByZXEuZmFjZSA9IHJlcS5maWxlc1swXS5idWZmZXJcbiAgICBhd2FpdCBhcHBseUhhdHMocmVxLCByZXMsIG5leHQpO1xufSk7ICJdfQ==