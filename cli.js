#!/usr/bin/env node
const sitemap2csv = require('./index.js');
const argv = require('yargs')
.option('e', {
    alias: 'expand-paths',
    default: false,
    describe: 'expand pathways',
    type: 'boolean'
})
.option('s', {
    alias: 'structure',
    default: false,
    describe: 'list number of child branches beneath each sub-path',
    type: 'boolean'
})
.option('a', {
    alias: 'all',
    default: true,
    describe: 'count all branches beneath a sub-path intead of just direct children',
    type: 'boolean'
})
.option('c', {
    alias: 'count-singles',
    default: false,
    describe: 'when listing sub-branches, count a single branch as 1',
    type: 'boolean'
})
.option('l', {
    alias: 'limit',
    default: -1,
    describe: 'list number of urls per folder',
    type: 'number'
})
.option('f', {
    alias: 'file',
    default: false,
    describe: 'use local copies instead of fetching from the host',
    type: 'boolean'
})
.argv
const url = argv._[0];

sitemap2csv(url, argv);
