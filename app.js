var express = require('express');

var auth = require('http-auth');
var basic = auth.basic({
        realm: "Daredevil Experiment."
    }, function (username, password, callback) {
        callback(username === "daredevil" && password === "leet1337");
    }
);

var app = express();
app.use(auth.connect(basic));

app.use(express.static('client'));

app.listen(80, function () {
  console.log('Daredevil started on port 8080');
});