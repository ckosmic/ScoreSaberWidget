// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: window-restore;
let user_id = args.widgetParameter;

if(user_id == null)  
  user_id = "76561198131208517"

const api_url = "https://new.scoresaber.com"
const url = api_url + "/api/player/" + user_id + "/full"

const ySegments = 4

const req = new Request(url)
const res = await req.loadJSON()

const avatar = res.playerInfo.avatar
const avatar_i = await new Request(api_url + avatar)
const avatarImg = await avatar_i.loadImage()

const flag = "https://scoresaber.com/imports/images/flags/" + res.playerInfo.country.toLowerCase() + ".png"
const flag_i = await new Request(flag)
const flagImg = await flag_i.loadImage()



let badges = await getBadges()

const graphRect = new Rect(120, 338, 540, 300)

let context = new DrawContext()
context.size = new Size(720, 720)
context.opaque = false
let widget = createWidget()
widget.backgroundImage = context.getImage()
const refreshMinutes = 30
let now = new Date()
let later = new Date(now.getTime() + refreshMinutes * 60000)
widget.refreshAfterDate = later

await widget.presentLarge()

Script.setWidget(widget)
Script.complete()

function createWidget() {
  let w = new ListWidget()
  
  let headerStack = w.addStack()
  headerStack.centerAlignContent()
  headerStack.url = "https://scoresaber.com/u/" + user_id
  
  let image = headerStack.addImage(avatarImg)
  image.imageSize = new Size(30, 30)
  image.cornerRadius = 15
  headerStack.addSpacer(6)
  
  let titleElement = headerStack.addText(res.playerInfo.playerName)
  titleElement.textColor = Color.white()
  titleElement.textOpacity = 1.0
  titleElement.font = Font.boldRoundedSystemFont(18)
  titleElement.lineLimit = 1
  
  let ssElement = headerStack.addText(" - ScoreSaber")
  ssElement.textColor = Color.white()
  ssElement.textOpacity = 0.7
  ssElement.font = Font.mediumRoundedSystemFont(14)
  ssElement.lineLimit = 1
  
  w.addSpacer(10)
  
  let rankStack = w.addStack()
  rankStack.centerAlignContent()
  let rankElement = rankStack.addText("Player Ranking: #" + formatNumber(res.playerInfo.rank) + " (" )
  rankElement.textColor = Color.white()
  rankElement.font = Font.lightRoundedSystemFont(12)
  
  image = rankStack.addImage(flagImg)
  image.imageSize = new Size(14, 9)
  
  let countryRankElement = rankStack.addText(" - #" + formatNumber(res.playerInfo.countryRank) + ")" )
  countryRankElement.textColor = Color.white()
  countryRankElement.font = Font.lightRoundedSystemFont(12)
  
  let ppElement = w.addText("Performance Points: " + formatNumber(res.playerInfo.pp) + "pp")
  ppElement.textColor = Color.white()
  ppElement.font = Font.lightRoundedSystemFont(12)
  
  let plyElement = w.addText("Play Count: " + formatNumber(res.scoreStats.totalPlayCount))
  plyElement.textColor = Color.white()
  plyElement.font = Font.lightRoundedSystemFont(12)
  
  let scoreElement = w.addText("Total Score: " + formatNumber(res.scoreStats.totalScore))
  scoreElement.textColor = Color.white()
  scoreElement.font = Font.lightRoundedSystemFont(12)
  
  let accElement = w.addText("Average Accuracy: " + Math.ceil(res.scoreStats.averageRankedAccuracy * 100) / 100 + "%")
  accElement.textColor = Color.white()
  accElement.font = Font.lightRoundedSystemFont(12)
  
  w.addSpacer(null)
  
  let history = res.playerInfo.history.split(",")
  let min = Infinity
  let max = 0
  
  for(let i = 0; i < history.length; i++) {
    let tmp = parseInt(history[i])
    min = (tmp < min ? tmp : min)
    max = (tmp > max ? tmp : max)
  }
  
  let base = 100000
  if(min > 0 && min <= 10) base = 1
  else if(min > 10 && min <= 100) base = 10
  else if(min > 100 && min <= 1000) base = 100
  else if(min > 1000 && min <= 10000) base = 1000
  else if(min > 10000 && min <= 100000) base = 10000
  
  min = Math.floor(min / base) * base
  max = Math.ceil(max / base) * base
  if(min == 1) min = 0
  if(max == 1) max = 2
  
  // Axis lines
  let p1 = new Point(graphRect.minX, graphRect.minY);    
  let p2 = new Point(graphRect.minX, graphRect.maxY); 
  drawLine(p1, p2, 1, Color.gray())
  p1 = new Point(graphRect.minX, graphRect.maxY);    
  p2 = new Point(graphRect.maxX, graphRect.maxY); 
  drawLine(p1, p2, 1, Color.gray())
  
  let steps = base * Math.ceil((max - min) / base) / ySegments
  
  // Y axis lines (rank range)
  let index = 0
  let y = 0
  while(y < max) {
    y = min + index * steps
    
    if(y % 1 == 0) {
      let lineY = lerp(graphRect.minY, graphRect.maxY, percent(y, min, max))
      p1 = new Point(graphRect.minX, lineY)
      p2 = new Point(graphRect.maxX, lineY)
  
      drawLine(p1, p2, 1, Color.gray())
    
      context.setTextAlignedRight()
      const rankRect = new Rect(0, lineY-11, 100, 23);
      drawTextR(y + "", rankRect, Color.gray(), Font.boldRoundedSystemFont(19));  
    }
  
    index++
  }
  
  // X axis lines (days ago)
  for(let i = 0; i < 5; i++) {
    let x = lerp(0, history.length, i/4)
    
    let lineX = lerp(graphRect.minX, graphRect.maxX, i/4)  
    p1 = new Point(lineX, graphRect.minY)
    p2 = new Point(lineX, graphRect.maxY)
    
    drawLine(p1, p2, 1, Color.gray())
    
    context.setTextAlignedCenter()
    const rankRect = new Rect(lineX-50, graphRect.y+320, 100, 23);  
    let text = (history.length - Math.floor(x)) + ""  
    if(text == 0) text = "now"
	drawTextR(text, rankRect, Color.gray(), Font.boldRoundedSystemFont(19));
  }
  
  const rankRect = new Rect(graphRect.x, graphRect.y - 40, graphRect.width, 30);
  drawTextR("Rank Over the Past " + (history.length + 1) + " Days", rankRect, Color.white(), Font.boldRoundedSystemFont(24));
  
  // Graph
  for(let i = 0; i < history.length; i++) {
    if (i < history.length - 1) {
      p1 = new Point(lerp(graphRect.minX, graphRect.maxX, i / (history.length-1)), lerp(graphRect.minY, graphRect.maxY, percent(parseInt(history[i]), min, max)))  
      p2 = new Point(lerp(graphRect.minX, graphRect.maxX, (i+1) / (history.length-1)), lerp(graphRect.minY, graphRect.maxY, percent(parseInt(history[i+1]), min, max)))
  
      drawLine(p1, p2, 3, Color.orange())
    }
  }
  
  // Badges
  let badgeX = 490
  let badgeY = 110
  for(let i = 0; i < badges.length; i++) {
    const p = new Point(badgeX, badgeY)
    context.drawImageAtPoint(badges[i], p)
    badgeY += 40
    if((i + 1) % 5 == 0) {
      badgeX += 100
      badgeY = 110
    }
    if(i == 9) break;
  }
  
  return w
}

async function getBadges() {
  let badges = new Array()
  const badge_url = "/api/static/badges/"
  for(let i = 0; i < res.playerInfo.badges.length; i++) {
    const badge = res.playerInfo.badges[i].image
    const j = await new Request(api_url + badge_url + badge)  
    const img = await j.loadImage()
    badges.push(img)
  }
  return badges
}

function kFormatter(num){
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
}

function drawTextR(text, rect, color, font){
	context.setFont(font);
	context.setTextColor(color);
	context.drawTextInRect(new String(text).toString(), rect);
}

function drawLine(a, b, width, color) {
  const path = new Path()
  path.move(a)
  path.addLine(b)
  context.addPath(path)
  context.setStrokeColor(color)
  context.setLineWidth(width)
  context.strokePath()
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t
}

function percent(x, a, b) {
  return (x - a) / (b - a)
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}