/**
 * Module dependencies
 */

var srt = require('srt')
var fs = require('fs')

/**
 * Unit durations in milliseconds
 */

var unitDuration =  {
  y: 31557600000,
  mo: 2629800000,
  w: 604800000,
  d: 86400000,
  h: 3600000,
  m: 60000,
  s: 1000,
  fs: 1,
  ms: 1
}

/**
 * Encore Subtitle template
 * @param  {Number} number    index of caption
 * @param  {String} startTime start time of caption
 * @param  {String} endTime   end time of caption
 * @param  {String} text      text content of caption
 * @return {String}           formatted string
 */

function toEncore(number, startTime, endTime, text) {
  return `${number} ${startTime} ${endTime} ${text}
  \n`
}

/**
 * Encore Timestamp format template
 * @param  {Object} units containing h, m, s, fs
 * @return {[type]}       [description]
 */

function convertToTimestamp(units) {
  return `${fill0(2, units.h)};${fill0(2, units.m)};${fill0(2, units.s)};${fill0(2, units.fs)}`
}

/**
 * Convert ms to fps
 * @param  {Number} ms
 * @param  {Number} fps
 * @return {Number}
 */

function msToFrames(ms, fps) {
  fps = fps || 24
  return Math.round(ms / (1000 / fps))
}

/**
 * Calculate unit values
 * @param  {Number} duration
 * @param  {Array} units
 * @return {Object}
 */

function calculateUnitValues(duration, units) {
  var remains = duration;
  var unitValueMap = {}
  units.forEach(function(unit) {
    unitValueMap[unit] = Math.floor(remains / unitDuration[unit])
    remains -= unitDuration[unit] * unitValueMap[unit]
    if (unit === 'fs') {
      unitValueMap[unit] = msToFrames(unitValueMap[unit])
    }
  })
  return unitValueMap
}

/**
 * Ensure a 00 number formatting
 * @param  {Number} value
 * @return {String}
 */

function fill0(num, value) {
  var strValue = value.toString()
  return strValue.length >= 2 ? strValue : '0' + strValue
}

/**
 * Format the parsed SRT
 * @param  {Number} duration
 * @return {String}
 */

function format(duration) {
  var unitValues = calculateUnitValues(duration, ['h', 'm', 's', 'fs'])
  return convertToTimestamp(unitValues)
}


/**
 * Do the magic
 */

module.exports = function(srtPath, output, fn) {

  srt(srtPath, function(err, caps) {

    if (err) {
      return fn(err)
    }

    var buf = ''
    var keys = Object.keys(caps)

    var lastEndTime, lastStartTime

    keys.forEach(function(key, i) {
      var cap = caps[key]
      cap.startTime = format(cap.startTime)

      // make sure times aren't overlapping, as a cause of rounding.
      if (lastEndTime === cap.startTime) {
        var newString = cap.startTime.substring(0, cap.startTime.length - 1) +
          (Number(cap.startTime.substring(cap.startTime.length - 1)) + 1)
        cap.startTime = newString
      }

      var formattedEndTime = format(cap.endTime)
      cap.endTime = format(cap.endTime)
      var str = toEncore(cap.number, cap.startTime, cap.endTime, cap.text)
      lastEndTime = cap.endTime
      lastStartTime = cap.startTime
      buf += str
    })

    fs.writeFile(output, buf, function(err) {
      if (err) {
        return fn(err)
      }

      fn()
    })
  })
}
