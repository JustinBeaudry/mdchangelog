'use strict';

var exec = require('child_process').exec;
var mktemp = require('mktemp');
mktemp.createDir('/tmp/mdchangelog-XXXXXXX', function(err, path) {
  if (err) {
    console.log(err);
  }

  console.log(path);
  var repo = 'diffsky/foo';
  var cmd = 'git clone git@github.com:' + repo + '.git ' + path + '/' + repo;
  exec(cmd, {}, function(err, stdout, stderr) {
    console.log('err', err);
    console.log('stdout', stdout);
    console.log('stderr', stderr);

  });
});


