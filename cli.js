#!/usr/bin/env node
const sitemap2csv = require('./index.js');

const run = async() => {
  const [,, ...args] = process.argv;
  sitemap2csv(args[0]);
};

run();
