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
    describe: 'list number of branches beneath each sub-path',
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
.argv

sitemap2csv(argv._[0], argv.expandPaths, argv.structure, argv.countSingles, argv.limit);
