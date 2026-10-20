// 完整天氣資料庫 (新增：起霧 Foggy)
const ALL_WEATHER_DATA = [
  { id: 'cloudy', name: '多雲', en: 'Cloudy' },
  { id: 'rainy', name: '下雨', en: 'Rainy' },
  { id: 'sunny', name: '晴天', en: 'Sunny' },
  { id: 'thunderstorm', name: '打雷閃電', en: 'Thunderstorm' },
  { id: 'snowy', name: '下雪', en: 'Snowy' },
  { id: 'windy', name: '颳大風', en: 'Windy' },
  { id: 'foggy', name: '起霧', en: 'Foggy' }
];

let currentGameData = []; // 當前一輪隨機抽出的 6 個天氣
let weatherCards = []; // 6個目標格子
let draggableOptions = []; // 可拖曳選項卡片
let draggingCard = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let submitted = false;
let score = 0;
let timerSeconds = 0;
let timerInterval = null;

// 按鈕邊界定義（精確對齊左側 50px）
const submitBtnArea = { x: 50, y: 768, w: 110, h: 42 };
const resetBtnArea = { x: 175, y: 768, w: 110, h: 42 };

function setup() {
  let canvas = createCanvas(920, 840);
  canvas.parent('canvas-container');
  textFont('Helvetica, Arial, sans-serif');

  initGame();
  startTimer();
}

