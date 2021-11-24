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
  exitOnError: false,
  transports: [new _winston.transports.Console({
    handleExceptions: true,
    handleRejections: true
  })],
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIndpbnN0b24iLCJjcmVhdGVMb2dnZXIiLCJsZXZlbCIsImV4aXRPbkVycm9yIiwidHJhbnNwb3J0cyIsIkNvbnNvbGUiLCJoYW5kbGVFeGNlcHRpb25zIiwiaGFuZGxlUmVqZWN0aW9ucyIsImZvcm1hdCIsImNvbWJpbmUiLCJpbmZvIiwib3B0cyIsIk9iamVjdCIsImFzc2lnbiIsIm1vZHVsZSIsIl9fZmlsZW5hbWUiLCJuZXdyZWxpY0Zvcm1hdHRlciIsImpzb24iLCJ1cGxvYWQiLCJtdWx0ZXIiLCJhcHAiLCJleHByZXNzIiwicm91dGVyIiwiUm91dGVyIiwiUE9SVCIsInVzZSIsInJlcSIsInJlcyIsIm5leHQiLCJ1cmwiLCJsaXN0ZW4iLCJudW1IYXRzIiwiZ2V0IiwibGlzdCIsImRhdGEiLCJsZW5ndGgiLCJuZXdyZWxpYyIsImFkZEN1c3RvbUF0dHJpYnV0ZSIsInNlbmQiLCJhcHBseUhhdHMiLCJxdWVyeSIsIm51bWJlciIsInVuZGVmaW5lZCIsImhhdCIsInN0eWxlIiwic3RhdHVzIiwibWVzc2FnZSIsImI2NFJlc3VsdCIsImZhY2UiLCJoYXRtZUdldCIsInFzIiwicGFyc2UiLCJwb3N0IiwiYW55IiwiaGF0bWVQb3N0IiwiZmlsZXMiLCJidWZmZXIiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBbUJBOztBQWpCQSxNQUFNQSxNQUFNLEdBQUdDLFFBQU8sQ0FBQ0MsWUFBUixDQUFxQjtBQUNoQ0MsRUFBQUEsS0FBSyxFQUFFLE1BRHlCO0FBRWhDQyxFQUFBQSxXQUFXLEVBQUUsS0FGbUI7QUFHaENDLEVBQUFBLFVBQVUsRUFBRSxDQUNWLElBQUlKLFFBQU8sQ0FBQ0ksVUFBUixDQUFtQkMsT0FBdkIsQ0FBK0I7QUFDN0JDLElBQUFBLGdCQUFnQixFQUFFLElBRFc7QUFFN0JDLElBQUFBLGdCQUFnQixFQUFFO0FBRlcsR0FBL0IsQ0FEVSxDQUhvQjtBQVNoQ0MsRUFBQUEsTUFBTSxFQUFFUixRQUFPLENBQUNRLE1BQVIsQ0FBZUMsT0FBZixDQUNKVCxRQUFPLENBQUNRLE1BQVIsQ0FBZSxDQUFDRSxJQUFELEVBQU9DLElBQVAsS0FBZ0JDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjSCxJQUFkLEVBQW9CO0FBQUNJLElBQUFBLE1BQU0sRUFBRUM7QUFBVCxHQUFwQixDQUEvQixHQURJLEVBRUpDLGdCQUFpQixFQUZiLEVBR0poQixRQUFPLENBQUNRLE1BQVIsQ0FBZVMsSUFBZixFQUhJO0FBVHdCLENBQXJCLENBQWY7O0FBa0JBLE1BQU1DLE1BQU0sR0FBR0MsT0FBTSxFQUFyQjs7QUFDQSxNQUFNQyxHQUFHLEdBQUdDLFFBQU8sRUFBbkI7O0FBQ0EsSUFBSUMsTUFBTSxHQUFHRCxRQUFPLENBQUNFLE1BQVIsRUFBYjs7QUFDQSxNQUFNQyxJQUFJLEdBQUcsSUFBYixDLENBRUE7QUFDQTs7QUFFQUosR0FBRyxDQUFDSyxHQUFKLENBQVEsVUFBU0MsR0FBVCxFQUFjQyxHQUFkLEVBQW1CQyxJQUFuQixFQUF5QjtBQUM3QjdCLEVBQUFBLE1BQU0sQ0FBQ1csSUFBUCxDQUFhLGNBQWFnQixHQUFHLENBQUNHLEdBQUksRUFBbEM7QUFDQUQsRUFBQUEsSUFBSTtBQUNQLENBSEQ7QUFLQVIsR0FBRyxDQUFDSyxHQUFKLENBQVEsR0FBUixFQUFhSCxNQUFiO0FBRUFGLEdBQUcsQ0FBQ1UsTUFBSixDQUFXTixJQUFYLEVBQWlCLE1BQU07QUFDbkJ6QixFQUFBQSxNQUFNLENBQUNXLElBQVAsQ0FBYSxnQ0FBK0JjLElBQUssRUFBakQ7QUFDSCxDQUZEOztBQUlBLGVBQWVPLE9BQWYsQ0FBdUJMLEdBQXZCLEVBQTRCQyxHQUE1QixFQUFpQ0MsSUFBakMsRUFBdUM7QUFFbkNBLEVBQUFBLElBQUk7QUFDUDs7QUFFRE4sTUFBTSxDQUFDVSxHQUFQLENBQVcsT0FBWCxFQUFvQixlQUFlQyxJQUFmLENBQW9CUCxHQUFwQixFQUF5QkMsR0FBekIsRUFBOEI7QUFDOUM1QixFQUFBQSxNQUFNLENBQUNXLElBQVAsQ0FBWSxjQUFaO0FBQ0EsTUFBSXdCLElBQUksR0FBRyxNQUFNLDBCQUFqQjtBQUNBbkMsRUFBQUEsTUFBTSxDQUFDVyxJQUFQLENBQWEsV0FBVXdCLElBQUksQ0FBQ0MsTUFBTyxPQUFuQzs7QUFDSEMsRUFBQUEsU0FBUSxDQUFDQyxrQkFBVCxDQUE0QixhQUE1QixFQUEyQ0gsSUFBSSxDQUFDQyxNQUFoRDs7QUFDR1IsRUFBQUEsR0FBRyxDQUFDVyxJQUFKLENBQVNKLElBQVQ7QUFDSCxDQU5EOztBQVFBLGVBQWVLLFNBQWYsQ0FBeUJiLEdBQXpCLEVBQThCQyxHQUE5QixFQUFtQ0MsSUFBbkMsRUFBeUM7QUFDckMsTUFBSUcsT0FBTyxHQUFHLENBQWQ7O0FBQ0EsTUFBSUwsR0FBRyxDQUFDYyxLQUFKLENBQVVDLE1BQVYsSUFBb0JDLFNBQXhCLEVBQW1DO0FBQy9CWCxJQUFBQSxPQUFPLEdBQUdMLEdBQUcsQ0FBQ2MsS0FBSixDQUFVQyxNQUFwQjtBQUNIOztBQUVELE1BQUlFLEdBQUcsR0FBRyxJQUFWOztBQUNBLE1BQUlqQixHQUFHLENBQUNjLEtBQUosQ0FBVUksS0FBVixJQUFtQkYsU0FBdkIsRUFBa0M7QUFDOUJOLElBQUFBLFNBQVEsQ0FBQ0Msa0JBQVQsQ0FBNEIsUUFBNUIsRUFBc0MsSUFBdEM7O0FBQ0FNLElBQUFBLEdBQUcsR0FBRyxNQUFNLDRCQUFaO0FBQ0gsR0FIRCxNQUdPO0FBQ0hQLElBQUFBLFNBQVEsQ0FBQ0Msa0JBQVQsQ0FBNEIsUUFBNUIsRUFBc0MsS0FBdEM7O0FBQ0FNLElBQUFBLEdBQUcsR0FBRyxNQUFNLDZCQUFlakIsR0FBRyxDQUFDYyxLQUFKLENBQVVJLEtBQXpCLENBQVo7QUFDSDs7QUFDRCxNQUFJRCxHQUFHLElBQUksSUFBWCxFQUFpQjtBQUNiNUMsSUFBQUEsTUFBTSxDQUFDVyxJQUFQLENBQWEsYUFBWWdCLEdBQUcsQ0FBQ2MsS0FBSixDQUFVSSxLQUFNLGlCQUF6QztBQUNBLFdBQU9qQixHQUFHLENBQUNrQixNQUFKLENBQVcsR0FBWCxFQUFnQlAsSUFBaEIsQ0FBcUI7QUFDeEJRLE1BQUFBLE9BQU8sRUFBRTtBQURlLEtBQXJCLENBQVA7QUFHSDs7QUFDRC9DLEVBQUFBLE1BQU0sQ0FBQ1csSUFBUCxDQUFhLGtCQUFpQnFCLE9BQVEsSUFBR0wsR0FBRyxDQUFDYyxLQUFKLENBQVVJLEtBQU0sa0JBQXpEO0FBRUEsTUFBSUcsU0FBUyxHQUFHLE1BQU0sZ0NBQWtCckIsR0FBRyxDQUFDc0IsSUFBdEIsRUFBNEJMLEdBQTVCLEVBQWlDWixPQUFqQyxDQUF0QjtBQUNBSixFQUFBQSxHQUFHLENBQUNXLElBQUosQ0FBU1MsU0FBVDtBQUNIOztBQUVEekIsTUFBTSxDQUFDVSxHQUFQLENBQVcsUUFBWCxFQUFxQixlQUFlaUIsUUFBZixDQUF3QnZCLEdBQXhCLEVBQTZCQyxHQUE3QixFQUFrQ0MsSUFBbEMsRUFBd0M7QUFDekQsTUFBSXNCLEVBQUUsR0FBR3JCLElBQUcsQ0FBQ3NCLEtBQUosQ0FBVXpCLEdBQUcsQ0FBQ0csR0FBZCxFQUFtQlcsS0FBNUI7O0FBQ0FKLEVBQUFBLFNBQVEsQ0FBQ0Msa0JBQVQsQ0FBNEIsSUFBNUIsRUFBa0NhLEVBQWxDOztBQUNBZCxFQUFBQSxTQUFRLENBQUNDLGtCQUFULENBQTRCLFlBQTVCLEVBQTBDLEtBQTFDOztBQUNBWCxFQUFBQSxHQUFHLENBQUNzQixJQUFKLEdBQVcsTUFBTSwyQkFBakI7QUFDQSxRQUFNVCxTQUFTLENBQUNiLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLENBQWY7QUFDSCxDQU5EO0FBUUFOLE1BQU0sQ0FBQzhCLElBQVAsQ0FBWSxRQUFaLEVBQXNCbEMsTUFBTSxDQUFDbUMsR0FBUCxFQUF0QixFQUFvQyxlQUFlQyxTQUFmLENBQXlCNUIsR0FBekIsRUFBOEJDLEdBQTlCLEVBQW1DQyxJQUFuQyxFQUF5QztBQUN6RSxNQUFJc0IsRUFBRSxHQUFHckIsSUFBRyxDQUFDc0IsS0FBSixDQUFVekIsR0FBRyxDQUFDRyxHQUFkLEVBQW1CVyxLQUE1Qjs7QUFDQUosRUFBQUEsU0FBUSxDQUFDQyxrQkFBVCxDQUE0QixJQUE1QixFQUFrQ2EsRUFBbEM7O0FBQ0FkLEVBQUFBLFNBQVEsQ0FBQ0Msa0JBQVQsQ0FBNEIsWUFBNUIsRUFBMEMsSUFBMUM7O0FBQ0FYLEVBQUFBLEdBQUcsQ0FBQ3NCLElBQUosR0FBV3RCLEdBQUcsQ0FBQzZCLEtBQUosQ0FBVSxDQUFWLEVBQWFDLE1BQXhCO0FBQ0EsUUFBTWpCLFNBQVMsQ0FBQ2IsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVgsQ0FBZjtBQUNILENBTkQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbmV3cmVsaWMgZnJvbSAnbmV3cmVsaWMnXG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJ1xuaW1wb3J0IGV4cHJlc3NBc3luY0Vycm9ycyBmcm9tICdleHByZXNzLWFzeW5jLWVycm9ycydcbmltcG9ydCBtdWx0ZXIgZnJvbSAnbXVsdGVyJ1xuaW1wb3J0IHVybCBmcm9tICd1cmwnXG5pbXBvcnQgd2luc3RvbiBmcm9tICd3aW5zdG9uJ1xuaW1wb3J0IG5ld3JlbGljRm9ybWF0dGVyIGZyb20gJ0BuZXdyZWxpYy93aW5zdG9uLWVucmljaGVyJ1xuXG5jb25zdCBsb2dnZXIgPSB3aW5zdG9uLmNyZWF0ZUxvZ2dlcih7XG4gICAgbGV2ZWw6ICdpbmZvJyxcbiAgICBleGl0T25FcnJvcjogZmFsc2UsXG4gICAgdHJhbnNwb3J0czogW1xuICAgICAgbmV3IHdpbnN0b24udHJhbnNwb3J0cy5Db25zb2xlKHtcbiAgICAgICAgaGFuZGxlRXhjZXB0aW9uczogdHJ1ZSxcbiAgICAgICAgaGFuZGxlUmVqZWN0aW9uczogdHJ1ZVxuICAgICAgfSlcbiAgICBdLFxuICAgIGZvcm1hdDogd2luc3Rvbi5mb3JtYXQuY29tYmluZShcbiAgICAgICAgd2luc3Rvbi5mb3JtYXQoKGluZm8sIG9wdHMpID0+IE9iamVjdC5hc3NpZ24oaW5mbywge21vZHVsZTogX19maWxlbmFtZX0pKSgpLFxuICAgICAgICBuZXdyZWxpY0Zvcm1hdHRlcigpLFxuICAgICAgICB3aW5zdG9uLmZvcm1hdC5qc29uKClcbiAgICApXG4gIH0pO1xuXG5cbmltcG9ydCB7IGRlZmF1bHRCb3NzLCBnZXRSYW5kb21IYXQsIGdldFNwZWNpZmljSGF0LCByZXF1ZXN0TWFuaXB1bGF0ZSwgZ2V0SGF0RGF0YSB9IGZyb20gJy4vc3JjL2hlbHBlcnMuanMnXG5jb25zdCB1cGxvYWQgPSBtdWx0ZXIoKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbmNvbnN0IFBPUlQgPSAxMzM3XG5cbi8vIGZvciB0ZXN0aW5nIGxvY2FsbHk6IG5vZGUgLXIgZG90ZW52L2NvbmZpZyBpbmRleC5qcyAgXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODMwNTEyMC9kaWZmZXJlbmNlcy1iZXR3ZWVuLWV4cHJlc3Mtcm91dGVyLWFuZC1hcHAtZ2V0XG5cbmFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICBsb2dnZXIuaW5mbyhgcmVxdWVzdGVkOiAke3JlcS51cmx9YCk7XG4gICAgbmV4dCgpO1xufSlcblxuYXBwLnVzZSgnLycsIHJvdXRlcilcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gICAgbG9nZ2VyLmluZm8oYEhhdHMgU2VydmljZSBzdGFydGVkIG9uIHBvcnQgJHtQT1JUfWApO1xufSlcblxuYXN5bmMgZnVuY3Rpb24gbnVtSGF0cyhyZXEsIHJlcywgbmV4dCkge1xuXG4gICAgbmV4dCgpO1xufVxuXG5yb3V0ZXIuZ2V0KCcvbGlzdCcsIGFzeW5jIGZ1bmN0aW9uIGxpc3QocmVxLCByZXMpIHtcbiAgICBsb2dnZXIuaW5mbyhcIkdldHRpbmcgaGF0c1wiKVxuICAgIGxldCBkYXRhID0gYXdhaXQgZ2V0SGF0RGF0YSgpXG4gICAgbG9nZ2VyLmluZm8oYGZldGNoZWQgJHtkYXRhLmxlbmd0aH0gaGF0c2ApO1xuIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgnaGF0TGlzdFNpemUnLCBkYXRhLmxlbmd0aCk7XG4gICAgcmVzLnNlbmQoZGF0YSlcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBhcHBseUhhdHMocmVxLCByZXMsIG5leHQpIHtcbiAgICBsZXQgbnVtSGF0cyA9IDE7XG4gICAgaWYgKHJlcS5xdWVyeS5udW1iZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG51bUhhdHMgPSByZXEucXVlcnkubnVtYmVyIFxuICAgIH1cbiAgICBcbiAgICBsZXQgaGF0ID0gbnVsbDtcbiAgICBpZiAocmVxLnF1ZXJ5LnN0eWxlID09IHVuZGVmaW5lZCkge1xuICAgICAgICBuZXdyZWxpYy5hZGRDdXN0b21BdHRyaWJ1dGUoJ3JhbmRvbScsIHRydWUpO1xuICAgICAgICBoYXQgPSBhd2FpdCBnZXRSYW5kb21IYXQoKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncmFuZG9tJywgZmFsc2UpO1xuICAgICAgICBoYXQgPSBhd2FpdCBnZXRTcGVjaWZpY0hhdChyZXEucXVlcnkuc3R5bGUpO1xuICAgIH0gICAgXG4gICAgaWYgKGhhdCA9PSBudWxsKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKGBIYXQgc3R5bGUgJHtyZXEucXVlcnkuc3R5bGV9IGRvZXMgbm90IGV4aXN0YClcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5zZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGlzIGhhdCBzdHlsZSBkb2VzIG5vdCBleGlzdCEgSWYgeW91IHdhbnQgdGhpcyBzdHlsZSAtIHRyeSBzdWJtaXR0aW5nIGl0J1xuICAgICAgICAgfSk7ICAgICAgICAgICAgIFxuICAgIH1cbiAgICBsb2dnZXIuaW5mbyhgR29pbmcgdG8gYXBwbHkgJHtudW1IYXRzfSAke3JlcS5xdWVyeS5zdHlsZX0gaGF0KHMpIHRvIGltYWdlYCk7XG5cbiAgICBsZXQgYjY0UmVzdWx0ID0gYXdhaXQgcmVxdWVzdE1hbmlwdWxhdGUocmVxLmZhY2UsIGhhdCwgbnVtSGF0cylcbiAgICByZXMuc2VuZChiNjRSZXN1bHQpXG59XG5cbnJvdXRlci5nZXQoJy9oYXRtZScsIGFzeW5jIGZ1bmN0aW9uIGhhdG1lR2V0KHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgbGV0IHFzID0gdXJsLnBhcnNlKHJlcS51cmwpLnF1ZXJ5O1xuICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncXMnLCBxcyk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdjdXN0b21GYWNlJywgZmFsc2UpO1xuICAgIHJlcS5mYWNlID0gYXdhaXQgZGVmYXVsdEJvc3MoKVxuICAgIGF3YWl0IGFwcGx5SGF0cyhyZXEsIHJlcywgbmV4dCk7XG59KTtcblxucm91dGVyLnBvc3QoJy9oYXRtZScsIHVwbG9hZC5hbnkoKSwgYXN5bmMgZnVuY3Rpb24gaGF0bWVQb3N0KHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgbGV0IHFzID0gdXJsLnBhcnNlKHJlcS51cmwpLnF1ZXJ5O1xuICAgIG5ld3JlbGljLmFkZEN1c3RvbUF0dHJpYnV0ZSgncXMnLCBxcyk7XG4gICAgbmV3cmVsaWMuYWRkQ3VzdG9tQXR0cmlidXRlKCdjdXN0b21GYWNlJywgdHJ1ZSk7XG4gICAgcmVxLmZhY2UgPSByZXEuZmlsZXNbMF0uYnVmZmVyXG4gICAgYXdhaXQgYXBwbHlIYXRzKHJlcSwgcmVzLCBuZXh0KTtcbn0pOyAiXX0=