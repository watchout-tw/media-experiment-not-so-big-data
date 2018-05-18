let dataPoints = []

// x: int as string, y: number
const officialData = {
  '2000': 190.1,
  '2001': 180.4,
  '2002': 181.4,
  '2003': 181.3,
  '2004': 183.5,
  '2005': 181.9,
  '2006': 180.9,
  '2007': 180.4,
  '2008': 179.7,
  '2009': 176.7,
  '2010': 181.1,
  '2011': 178.7,
  '2012': 178.4,
  '2013': 177,
  '2014': 177.9,
  '2015': 175.3,
  '2016': 169.5,
  '2017': 169.6
}
const speeches = require('./working-hours-20180518.json').speeches
let speaker
let lastX = '2008'
speeches.forEach(speech => {
  speaker = speech.speakerID
  if(speech.speakerClasses.includes('anonymous')) {
    speaker = speech.speakerID.substr(speech.speakerID.length - 16)
  }
  dataPoints.push({ speaker, x: parseInt(lastX), y: officialData[lastX] })
  speech.data.points.forEach(point => {
    let x = parseInt(point.x)
    let y = point.y
    dataPoints.push({ speaker, x, y })
  })
})

const median = {
  '2009': 180.5867019,
  '2010': 181.466754,
  '2011': 182.1512384,
  '2012': 182.6988264,
  '2013': 183.0141346,
  '2014': 183.4224246,
  '2015': 183.9018954,
  '2016': 184.1230774,
  '2017': 184.9709452
}

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
