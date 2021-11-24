"use strict";

require('newrelic');

var express = require('express');

var app = express();
var router = express.Router();

var multer = require('multer');

const upload = multer();

var fetch = require('node-fetch');

var dirname = require('path').dirname;

var url = require('url');

var fileURLToPath = url.fileURLToPath;

var FormData = require('form-data');

const winston = require('winston');

const newrelicFormatter = require('@newrelic/winston-enricher');

const logger = winston.createLogger({
  level: 'info',
  exitOnError: false,
  transports: [new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true
  })],
  format: winston.format.combine(winston.format((info, opts) => Object.assign(info, {
    module: __filename
  }))(), newrelicFormatter(), winston.format.json())
}); // express is what helps us "route" the html pages. Usually on websites, you don't see /index.html. 
// Why? Because they use routing! When you navigate to /about, the web server with THIS code returns the HTML about.html page.

const dn = dirname(__filename);
app.set('view engine', 'ejs');
app.set('views', dn); // this is just setting up configuration for where all the files are.

const path = dn; //__dirname is the current directory we are in. Remember that every website literally has a computer running behind it!

app.use('/', router);
app.use('/assets', express.static(path + '/assets')); // this is telling the website WHERE all of our "asset" files are. Asset files include CSS for styling, JS for Bootstrap to make it pretty, and images.

router.get('/', function (req, res) {
  res.sendFile(path + '/pages/index.html');
}); // The logic here: when someone navigates to www.cybercatamounts.herokuapp.com, the website will return the content on the "index.html" page.
// Why is it router.get? Because when you enter something in your browser, you are making a GET request.

router.get('/photo', function photo(req, res) {
  res.sendFile(path + '/pages/photo.html');
});
router.get('/admin', function admin(req, res) {
  res.sendFile(path + '/pages/admin.html');
});
router.get('/api/hat', upload.any(), async function hatGet(req, res) {
  let baseUrl = new url.URL("http://gateway-service:80/hatme");
  const number = req.query.number ? req.query.number : "1"; //logger.info(req.body);

  let type = req.headers.type; //logger.info(type);

  if (type) {
    baseUrl.searchParams.append('style', type);
  }

  baseUrl.searchParams.append('number', number);
  logger.info(`GET ${baseUrl}`);
  let resp = await fetch(baseUrl.toString());
  let data = await resp.json(); //logger.info(data);

  res.send(data);
});
router.post('/api/hat', upload.any(), async function hatPost(req, res) {
  logger.info("posting custom photo");
  let baseUrl = new url.URL("http://gateway-service:80/hatme");
  const number = req.query.number ? req.query.number : "1";
  let file = req.files[0].buffer;
  let formData = await createForm(file);
  const formHeaders = await formData.getHeaders();
  let type = req.headers.type; //logger.info(file);

  let options = {
    method: "POST",
    body: formData,
    headers: { ...formHeaders
    }
  };

  if (type) {
    baseUrl.searchParams.append('style', type);
  }

  baseUrl.searchParams.append('number', number);
  logger.info(`POST ${baseUrl}`);
  let resp = await fetch(baseUrl, options);
  let data = await resp.json(); //logger.info(data);

  res.send(data);
});

async function createForm(file) {
  let formData = new FormData();
  formData.append('file', file, {
    filename: "file",
    data: file
  });
  return formData;
}