function initGame() {
  submitted = false;
  score = 0;

  // 1. 從 7 個天氣中隨機抽出 6 個作為本輪題目
  let shuffledAll = [...ALL_WEATHER_DATA].sort(() => Math.random() - 0.5);
  currentGameData = shuffledAll.slice(0, 6);
  
  // 2. 建立 6 個天氣目標格子 (2列 x 3行)
  weatherCards = [];
  const startX = 50;
  const startY = 120;
  const cardW = 260;
  const cardH = 160;
  const gapX = 25;
  const gapY = 85;

  for (let i = 0; i < currentGameData.length; i++) {
    let col = i % 3;
    let row = Math.floor(i / 3);
    let x = startX + col * (cardW + gapX);
    let y = startY + row * (cardH + gapY);

    weatherCards.push({
      id: currentGameData[i].id,
      num: i + 1,
      x: x,
      y: y,
      w: cardW,
      h: cardH,
      slotX: x,
      slotY: y + cardH + 12,
      slotW: cardW,
      slotH: 50,
      occupiedBy: null
    });
  }

  // 3. 洗牌本輪的 6 個選項並放置於下方預設位置 (兩行排列)
  let shuffledOptions = [...currentGameData].sort(() => Math.random() - 0.5);
  draggableOptions = [];

  const optStartX = 50;
  const optStartY = 615;
  const optW = 260;
  const optH = 48;
  const optGapX = 25;
  const optGapY = 16;

  for (let i = 0; i < shuffledOptions.length; i++) {
    let col = i % 3;
    let row = Math.floor(i / 3);
    let homeX = optStartX + col * (optW + optGapX);
    let homeY = optStartY + row * (optH + optGapY);

    draggableOptions.push({
      data: shuffledOptions[i],
      x: homeX,
      y: homeY,
      targetX: homeX,
      targetY: homeY,
      homeX: homeX,
      homeY: homeY,
      w: optW,
      h: optH,
      placedInSlot: null,
      isDragging: false
    });
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerSeconds = 0;
  timerInterval = setInterval(() => {
    if (!submitted) timerSeconds++;
  }, 1000);
}

function restartGame() {
  initGame();
  startTimer();
}

function submitAnswers() {
  if (submitted) return;
  submitted = true;

  let correctCount = 0;
  weatherCards.forEach(card => {
    if (card.occupiedBy && card.occupiedBy.data.id === card.id) {
      correctCount++;
    }
  });

  score = Math.round((correctCount / currentGameData.length) * 100);
}

function draw() {
  background(245, 247, 250);

  drawHeader();
  drawWeatherCards();
  updateAndDrawOptions();
  drawFooterText();
  drawCanvasButtons();
}

// 繪製標題與右上角計時器／成績
function drawHeader() {
  fill(160);
  textSize(12);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text("MATCHING QUIZ · GIF", 50, 25);

  fill(30);
  textSize(24);
  text("天氣動畫連連看", 50, 43);

  fill(100);
  textSize(14);
  textStyle(NORMAL);
  text("看看每張動畫是什麼天氣，把下方的名稱拖曳到圖片下方的格子裡", 50, 78);

  // 右上角分數 & 時間資訊框
  drawInfoBox(720, 30, "成績", submitted ? `${score} 分` : "-- 分", submitted ? "#e07a5f" : "#666666");
  let mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  let secs = String(timerSeconds % 60).padStart(2, '0');
  drawInfoBox(815, 30, "時間", `${mins}:${secs}`, "#333333");
}

function drawInfoBox(x, y, label, val, valColor) {
  stroke(220);
  fill(255);
  rect(x, y, 75, 55, 8);

  noStroke();
  fill(120);
  textSize(11);
  textAlign(CENTER, TOP);
  text(label, x + 37, y + 6);

  fill(valColor);
  textSize(17);
  textStyle(BOLD);
  text(val, x + 37, y + 26);
  textStyle(NORMAL);
}

// 繪製 6 個天氣動畫卡片與下方的放置對應框
function drawWeatherCards() {
  weatherCards.forEach(card => {
    push();
    translate(card.x, card.y);
    stroke(200);
    strokeWeight(1);
    fill(255);
    rect(0, 0, card.w, card.h, 10);
    clip(() => { rect(0, 0, card.w, card.h, 10); });

    drawWeatherAnimation(card.id, card.w, card.h);

    fill(0, 0, 0, 150);
    noStroke();
    rect(8, 8, 32, 22, 4);
    fill(255);
    textSize(12);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(`#${card.num}`, 24, 19);
    pop();

    stroke(180);
    strokeWeight(1.5);
    fill(255);
    rect(card.slotX, card.slotY, card.slotW, card.slotH, 25);

    if (submitted) {
      if (card.occupiedBy) {
        let isCorrect = (card.occupiedBy.data.id === card.id);
        stroke(isCorrect ? '#2a9d8f' : '#e63946');
        strokeWeight(2.5);
        noFill();
        rect(card.slotX, card.slotY, card.slotW, card.slotH, 25);

        noStroke();
        textSize(13);
        textStyle(BOLD);
        textAlign(LEFT, TOP);
        if (isCorrect) {
          fill('#2a9d8f');
          text("✓ 正確", card.slotX + 5, card.slotY + card.slotH + 6);
        } else {
          fill('#e63946');
          let correctItem = ALL_WEATHER_DATA.find(d => d.id === card.id);
          text(`✕ 正解：${correctItem.name}`, card.slotX + 5, card.slotY + card.slotH + 6);
        }
      } else {
        stroke('#e63946');
        strokeWeight(2.5);
        noFill();
        rect(card.slotX, card.slotY, card.slotW, card.slotH, 25);

        noStroke();
        fill('#e63946');
        textSize(13);
        textStyle(BOLD);
        textAlign(LEFT, TOP);
        let correctItem = ALL_WEATHER_DATA.find(d => d.id === card.id);
        text(`✕ 未作答，正解：${correctItem.name}`, card.slotX + 5, card.slotY + card.slotH + 6);
      }
    }
  });
}

// 繪製可拖曳選項卡片
function updateAndDrawOptions() {
  draggableOptions.forEach(opt => {
    if (!opt.isDragging) {
      opt.x = lerp(opt.x, opt.targetX, 0.25);
      opt.y = lerp(opt.y, opt.targetY, 0.25);
    }

    push();
    translate(opt.x, opt.y);

    stroke(200);
    strokeWeight(1.5);
    fill(255);
    if (opt.isDragging) {
      stroke(100);
      strokeWeight(2);
      drawingContext.shadowBlur = 12;
      drawingContext.shadowColor = 'rgba(0,0,0,0.15)';
    }
    rect(0, 0, opt.w, opt.h, 22);

    noStroke();
    textAlign(CENTER, CENTER);

    // 中文名稱
    fill(40);
    textSize(16);
    textStyle(BOLD);
    text(opt.data.name, opt.w * 0.38, opt.h / 2);

    // 英文名稱
    fill(120);
    textSize(13);
    textStyle(NORMAL);
    text(opt.data.en, opt.w * 0.72, opt.h / 2);

    pop();
  });
}

// 提示文字
function drawFooterText() {
  fill(120);
  textSize(13);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  text("按「重新開始」會重新洗牌再玩一次", 50, 742);
}

// 直接在 Canvas 內部繪製按鈕
function drawCanvasButtons() {
  // 1. 繳交答案 / 已交卷按鈕
  push();
  noStroke();
  if (submitted) {
    fill(224, 122, 95, 120);
  } else {
    fill(224, 122, 95);
  }
  rect(submitBtnArea.x, submitBtnArea.y, submitBtnArea.w, submitBtnArea.h, 8);

  fill(255);
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(submitted ? "已交卷" : "繳交答案", submitBtnArea.x + submitBtnArea.w / 2, submitBtnArea.y + submitBtnArea.h / 2);
  pop();

  // 2. 重新開始按鈕
  push();
  stroke(50);
  strokeWeight(2);
  fill(255);
  rect(resetBtnArea.x, resetBtnArea.y, resetBtnArea.w, resetBtnArea.h, 8);

  noStroke();
  fill(50);
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("重新開始", resetBtnArea.x + resetBtnArea.w / 2, resetBtnArea.y + resetBtnArea.h / 2);
  pop();
}

function isMouseInRect(r) {
  return mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h;
}

// 滑鼠互動事件
function mousePressed() {
  if (!submitted && isMouseInRect(submitBtnArea)) {
    submitAnswers();
    return;
  }

  if (isMouseInRect(resetBtnArea)) {
    restartGame();
    return;
  }

  if (submitted) return;

  for (let i = draggableOptions.length - 1; i >= 0; i--) {
    let opt = draggableOptions[i];
    if (mouseX >= opt.x && mouseX <= opt.x + opt.w &&
        mouseY >= opt.y && mouseY <= opt.y + opt.h) {
      
      draggingCard = opt;
      opt.isDragging = true;
      dragOffsetX = mouseX - opt.x;
      dragOffsetY = mouseY - opt.y;

      if (opt.placedInSlot) {
        opt.placedInSlot.occupiedBy = null;
        opt.placedInSlot = null;
      }

      draggableOptions.splice(i, 1);
      draggableOptions.push(opt);
      break;
    }
  }
}

function mouseDragged() {
  if (draggingCard) {
    draggingCard.x = mouseX - dragOffsetX;
    draggingCard.y = mouseY - dragOffsetY;
    draggingCard.targetX = draggingCard.x;
    draggingCard.targetY = draggingCard.y;
  }
}

function mouseReleased() {
  if (draggingCard) {
    let droppedInSlot = false;

    for (let card of weatherCards) {
      if (mouseX >= card.slotX && mouseX <= card.slotX + card.slotW &&
          mouseY >= card.slotY && mouseY <= card.slotY + card.slotH) {
        
        if (card.occupiedBy && card.occupiedBy !== draggingCard) {
          let prev = card.occupiedBy;
          prev.placedInSlot = null;
          prev.targetX = prev.homeX;
          prev.targetY = prev.homeY;
        }

        card.occupiedBy = draggingCard;
        draggingCard.placedInSlot = card;
        draggingCard.targetX = card.slotX;
        draggingCard.targetY = card.slotY;
        droppedInSlot = true;
        break;
      }
    }

    if (!droppedInSlot) {
      draggingCard.targetX = draggingCard.homeX;
      draggingCard.targetY = draggingCard.homeY;
    }

    draggingCard.isDragging = false;
    draggingCard = null;
  }
}

// 天氣動畫繪製邏輯（新增 foggy 起霧動畫）
function drawWeatherAnimation(type, w, h) {
  let t = frameCount * 0.05;

  if (type === 'sunny') {
    background(115, 185, 245);
    fill(130, 200, 90);
    rect(0, h - 30, w, 30);

    push();
    translate(w / 2, h / 2 - 10);
    fill(255, 210, 0);
    noStroke();
    circle(0, 0, 70);

    stroke(255, 210, 0);
    strokeWeight(4);
    for (let a = 0; a < TWO_PI; a += PI / 6) {
      let r1 = 45 + sin(t * 3) * 3;
      let r2 = 58 + sin(t * 3) * 3;
      line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
    }
    pop();

  } else if (type === 'cloudy') {
    background(155, 195, 230);
    fill(140, 190, 110);
    rect(0, h - 30, w, 30);

    fill(255, 215, 0);
    noStroke();
    circle(w * 0.7, h * 0.35, 55);

    drawCloud(w * 0.3 + sin(t) * 10, h * 0.5, 1.0, 255);
    drawCloud(w * 0.65 + cos(t * 0.8) * 8, h * 0.42, 0.85, 240);

  } else if (type === 'rainy') {
    background(90, 105, 120);
    fill(80, 85, 90);
    rect(0, h - 25, w, 25);

    drawCloud(w * 0.3, h * 0.3, 1.1, 120);
    drawCloud(w * 0.7, h * 0.32, 1.0, 100);

    stroke(180, 210, 255, 180);
    strokeWeight(2);
    for (let i = 0; i < 20; i++) {
      let rx = (i * 15 + frameCount * 3) % w;
      let ry = (h * 0.4 + (i * 17 + frameCount * 7) % (h * 0.55));
      line(rx, ry, rx - 4, ry + 12);
    }

  } else if (type === 'thunderstorm') {
    background(45, 48, 65);

    drawCloud(w * 0.35, h * 0.3, 1.2, 70);
    drawCloud(w * 0.68, h * 0.35, 1.1, 60);

    if (frameCount % 60 < 8) {
      fill(255, 255, 200, 150);
      rect(0, 0, w, h);

      stroke(255, 230, 50);
      strokeWeight(4);
      fill(255, 230, 50);
      beginShape();
      vertex(w * 0.5, h * 0.35);
      vertex(w * 0.42, h * 0.6);
      vertex(w * 0.48, h * 0.6);
      vertex(w * 0.4, h * 0.88);
      vertex(w * 0.56, h * 0.52);
      vertex(w * 0.5, h * 0.52);
      endShape(CLOSE);
    }

  } else if (type === 'snowy') {
    background(65, 80, 115);

    fill(240, 245, 255);
    noStroke();
    rect(0, h - 35, w, 35);
    circle(w * 0.8, h * 0.65, 30);
    circle(w * 0.8, h * 0.52, 22);

    for (let i = 0; i < 25; i++) {
      let sx = (i * 23 + sin(t + i) * 15) % w;
      let sy = (frameCount * (1 + i % 2) + i * 19) % h;
      fill(255, 255, 255, 220);
      circle(sx, sy, 3 + (i % 3) * 2);
    }

  } else if (type === 'windy') {
    background(155, 195, 225);
    fill(110, 170, 85);
    rect(0, h - 30, w, 30);

    push();
    translate(w * 0.3, h - 30);
    stroke(100, 60, 30);
    strokeWeight(12);
    line(0, 0, sin(t * 2) * 5 - 10, -55);

    noStroke();
    fill(60, 140, 60);
    circle(sin(t * 2) * 5 - 12, -70, 55);
    pop();

    stroke(255, 255, 255, 180);
    strokeWeight(2);
    noFill();
    for (let i = 0; i < 4; i++) {
      let wx = (-frameCount * 4 + i * 80) % (w + 100) - 20;
      let wy = 30 + i * 30;
      beginShape();
      curveVertex(wx, wy);
      curveVertex(wx + 30, wy + sin(t + i) * 5);
      curveVertex(wx + 70, wy + cos(t + i) * 8);
      curveVertex(wx + 100, wy);
      endShape();
    }

  } else if (type === 'foggy') {
    // 【起霧 Foggy 動畫】
    background(175, 185, 195);
    fill(120, 135, 120);
    rect(0, h - 30, w, 30);

    // 遠處隱約的山丘或樹影
    noStroke();
    fill(140, 150, 155, 180);
    ellipse(w * 0.3, h - 20, 180, 80);
    ellipse(w * 0.75, h - 20, 220, 100);

    // 飄動的厚重濃霧層
    noStroke();
    for (let i = 0; i < 5; i++) {
      let fogX = (sin(t * 0.5 + i) * 40) + w / 2;
      let fogY = 35 + i * 26;
      let alphaVal = 130 + sin(t + i) * 30;
      
      fill(240, 245, 250, alphaVal);
      rect(0, fogY, w, 18, 9);
    }
  }
}

function drawCloud(x, y, scaleFactor, gray) {
  push();
  translate(x, y);
  scale(scaleFactor);
  noStroke();
  fill(gray);
  circle(0, 0, 45);
  circle(-22, 8, 35);
  circle(22, 8, 35);
  rect(-22, 8, 44, 18);
  pop();
}