let dataPoints = []

// x: int as string, y: number
const officialData = {
  '2000': 41861,
  '2001': 41960,
  '2002': 41530,
  '2003': 42065,
  '2004': 42680,
  '2005': 43159,
  '2006': 43488,
  '2007': 44392,
  '2008': 44367,
  '2009': 42182,
  '2010': 44359,
  '2011': 45508,
  '2012': 45589,
  '2013': 45664,
  '2014': 47300,
  '2015': 48490,
  '2016': 48790,
  '2017': 49989
}
const speeches = require('./annual-income-20180519.json').speeches
let speaker
let lastX = '2008'

const allKeys = Object.keys(officialData)
const allKeysWithUserInput = allKeys.slice(allKeys.indexOf(lastX) + 1)
const allUserInput = Object.assign({}, ...allKeysWithUserInput.map(key => ({ [key]: [] })))

speeches.forEach(speech => {
  speaker = speech.speakerID
  if(speech.speakerClasses.includes('anonymous')) {
    speaker = speech.speakerID.substr(speech.speakerID.length - 16)
  }
  dataPoints.push({ speaker, x: parseInt(lastX), y: officialData[lastX] })
  speech.data.points.forEach(point => {
    allUserInput[point.x].push(point.y)
    dataPoints.push({ speaker, x: parseInt(point.x), y: point.y })
  })
})
const median = {}
allKeysWithUserInput.forEach(key => {
  let values = allUserInput[key]
  values.sort()
  median[key] = values[Math.floor(values.length / 2)]
})

speaker = 'median'
dataPoints.push({ speaker, x: parseInt(lastX), y: officialData[lastX] })
Object.keys(median).map(key => {
  let x = parseInt(key)
  let y = median[key]
  dataPoints.push({ speaker, x, y })
})

speaker = 'official_data'
Object.keys(officialData).map(key => {
  let x = parseInt(key)
  let y = officialData[key]
  dataPoints.push({ speaker, x, y })
})

// output
let delim = ','
dataPoints.forEach(point => {
  console.log(`${point.speaker}${delim}${point.x}${delim}${point.y}`)
})
