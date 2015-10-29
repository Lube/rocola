var express = require('express');
var bodyParser = require("body-parser");


var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
var url = "";
var nexturl = "";

app.use('/static', express.static('public'));

app.get('/current', function (req, res) {
  res.send(JSON.stringify({"current": url, "next": nexturl}))	;
});

app.post('/nextVideo', function(sReq, sRes){ 
	if (url == "") {
    	url = sReq.body.url;
    	sRes.send('ok');
    }
    else if (nexturl == "") {
    	nexturl = sReq.body.url;
    	sRes.send('ok');
    }
    else if (sReq.body.url == "" && nexturl == "") {
    	url = ""
    	sRes.send('ok');
    } 
    else if (sReq.body.url == "") {
    	url = nexturl
    	nexturl = ""
    	sRes.send('ok');
    }
    else {
    	sRes.status(500);
		sRes.send('None shall pass');
    }
});



var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