router.get('/api/list', async function list(req, res) {
  const baseUrl = "http://gateway-service:80/api/hats";
  logger.info(`GET ${baseUrl}`);
  const resp = await fetch(baseUrl);
  const data = await resp.json();
  res.send(data);
});
router.get('/api/admin', async function admin(req, res) {
  let baseUrl = "http://gateway-service:80/admin";
  logger.info(`GET ${baseUrl}`);
  let resp = await fetch(baseUrl);
  let data = await resp.json();
  res.send(data);
});
router.get('/api/admin/moderate', async function moderate(req, res) {
  let id = req.query.id;
  let approve = req.query.approve;
  let baseUrl = `http://gateway-service:80/moderate?id=${id}&approve=${approve}`;
  logger.info(`GET ${baseUrl}`);
  let resp = await fetch(baseUrl);
  let data = await resp.json(); //logger.info(data);

  res.send(data);
});
app.listen(process.env.PORT || 3000, () => logger.info("Server is running..."));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJleHByZXNzIiwiYXBwIiwicm91dGVyIiwiUm91dGVyIiwibXVsdGVyIiwidXBsb2FkIiwiZmV0Y2giLCJkaXJuYW1lIiwidXJsIiwiZmlsZVVSTFRvUGF0aCIsIkZvcm1EYXRhIiwid2luc3RvbiIsIm5ld3JlbGljRm9ybWF0dGVyIiwibG9nZ2VyIiwiY3JlYXRlTG9nZ2VyIiwibGV2ZWwiLCJleGl0T25FcnJvciIsInRyYW5zcG9ydHMiLCJDb25zb2xlIiwiaGFuZGxlRXhjZXB0aW9ucyIsImhhbmRsZVJlamVjdGlvbnMiLCJmb3JtYXQiLCJjb21iaW5lIiwiaW5mbyIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJtb2R1bGUiLCJfX2ZpbGVuYW1lIiwianNvbiIsImRuIiwic2V0IiwicGF0aCIsInVzZSIsInN0YXRpYyIsImdldCIsInJlcSIsInJlcyIsInNlbmRGaWxlIiwicGhvdG8iLCJhZG1pbiIsImFueSIsImhhdEdldCIsImJhc2VVcmwiLCJVUkwiLCJudW1iZXIiLCJxdWVyeSIsInR5cGUiLCJoZWFkZXJzIiwic2VhcmNoUGFyYW1zIiwiYXBwZW5kIiwicmVzcCIsInRvU3RyaW5nIiwiZGF0YSIsInNlbmQiLCJwb3N0IiwiaGF0UG9zdCIsImZpbGUiLCJmaWxlcyIsImJ1ZmZlciIsImZvcm1EYXRhIiwiY3JlYXRlRm9ybSIsImZvcm1IZWFkZXJzIiwiZ2V0SGVhZGVycyIsIm9wdGlvbnMiLCJtZXRob2QiLCJib2R5IiwiZmlsZW5hbWUiLCJsaXN0IiwibW9kZXJhdGUiLCJpZCIsImFwcHJvdmUiLCJsaXN0ZW4iLCJwcm9jZXNzIiwiZW52IiwiUE9SVCJdLCJtYXBwaW5ncyI6Ijs7QUFBQUEsT0FBTyxDQUFDLFVBQUQsQ0FBUDs7QUFDQSxJQUFJQyxPQUFPLEdBQUdELE9BQU8sQ0FBQyxTQUFELENBQXJCOztBQUNBLElBQUlFLEdBQUcsR0FBR0QsT0FBTyxFQUFqQjtBQUNBLElBQUlF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SUMsT0FBTyxHQUFHbkMsR0FBRyxDQUFDVSxLQUFKLENBQVV5QixPQUF4QjtBQUVBLE1BQUk1QixPQUFPLEdBQUkseUNBQXdDMkIsRUFBRyxZQUFXQyxPQUFRLEVBQTdFO0FBRUExRCxFQUFBQSxNQUFNLENBQUNVLElBQVAsQ0FBYSxPQUFNb0IsT0FBUSxFQUEzQjtBQUNBLE1BQUlRLElBQUksR0FBRyxNQUFNN0MsS0FBSyxDQUFDcUMsT0FBRCxDQUF0QjtBQUNBLE1BQUlVLElBQUksR0FBRyxNQUFNRixJQUFJLENBQUN0QixJQUFMLEVBQWpCLENBUmdFLENBU2hFOztBQUNBUSxFQUFBQSxHQUFHLENBQUNpQixJQUFKLENBQVNELElBQVQ7QUFFSCxDQVpEO0FBY0FwRCxHQUFHLENBQUN1RSxNQUFKLENBQVdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxJQUFaLElBQW9CLElBQS9CLEVBQ0ksTUFBTTlELE1BQU0sQ0FBQ1UsSUFBUCxDQUFZLHNCQUFaLENBRFYiLCJzb3VyY2VzQ29udGVudCI6WyJyZXF1aXJlKCduZXdyZWxpYycpXG52YXIgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbnZhciBhcHAgPSBleHByZXNzKCk7XG52YXIgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcbnZhciBtdWx0ZXIgPSByZXF1aXJlKCdtdWx0ZXInKTtcbmNvbnN0IHVwbG9hZCA9IG11bHRlcigpO1xudmFyIGZldGNoID0gcmVxdWlyZSgnbm9kZS1mZXRjaCcpO1xudmFyIGRpcm5hbWUgPSByZXF1aXJlKCdwYXRoJykuZGlybmFtZTtcbnZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbnZhciBmaWxlVVJMVG9QYXRoID0gdXJsLmZpbGVVUkxUb1BhdGg7XG52YXIgRm9ybURhdGEgPSByZXF1aXJlKCdmb3JtLWRhdGEnKVxuXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSgnd2luc3RvbicpO1xuY29uc3QgbmV3cmVsaWNGb3JtYXR0ZXIgPSByZXF1aXJlKCdAbmV3cmVsaWMvd2luc3Rvbi1lbnJpY2hlcicpO1xuXG5cbmNvbnN0IGxvZ2dlciA9IHdpbnN0b24uY3JlYXRlTG9nZ2VyKHtcbiAgICBsZXZlbDogJ2luZm8nLFxuICAgIGV4aXRPbkVycm9yOiBmYWxzZSxcbiAgICB0cmFuc3BvcnRzOiBbXG4gICAgICBuZXcgd2luc3Rvbi50cmFuc3BvcnRzLkNvbnNvbGUoe1xuICAgICAgICBoYW5kbGVFeGNlcHRpb25zOiB0cnVlLFxuICAgICAgICBoYW5kbGVSZWplY3Rpb25zOiB0cnVlXG4gICAgICB9KVxuICAgIF0sXG4gICAgZm9ybWF0OiB3aW5zdG9uLmZvcm1hdC5jb21iaW5lKFxuICAgICAgICB3aW5zdG9uLmZvcm1hdCgoaW5mbywgb3B0cykgPT4gT2JqZWN0LmFzc2lnbihpbmZvLCB7bW9kdWxlOiBfX2ZpbGVuYW1lfSkpKCksXG4gICAgICAgIG5ld3JlbGljRm9ybWF0dGVyKCksXG4gICAgICAgIHdpbnN0b24uZm9ybWF0Lmpzb24oKVxuICAgIClcbiAgfSk7XG5cbi8vIGV4cHJlc3MgaXMgd2hhdCBoZWxwcyB1cyBcInJvdXRlXCIgdGhlIGh0bWwgcGFnZXMuIFVzdWFsbHkgb24gd2Vic2l0ZXMsIHlvdSBkb24ndCBzZWUgL2luZGV4Lmh0bWwuIFxuLy8gV2h5PyBCZWNhdXNlIHRoZXkgdXNlIHJvdXRpbmchIFdoZW4geW91IG5hdmlnYXRlIHRvIC9hYm91dCwgdGhlIHdlYiBzZXJ2ZXIgd2l0aCBUSElTIGNvZGUgcmV0dXJucyB0aGUgSFRNTCBhYm91dC5odG1sIHBhZ2UuXG5cbmNvbnN0IGRuID0gZGlybmFtZShfX2ZpbGVuYW1lKTtcbmFwcC5zZXQoJ3ZpZXcgZW5naW5lJywgJ2VqcycpO1xuYXBwLnNldCgndmlld3MnLCBkbik7XG5cbi8vIHRoaXMgaXMganVzdCBzZXR0aW5nIHVwIGNvbmZpZ3VyYXRpb24gZm9yIHdoZXJlIGFsbCB0aGUgZmlsZXMgYXJlLlxuY29uc3QgcGF0aCA9IGRuO1xuXG4vL19fZGlybmFtZSBpcyB0aGUgY3VycmVudCBkaXJlY3Rvcnkgd2UgYXJlIGluLiBSZW1lbWJlciB0aGF0IGV2ZXJ5IHdlYnNpdGUgbGl0ZXJhbGx5IGhhcyBhIGNvbXB1dGVyIHJ1bm5pbmcgYmVoaW5kIGl0IVxuYXBwLnVzZSgnLycsIHJvdXRlcik7XG5hcHAudXNlKCcvYXNzZXRzJywgZXhwcmVzcy5zdGF0aWMocGF0aCArICcvYXNzZXRzJykpXG5cbi8vIHRoaXMgaXMgdGVsbGluZyB0aGUgd2Vic2l0ZSBXSEVSRSBhbGwgb2Ygb3VyIFwiYXNzZXRcIiBmaWxlcyBhcmUuIEFzc2V0IGZpbGVzIGluY2x1ZGUgQ1NTIGZvciBzdHlsaW5nLCBKUyBmb3IgQm9vdHN0cmFwIHRvIG1ha2UgaXQgcHJldHR5LCBhbmQgaW1hZ2VzLlxuXG5yb3V0ZXIuZ2V0KCcvJywgZnVuY3Rpb24gKHJlcSwgcmVzKSB7XG4gICAgcmVzLnNlbmRGaWxlKHBhdGggKyAnL3BhZ2VzL2luZGV4Lmh0bWwnKTtcbn0pO1xuXG4vLyBUaGUgbG9naWMgaGVyZTogd2hlbiBzb21lb25lIG5hdmlnYXRlcyB0byB3d3cuY3liZXJjYXRhbW91bnRzLmhlcm9rdWFwcC5jb20sIHRoZSB3ZWJzaXRlIHdpbGwgcmV0dXJuIHRoZSBjb250ZW50IG9uIHRoZSBcImluZGV4Lmh0bWxcIiBwYWdlLlxuLy8gV2h5IGlzIGl0IHJvdXRlci5nZXQ/IEJlY2F1c2Ugd2hlbiB5b3UgZW50ZXIgc29tZXRoaW5nIGluIHlvdXIgYnJvd3NlciwgeW91IGFyZSBtYWtpbmcgYSBHRVQgcmVxdWVzdC5cblxucm91dGVyLmdldCgnL3Bob3RvJywgZnVuY3Rpb24gcGhvdG8ocmVxLCByZXMpIHtcbiAgICByZXMuc2VuZEZpbGUocGF0aCArICcvcGFnZXMvcGhvdG8uaHRtbCcpO1xufSk7XG5cbnJvdXRlci5nZXQoJy9hZG1pbicsIGZ1bmN0aW9uIGFkbWluKHJlcSwgcmVzKSB7XG4gICAgcmVzLnNlbmRGaWxlKHBhdGggKyAnL3BhZ2VzL2FkbWluLmh0bWwnKTtcbn0pO1xuXG5yb3V0ZXIuZ2V0KCcvYXBpL2hhdCcsIHVwbG9hZC5hbnkoKSwgYXN5bmMgZnVuY3Rpb24gaGF0R2V0KHJlcSwgcmVzKSB7XG4gICAgbGV0IGJhc2VVcmwgPSBuZXcgdXJsLlVSTChcImh0dHA6Ly9nYXRld2F5LXNlcnZpY2U6ODAvaGF0bWVcIik7XG4gICAgY29uc3QgbnVtYmVyID0gcmVxLnF1ZXJ5Lm51bWJlciA/IHJlcS5xdWVyeS5udW1iZXIgOiBcIjFcIjtcbiAgICAvL2xvZ2dlci5pbmZvKHJlcS5ib2R5KTtcbiAgICBsZXQgdHlwZSA9IHJlcS5oZWFkZXJzLnR5cGU7XG4gICAgLy9sb2dnZXIuaW5mbyh0eXBlKTtcblxuICAgIGlmICh0eXBlKSB7XG4gICAgICAgIGJhc2VVcmwuc2VhcmNoUGFyYW1zLmFwcGVuZCgnc3R5bGUnLCB0eXBlKTtcbiAgICB9XG5cbiAgICBiYXNlVXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ251bWJlcicsIG51bWJlcik7XG5cblxuICAgIGxvZ2dlci5pbmZvKGBHRVQgJHtiYXNlVXJsfWApO1xuICAgIGxldCByZXNwID0gYXdhaXQgZmV0Y2goYmFzZVVybC50b1N0cmluZygpKTtcbiAgICBsZXQgZGF0YSA9IGF3YWl0IHJlc3AuanNvbigpO1xuICAgIC8vbG9nZ2VyLmluZm8oZGF0YSk7XG4gICAgcmVzLnNlbmQoZGF0YSk7XG59KTtcblxucm91dGVyLnBvc3QoJy9hcGkvaGF0JywgdXBsb2FkLmFueSgpLCBhc3luYyBmdW5jdGlvbiBoYXRQb3N0KHJlcSwgcmVzKSB7XG4gICAgbG9nZ2VyLmluZm8oXCJwb3N0aW5nIGN1c3RvbSBwaG90b1wiKTtcbiAgICBsZXQgYmFzZVVybCA9IG5ldyB1cmwuVVJMKFwiaHR0cDovL2dhdGV3YXktc2VydmljZTo4MC9oYXRtZVwiKTtcbiAgICBjb25zdCBudW1iZXIgPSByZXEucXVlcnkubnVtYmVyID8gcmVxLnF1ZXJ5Lm51bWJlciA6IFwiMVwiO1xuXG4gICAgbGV0IGZpbGUgPSByZXEuZmlsZXNbMF0uYnVmZmVyO1xuXG4gICAgbGV0IGZvcm1EYXRhID0gYXdhaXQgY3JlYXRlRm9ybShmaWxlKTtcbiAgICBjb25zdCBmb3JtSGVhZGVycyA9IGF3YWl0IGZvcm1EYXRhLmdldEhlYWRlcnMoKTtcbiAgICBsZXQgdHlwZSA9IHJlcS5oZWFkZXJzLnR5cGU7XG4gICAgLy9sb2dnZXIuaW5mbyhmaWxlKTtcbiAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgYm9keTogZm9ybURhdGEsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC4uLmZvcm1IZWFkZXJzLFxuICAgICAgICB9LFxuICAgIH07XG5cbiAgICBpZiAodHlwZSkge1xuICAgICAgICBiYXNlVXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ3N0eWxlJywgdHlwZSk7XG4gICAgfVxuXG4gICAgYmFzZVVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdudW1iZXInLCBudW1iZXIpO1xuICAgIGxvZ2dlci5pbmZvKGBQT1NUICR7YmFzZVVybH1gKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IGZldGNoKGJhc2VVcmwsIG9wdGlvbnMpO1xuICAgIGxldCBkYXRhID0gYXdhaXQgcmVzcC5qc29uKCk7XG4gICAgLy9sb2dnZXIuaW5mbyhkYXRhKTtcbiAgICByZXMuc2VuZChkYXRhKTtcblxufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUZvcm0oZmlsZSkge1xuICAgIGxldCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpXG4gICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSwgeyBmaWxlbmFtZTogXCJmaWxlXCIsIGRhdGE6IGZpbGUgfSlcblxuICAgIHJldHVybiBmb3JtRGF0YVxufVxuXG5yb3V0ZXIuZ2V0KCcvYXBpL2xpc3QnLCBhc3luYyBmdW5jdGlvbiBsaXN0KHJlcSwgcmVzKSB7XG4gICAgY29uc3QgYmFzZVVybCA9IFwiaHR0cDovL2dhdGV3YXktc2VydmljZTo4MC9hcGkvaGF0c1wiO1xuXG4gICAgbG9nZ2VyLmluZm8oYEdFVCAke2Jhc2VVcmx9YCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKGJhc2VVcmwpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwLmpzb24oKTtcbiAgICByZXMuc2VuZChkYXRhKTtcbn0pO1xuXG5cbnJvdXRlci5nZXQoJy9hcGkvYWRtaW4nLCBhc3luYyBmdW5jdGlvbiBhZG1pbihyZXEsIHJlcykge1xuICAgIGxldCBiYXNlVXJsID0gXCJodHRwOi8vZ2F0ZXdheS1zZXJ2aWNlOjgwL2FkbWluXCJcbiAgICBsb2dnZXIuaW5mbyhgR0VUICR7YmFzZVVybH1gKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IGZldGNoKGJhc2VVcmwpO1xuICAgIGxldCBkYXRhID0gYXdhaXQgcmVzcC5qc29uKCk7XG4gICAgcmVzLnNlbmQoZGF0YSk7XG59KTtcblxucm91dGVyLmdldCgnL2FwaS9hZG1pbi9tb2RlcmF0ZScsIGFzeW5jIGZ1bmN0aW9uIG1vZGVyYXRlKHJlcSwgcmVzKSB7XG4gICAgbGV0IGlkID0gcmVxLnF1ZXJ5LmlkO1xuICAgIGxldCBhcHByb3ZlID0gcmVxLnF1ZXJ5LmFwcHJvdmU7XG5cbiAgICBsZXQgYmFzZVVybCA9IGBodHRwOi8vZ2F0ZXdheS1zZXJ2aWNlOjgwL21vZGVyYXRlP2lkPSR7aWR9JmFwcHJvdmU9JHthcHByb3ZlfWA7XG5cbiAgICBsb2dnZXIuaW5mbyhgR0VUICR7YmFzZVVybH1gKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IGZldGNoKGJhc2VVcmwpO1xuICAgIGxldCBkYXRhID0gYXdhaXQgcmVzcC5qc29uKCk7XG4gICAgLy9sb2dnZXIuaW5mbyhkYXRhKTtcbiAgICByZXMuc2VuZChkYXRhKTtcblxufSk7XG5cbmFwcC5saXN0ZW4ocHJvY2Vzcy5lbnYuUE9SVCB8fCAzMDAwLFxuICAgICgpID0+IGxvZ2dlci5pbmZvKFwiU2VydmVyIGlzIHJ1bm5pbmcuLi5cIikpOyJdfQ==