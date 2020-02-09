const express = require('express'),
      fs = require('fs'),
      co = require('co'),
      crawler = require('crawler-request'),
      pdfParser = require('pdf-parse'),
      request = require('request'),
      cheerio = require('cheerio');

var app = express();

app.get('/', function(req, res) {
  let reports = {};
  let url = "https://www.rit.edu/fa/publicsafety/daily-crime-log"
  request(url, function(error, response, body) {
    if (error) {
      console.log("error");
    }

    const locationReg = /[0-9 ]*[A-Z]*[ ]{0,1}[A-Z]{3,}[a-zA-Z0-9 &\/\-\(\)\.]*\n/;
    const timeReg = /\d{2}\/\d{2}\/\d{2}.*-.*\d{2}\/\d{2}\/\d{2}.*-.*\n/;
    const offenseReg = /^[A-Za-z1-5\-, ]* - [\d]*\.[\d]*.*\n/m;
    let rawReports = [];
    let urls = [];

    var cheer = cheerio.load(body);
    cheer('#block-system-main a').each(function(index) {
      var href = cheer(this).attr('href');
      if (href.substr(href.length - 3) == "pdf") {
        urls.push(href);
      }
    });

    let promiseArray = [];

    for (var i = 0; i < urls.length; i++) {
      promiseArray.push(crawler(urls[i]));
    }

    Promise.all(promiseArray)
    .then(function(responses) {
      for (var j = 0; j < responses.length; j++) {
        var text = responses[j].text.replace(/Rochester Institute of Technology\nDepartment.*\nCase.*\n[A-Z][a-z]{2}.*/gm, "");
        text = text.replace(/\d{1,2}\nPage No\.\n\d{2}.*\nPrint Date.*\n/gm, "");
        text = text.replace(/^[\s]*\n/gm, "");
        rawReports = text.split("Report #:");

        for (var i = 0; i < rawReports.length; i++) {
          let location = rawReports[i].match(locationReg) + "";
          location = location.trim();
          let time = rawReports[i].match(timeReg) + "";
          let offense = rawReports[i].match(offenseReg) + "";
          offense = offense.trim();

          if (location === "null" || time === "null" || offense === "null") {
            continue;
          }

          if (reports[location]) {
            reports[location]['totalCrimes'] += 1;
            reports[location]['incidents'].push({"offense": offense, "time": time});
          } else {
            reports[location] = {};
            reports[location]['totalCrimes'] = 1;
            reports[location]['incidents'] = [{"offense": offense, "time": time}];
          }
        }
      }

      return res.json(reports);
    });
  });


});

app.listen(5000);
