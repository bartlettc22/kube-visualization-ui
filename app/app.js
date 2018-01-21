request = require('request');

// require and instantiate express
var express = require('express');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// set the static file location
app.use(express.static('public'))

app.get('/', function(req, res) {
  res.render('pages/index', { siteTitle : process.env.SITE_TITLE, siteLogoUrl : process.env.SITE_LOGO_URL, apiEndpoint : process.env.API_URL });
});

app.get('/hex', function(req, res) {
  res.render('pages/hex', { siteTitle : process.env.SITE_TITLE, siteLogoUrl : process.env.SITE_LOGO_URL, apiEndpoint : process.env.API_URL });
});

app.get('/stats', function(req, res) {
  res.render('pages/stats', { siteTitle : process.env.SITE_TITLE, siteLogoUrl : process.env.SITE_LOGO_URL, apiEndpoint : process.env.API_URL });
});

app.get('/statsdata', function(req, res) {

  options = {
    "headers": {
      'X-KubeViz-Token': process.env.API_KEY,
      'Content-Type': 'application/json'
    },
    "json": true
  }
  request(process.env.API_URL+"/stats", options, (error, response, body) => {
    if (error) { return console.log(error); }
    if(response) {
      res.setHeader('Content-Type', 'application/json');
      res.status(res.statusCode).send(body)
    } else {
      res.status(500).send("no response from backend")
    }
  });
});

app.get('/data', function(req, res) {
  if(process.env.LOCAL_DATA) {
    res.setHeader('Content-Type', 'application/json');
    var options = {
      root: __dirname + '/'
    };
    res.sendFile('data/data.json', options, function(err){
      if(err){
          console.log(err);
      }
    });
  } else {
    options = {
      "headers": {
        'X-KubeViz-Token': process.env.API_KEY,
        'Content-Type': 'application/json'
      },
      "json": true
    }
    request(process.env.API_URL+"/data", options, (error, response, body) => {
      if (error) { return console.log(error); }
      if(response) {
        res.setHeader('Content-Type', 'application/json');
        res.status(res.statusCode).send(body)
      } else {
        res.status(500).send("no response from backend")
      }
    });
  }
});

app.listen(80)

console.log('Server started')
