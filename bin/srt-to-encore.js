#! /usr/bin/env node

var srtToEncore = require('../')
var path = require('path')
var fs = require('fs')

var userArgs = process.argv.slice(2)
if (userArgs.length < 2) {
  throw new Error('You must provide an SRT source file, and a output file name')
}

var srtPath = fs.realpathSync(userArgs[0])
var output = userArgs[1]

console.log('Parsing %s', srtPath)

srtToEncore(srtPath, output, function(err) {
  if (err) throw err
  console.log('Wrote file %s', output)
})
