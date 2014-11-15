'use strict';

var util = require('util');
var semver = require('semver');

function padding(depth) {
  return Array(((depth) * 2) + 1).join(' ');
}

function makeIssue(depth, issue) {
  var text = issue.number;
  if (issue.foreign) {
    text = issue.key;
  }
  return util.format('%s- [**#%s**](https://github.com/%s/issues/%s) %s', padding(depth), text, issue.repo, issue.number, issue.title);
}

function formatIssue(issue, repo, data) {
  var res = [];
  var depth = 0;

  function findDependents(issue, repo) {
    var dependent = data[repo].dependents[issue.key];
    if (dependent) {
      res.push(makeIssue(depth, issue));
      depth += 1;
      data[dependent.repo].milestonesList.forEach(function(milestone) {
        if (semver.gt(milestone.title, dependent.from) && semver.lte(milestone.title, dependent.to)) {
          res.push(util.format('%s- **%s %s**', padding(depth), dependent.repo, milestone.title));
          milestone.issues.list.forEach(function(issue) {
            findDependents(issue, issue.repo);
          });
        }
      });
    } else {
      res.push(makeIssue(depth, issue));
      if (depth > 0) {
        depth -= 1;
      }
    }
  }
  findDependents(issue, repo);

  return res.join('\n');
}

module.exports = function(opts) {
  var data = opts.data;
  var repo = opts.repo;
  var main = data[repo];
  var o = [];

  if (main.prologue) {
    o.push(util.format('# %s', main.summary.commits.start.date));
    o.push(util.format('%s commits against %s issues, over %s [`%s`](https://github.com/%s/commit/%s)%s[`%s`](https://github.com/%s/commit/%s)', main.summary.commits.total, main.summary.issues.total, main.summary.commits.duration, main.summary.commits.start.shaAbbr, main.repo, main.summary.commits.start.shaAbbr, main.symbol, main.summary.commits.end.shaAbbr, main.repo, main.summary.commits.end.shaAbbr));
  }

  main.milestonesList.forEach(function(milestone) {
    o.push(util.format('\n## [**%s**](https://github.com/%s/issues?milestone=%s&state=%s)', milestone.title, main.repo, milestone.number, milestone.state));
    milestone.issues.list.forEach(function(issue) {
      o.push(formatIssue(issue, repo, data));
    });
  });

  if (main.orphanIssues.length) {
    o.push(util.format('\n##Issues'));
    main.orphanIssues.forEach(function(issue) {
      o.push(formatIssue(issue, repo, data));
    });
  }

  if (main.anchor) {
    o.push('\n---\n');
  }

  o.push(main.existingChangelog);

  return o.join('\n');
};
