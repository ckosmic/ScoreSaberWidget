let user_id = args.widgetParameter;

const api_url = "https://scoresaber.com"

// If user ID is not provided, grab player #1's user ID
if(user_id == null || user_id == "" || user_id == undefined) {
  const req = new Request(api_url + "/api/players")  
  const res = await req.loadJSON()
  
  user_id = res.players[0].id
}
// user_id = "76561198131208517"

const url = api_url + "/api/player/" + user_id + "/full"

const ySegments = 4

const req = new Request(url)
const res = await req.loadJSON()

const avatar = res.profilePicture
const avatar_i = await new Request(avatar)
const avatarImg = await avatar_i.loadImage()

const toEmojiFlag = (countryCode) => countryCode.toLowerCase().replace(/[a-z]/g, (i) => String.fromCodePoint((i.codePointAt(0) ?? 0) - 97 + 0x1f1e6));
const flagEmoji = toEmojiFlag(res.country)



let badges = await getBadges()

const graphRect = new Rect(120, 338, 540, 300)

const locales = {
  ranking_big: "Player Ranking: #",
  pp_big: "Performance Points: ",
  play_big: "Play Count: ",
  score_big: "Total Score: ",
  acc_big: "Average Accuracy: ",
  ranking_small: "#",
  pp_small: "",
  play_small: "",
  score_small: "",
  acc_small: ""
}

let widgetSize = "big"
let context = new DrawContext()
switch(config.widgetFamily) {
  case "small":
    context.size = new Size(360, 360)
    widgetSize = "small"
    break;
  case "medium":
    context.size = new Size(720, 360)
    widgetSize = "big"
    break;
  case "large":
    context.size = new Size(720, 720)
    widgetSize = "big"
    break;
  default:
    context.size = new Size(720, 720)
    widgetSize = "big"
    break;
}
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
  w.backgroundColor = new Color("#000000", 1)
  
  let headerStack = w.addStack()
  headerStack.centerAlignContent()
  headerStack.url = "https://scoresaber.com/u/" + user_id
  if(widgetSize == "small")
    headerStack.addSpacer(null)
  
  let image = headerStack.addImage(avatarImg)
  if(widgetSize == "small") {
    image.imageSize = new Size(50, 50)
    image.cornerRadius = 25
    headerStack.addSpacer(null)
  } else {
    image.imageSize = new Size(30, 30)
    image.cornerRadius = 15
    headerStack.addSpacer(6)
  }
  
  let titleElement = null
  if(widgetSize == "small") {
    titleElement = w.addText(res.name)
    titleElement.centerAlignText()
  } else {
    titleElement = headerStack.addText(res.name)
  }
  titleElement.textColor = Color.white()
  titleElement.textOpacity = 1.0
  titleElement.font = Font.boldRoundedSystemFont(18)
  titleElement.lineLimit = 1
  
  if(widgetSize == "big") {
    let ssElement = headerStack.addText(" - ScoreSaber")
    ssElement.textColor = Color.white()
    ssElement.textOpacity = 0.7
    ssElement.font = Font.mediumRoundedSystemFont(14)
    ssElement.lineLimit = 1
  }
  
  w.addSpacer(10)
  
  let rankStack = w.addStack()
  if(widgetSize == "small")
  rankStack.addSpacer(null)
  rankStack.centerAlignContent()
  let rankElement = rankStack.addText(`${locales["ranking_"+widgetSize]}${formatNumber(res.rank)} (${flagEmoji} #${formatNumber(res.countryRank)})`)
  rankElement.textColor = Color.white()
  rankElement.font = Font.lightRoundedSystemFont(12)
  
  let ppElement = w.addText(locales["pp_"+widgetSize] + formatNumber(res.pp) + "pp")
  ppElement.textColor = Color.white()
  ppElement.font = Font.lightRoundedSystemFont(12)

  if(widgetSize == "small") {
    ppElement.centerAlignText()
    rankStack.addSpacer(null)
  } else {
    let plyElement = w.addText(locales["play_"+widgetSize] + formatNumber(res.scoreStats.totalPlayCount))
    plyElement.textColor = Color.white()
    plyElement.font = Font.lightRoundedSystemFont(12)
  
    let scoreElement = w.addText(locales["score_"+widgetSize] + formatNumber(res.scoreStats.totalScore))
    scoreElement.textColor = Color.white()
    scoreElement.font = Font.lightRoundedSystemFont(12)
  }
  
  let accElement = w.addText(locales["acc_"+widgetSize] + Math.ceil(res.scoreStats.averageRankedAccuracy * 100) / 100 + "%")
  accElement.textColor = Color.white()
  accElement.font = Font.lightRoundedSystemFont(12)
  if(widgetSize == "small") 
    accElement.centerAlignText()

  // Badges
  let badgeX = 480
  let badgeY = 100
  if(badges.length <= 5) badgeX += 100
  for(let i = 0; i < badges.length; i++) {
    const p = new Point(badgeX, badgeY)
    context.drawImageAtPoint(badges[i], p)
    badgeY += 40
    if((i + 1) % 5 == 0) {
      badgeX += 100
      badgeY = 100
    }
    if(i == 9) break;
  }
  
  if(config.widgetFamily == "large" || config.widgetFamily == null) {
  
    w.addSpacer(null)
  
    let history = res.histories.split(",")  
    history.push(res.rank)
    let min = Infinity
    let max = 0
  
    for(let i = 0; i < history.length; i++) {
      let tmp = parseInt(history[i])
      min = (tmp < min ? tmp : min)
      max = (tmp > max ? tmp : max)
    }
  
    let base = 100000
    let cmp = max - min
    if(cmp >= 0 && cmp <= 10) base = 4
    else if(cmp > 10 && cmp <= 100) base = 10
    else if(cmp > 100 && cmp <= 1000) base = 100
    else if(cmp > 1000 && cmp <= 10000) base = 1000
    else if(cmp > 10000 && cmp <= 100000) base = 10000
  
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
    while(y  < max) {
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
    drawTextR("Rank Over the Past " + history.length + " Days", rankRect, Color.white(), Font.boldRoundedSystemFont(24));
  
  
  
    // Graph
    for(let i = 0; i < history.length; i++) {
      if (i < history.length - 1) {
        p1 = new Point(lerp(graphRect.minX, graphRect.maxX, i / (history.length-1)), lerp(graphRect.minY, graphRect.maxY, percent(parseInt(history[i]), min, max)))  
        p2 = new Point(lerp(graphRect.minX, graphRect.maxX, (i+1) / (history.length-1)), lerp(graphRect.minY, graphRect.maxY, percent(parseInt(history[i+1]), min, max)))
  
        drawLine(p1, p2, 3, Color.orange())
      }
    }
  }
  
  return w
}

async function getBadges() {
  let badges = new Array()
  for(let i = 0; i < res.badges.length; i++) {
    const badge = res.badges[i].image
    const j = await new Request(badge)  
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
