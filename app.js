/**
 * Arnaud Allouis
 */
var express = require('express');


var app = express();

app.use(express.static('client'));

app.listen(9999, function () {
  console.log('Daredevil started on port 9999');
});