#!/usr/bin/env node
const sitemap2csv = require('./index.js');

// supports '--expand-paths' option
const run = () => {
  const [,, ...args] = process.argv;
  let expandPaths = false;
  if (args.length > 1 && args[1] === '--expand-paths') {
    expandPaths = true;
  }
  sitemap2csv(args[0], expandPaths);
};

run();
