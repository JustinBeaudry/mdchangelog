'use strict';

var mktemp = require('mktemp');
var MDchangelog = require('./mdchangelog');
var exec = require('child_process').exec;
var logs = {};
var dependentLogs = [];
var deap = require('deap');
var async = require('async');
var tmpDir;
var fs = require('fs');
var path = require('path');
var formatter = require('./formatter');

function runLog(opts, cb) {
  MDchangelog(opts)(function(err, res){
    if(err) {
      return cb(err);
    }
    logs[res.repo] = res;
    if(res.dependents) {
      Object.keys(res.dependents).forEach(function(issue){
        dependentLogs.push(res.dependents[issue].repo);
      });
    }
    cb(err, res);
  });
}

function runDependentIssue(opts, cb) {

  var cloneDir = tmpDir + '/' + opts.repo;
  opts.opts.cwd = cloneDir;

  if (fs.existsSync(cloneDir)) {
    runLog(opts.opts, cb);
  } else {
    var cmd = 'git clone git@github.com:' + opts.repo + '.git ' + cloneDir;
    exec(cmd, {}, function(err, stdout, stderr) {
      if (err) {
        return cb(err);
      }
      runLog(opts.opts, cb);
    });
  }
}

var start = function(opts, cb) {
  var repo;
  var output;
  runLog(opts, function(err, res){
    if(err) {
      return cb(err);
    }
    logs[res.repo] = res;
    repo = res.repo;
    if(res.dependents) {
      mktemp.createDir('/tmp/mdchangelog-XXXXXXX', function(err, dir) {
        if(err) {
          return cb(err);
        }
        tmpDir = dir;
        async.whilst(
          function () {
            return dependentLogs.length;
          },
          function (callback) {
            runDependentIssue({
              repo: dependentLogs.shift(),
              opts: deap.merge({}, opts)}
          , function(err, res){
              callback(err);
            });
          },
          function (err) {
            if(err) {
              return cb(err);
            }
            output = formatter({
              opts: opts,
              repo: repo,
              data: logs
            });
            fs.writeFileSync(path.join(opts.cwd, 'CHANGELOG.md'), output);
            cb(err, output);
          }
        );
      });
    } else {
      output = formatter({
        opts: opts,
        repo: repo,
        data: logs
      });
      fs.writeFileSync(path.join(opts.cwd, 'CHANGELOG.md'), output);
      cb(err, output);
    }
  });
};

module.exports = {
  start: start
};
