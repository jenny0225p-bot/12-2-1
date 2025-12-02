let stopSheet;
let walkSheet;
let attackSheet;
let askSheet;
let runSheet2;
let fallDownSheet2;
let imagesLoaded = false;

let charX, charY; // 用來儲存角色的位置
let char2X, char2Y; // 新增角色的位置
let facingDirection = 1; // 角色面向的方向：1 是右邊, -1 是左邊 
let char2FacingDirection = 1; // 角色2的面向：1 是右邊, -1 是左邊
let charState = 'idle'; // 角色狀態: 'idle', 'walking', 'attacking'
let attackFrameCounter = 0; // 攻擊動畫的計數器
let char2State = 'idle'; // 角色2的狀態: 'idle', 'running'
let hit2FrameCounter = 0; // 角色2受擊動畫的計數器

let nameInput; // 用來儲存 p5.dom 的輸入框元素
let dialogueState = 'none'; // 對話狀態: 'none', 'asking', 'answered', 'battle', 'victory_question'
let playerName = ''; // 用來儲存玩家輸入的名字
let score = 0; // 計分
let hasHitThisAttack = false; // 用來防止單次攻擊重複計分
let answeredFrame = 0; // 用來計時對話框的顯示

const moveSpeed = 4; // 角色移動速度

// 站立動畫的設定
const stopSpriteWidth = 880; // 站立圖片精靈的總寬度
const stopTotalFrames = 10;
const stopFrameH = 160; // 單一影格的高度

// 走路動畫的設定 (517px / 3 frames = 172.33px)
const walkTotalFrames = 3;
const walkSpriteWidth = 517; // 走路圖片精靈的總寬度
const walkFrameH = 156; // 走路動畫單一影格的高度

// 攻擊動畫的設定 (5275px / 12 frames)
const attackTotalFrames =15;
const attackSpriteWidth = 5275;
const attackFrameH = 198;

// 新增角色(ask)動畫的設定
const askTotalFrames = 12;
const askSpriteWidth = 2260;
const askFrameH = 175;

// 角色2(run)動畫的設定 - 請根據您的 run.png 檔案修改這些值
const run2TotalFrames = 4;
const run2SpriteWidth = 737;
const run2FrameH = 142;

// 角色2(fall-down)動畫的設定
const fallDown2TotalFrames = 5;
const fallDown2SpriteWidth = 1005;
const fallDown2FrameH = 223;

const scaleFactor = 2; // 放大倍率，可依喜好調整
const animSpeed = 4; // 動畫速度，數字越小動畫越快 (每 4 個 draw() 迴圈換一幀)

function preload() {
  // 使用載入成功/失敗回呼並把回傳的 img 指定回全域變數，確保取得正確的寬度/高度
  stopSheet = loadImage(
    '1/stop/stop.png',
    (img) => { stopSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 stop.png 失敗，請確認路徑：', '1/stop/stop.png', err); }
  );
  walkSheet = loadImage(
    '1/walk/walk.png',
    (img) => { walkSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 walk.png 失敗，請確認路徑：', '1/walk/walk.png', err); }
  );
  attackSheet = loadImage(
    '1/attrack/attrack.png',
    (img) => { attackSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 attrack.png 失敗，請確認路徑：', '1/attrack/attrack.png', err); }
  );
  askSheet = loadImage(
    '2/ask/ask.png',
    (img) => { askSheet = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 ask.png 失敗，請確認路徑：', '2/ask/ask.png', err); }
  );
  runSheet2 = loadImage(
    '2/run/run.png',
    (img) => { runSheet2 = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 run.png 失敗，請確認路徑：', '2/run/run.png', err); }
  );
  fallDownSheet2 = loadImage(
    '2/fall-down/fall-down.png',
    (img) => { fallDownSheet2 = img; checkAllImagesLoaded(); },
    (err) => { console.error('載入 fall-down.png 失敗，請確認路徑：', '2/fall-down/fall-down.png', err); }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth(); // 讓像素風格的圖片放大後保持清晰，不會模糊
  charX = width * 0.66; // 角色初始 X 位置
  charY = height / 2; // 角色初始 Y 位置
  char2X = width * 0.33; // 新角色初始 X 位置
  char2Y = height / 2; // 新角色初始 Y 位置

  // 創建輸入框並在初始時隱藏
  nameInput = createInput();
  nameInput.position(-width, -height); // 先移出畫面避免閃爍
  nameInput.size(150);
  nameInput.hide();
}

function checkAllImagesLoaded() {
  if (stopSheet?.width && walkSheet?.width && attackSheet?.width && askSheet?.width && runSheet2?.width && fallDownSheet2?.width) imagesLoaded = true;
}

function draw() {
  background('#d1b3c4');

  if (!imagesLoaded) {
    push();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('圖片尚未載入或路徑錯誤。請檢查 Console 的 404/Network。', width/2, height/2);
    pop();
    return;
  }

  // --- 角色1狀態管理 ---
  let currentSheet, frameW, frameH, totalFrames;

  // 如果正在攻擊，就不能被走路中斷
  if (charState !== 'attacking') {
    if (keyIsDown(RIGHT_ARROW) && !keyIsDown(LEFT_ARROW)) {
      charState = 'walking';
    } else if (keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) {
      charState = 'walking';
    } else {
      charState = 'idle';
    }
  }

  // 根據狀態設定動畫和行為
  if (charState === 'attacking') {
    currentSheet = attackSheet;
    frameW = Math.floor(attackSpriteWidth / attackTotalFrames);
    frameH = attackFrameH;
    totalFrames = attackTotalFrames;

    // 當動畫播放完畢
    if (attackFrameCounter >= totalFrames * animSpeed) {
      attackFrameCounter = 0; // 重置計數器給下一個動畫
      charState = 'idle'; // ***攻擊結束後，回到站立狀態***
    } else {
      attackFrameCounter++;
    }
  } else if (charState === 'walking') {
    if (keyIsDown(RIGHT_ARROW)) {
      currentSheet = walkSheet;
      frameW = Math.floor(walkSpriteWidth / walkTotalFrames);
      frameH = walkFrameH;
      totalFrames = walkTotalFrames;
      const halfCharWidth = (frameW * scaleFactor) / 2;
      if (charX < width - halfCharWidth) charX += moveSpeed;
      facingDirection = 1;
    } else if (keyIsDown(LEFT_ARROW)) {
      currentSheet = walkSheet;
      frameW = Math.floor(walkSpriteWidth / walkTotalFrames);
      frameH = walkFrameH;
      totalFrames = walkTotalFrames;
      const halfCharWidth = (frameW * scaleFactor) / 2;
      if (charX > halfCharWidth) charX -= moveSpeed;
      facingDirection = -1;
    }
  } else { // idle
    currentSheet = stopSheet;
    frameW = Math.floor(stopSpriteWidth / stopTotalFrames);
    frameH = stopFrameH;
    totalFrames = stopTotalFrames;
  }

  // --- 繪製分數 ---
  if (dialogueState === 'battle') {
    textSize(32);
    fill(0);
    text(`Score: ${score}`, 30, 40);
  }

  // --- 角色2狀態管理 ---
  // 'hit' 狀態有最高優先級，動畫播放完前不能被打斷
  if (char2State === 'hit') {
    if (hit2FrameCounter >= fallDown2TotalFrames * animSpeed) {
      hit2FrameCounter = 0;
      char2State = 'idle'; // 受擊動畫結束後，回到待機狀態
    } else {
      hit2FrameCounter++;
    }
  } else { // 只有在非受擊狀態下，才能移動或待機
    if (keyIsDown(68) && !keyIsDown(65)) { // 'D' key
      char2State = 'running';
      char2FacingDirection = 1;
      char2X += moveSpeed;
    } else if (keyIsDown(65) && !keyIsDown(68)) { // 'A' key
      char2State = 'running';
      char2FacingDirection = -1;
      char2X -= moveSpeed;
    } else {
      char2State = 'idle';
    }
  }

  // --- 繪製左邊的新角色 ---
  let char2Sheet, char2FrameW, char2TotalFrames, char2FrameH;
  let char2CurrentFrame;

  if (char2State === 'hit') {
    char2Sheet = fallDownSheet2;
    char2FrameW = Math.floor(fallDown2SpriteWidth / fallDown2TotalFrames);
    char2TotalFrames = fallDown2TotalFrames;
    char2FrameH = fallDown2FrameH;
    char2CurrentFrame = floor(hit2FrameCounter / animSpeed);
  } else if (char2State === 'running') {
    char2Sheet = runSheet2;
    char2FrameW = Math.floor(run2SpriteWidth / run2TotalFrames);
    char2TotalFrames = run2TotalFrames;
    char2FrameH = run2FrameH;
  } else {
    char2Sheet = askSheet;
    char2FrameW = Math.floor(askSpriteWidth / askTotalFrames);
    char2TotalFrames = askTotalFrames;
    char2FrameH = askFrameH;

    // 只有在待機時，才根據角色1的位置自動轉向
    if (charX < char2X) {
      char2FacingDirection = -1; // 角色1在左邊，角色2朝左
    } else {
      char2FacingDirection = 1; // 角色1在右邊，角色2朝右 (恢復原狀)
    }
  }

  // 如果不是受擊狀態，則使用通用的循環動畫計算方式
  if (char2State !== 'hit') {
    char2CurrentFrame = floor(frameCount / animSpeed) % char2TotalFrames;
  }
  const char2Sx = char2CurrentFrame * char2FrameW;
  const char2Sy = 0;

  push();
  translate(char2X, char2Y);
  scale(char2FacingDirection, 1); // 根據面向翻轉角色2
  image(
    char2Sheet,
    0, 0, // 因為已經 translate，所以在新原點 (0,0) 繪製
    char2FrameW * scaleFactor,
    char2FrameH * scaleFactor,
    char2Sx, char2Sy,
    char2FrameW, char2FrameH
  );
  pop();
  // --- 新角色繪製結束 ---

  // --- 檢查距離並顯示對話框 ---
  const proximityThreshold = 200; // 觸發對話框的距離
  const distance = abs(charX - char2X);

  // 勝利條件檢查
  if (dialogueState === 'battle' && score >= 5) {
    dialogueState = 'victory_question';
  }

  let textBoxText = '';

  if (distance < proximityThreshold) {
    if (dialogueState === 'none') {
      dialogueState = 'asking';
    }

    if (dialogueState === 'asking') {
      textBoxText = '你叫什麼名字';
      // 顯示並定位輸入框在角色1頭上
      nameInput.position(charX - nameInput.width / 2, charY - (frameH * scaleFactor) / 2 - 40);
      nameInput.show();
    } else if (dialogueState === 'answered') {
      textBoxText = `${playerName}，久仰大名，來戰鬥吧!你贏了我就回答你的問題`;
      nameInput.hide(); // 確保輸入框被隱藏

      // 在顯示完回答後，等待約3秒 (180幀) 後進入戰鬥狀態
      if (frameCount > answeredFrame + 180) {
        dialogueState = 'battle';
      }
    } else if (dialogueState === 'victory_question') {
      textBoxText = '甘拜下風，你有什麼問題儘管問吧';
      // 顯示並定位輸入框在角色1頭上
      nameInput.position(charX - nameInput.width / 2, charY - (frameH * scaleFactor) / 2 - 40);
      nameInput.show();
    }

    // 根據狀態繪製對話框
    if (textBoxText) {
      // 對話框Y軸偏移量，使其出現在角色2頭頂上方
      const textYOffset = - (char2FrameH * scaleFactor) / 2 - 30; 
      
      push();
      translate(char2X, char2Y); 
      
      textSize(18);
      textAlign(CENTER, CENTER);
      const textW = textWidth(textBoxText);
      const boxPadding = 10;
      const boxW = textW + boxPadding * 2;
      const boxH = 35;

      fill(255, 255, 255, 220);
      stroke(0);
      rect(-boxW / 2, textYOffset - boxH / 2, boxW, boxH, 8);
      fill(0);
      noStroke();
      text(textBoxText, 0, textYOffset);
      pop();
    }

  } else {
    // 如果角色遠離，重置對話狀態並隱藏輸入框
    // 只有在非戰鬥、非勝利提問的狀態下遠離，才完全重置
    if (dialogueState !== 'battle' && dialogueState !== 'victory_question') {
      dialogueState = 'none';
      score = 0; // 分數只在此時重置
      playerName = '';
    }
    nameInput.hide();
  }

  // 計算當前影格
  let currentFrame;
  if (charState === 'attacking') {
    // 讓攻擊動畫的每一幀都按順序播放，這樣角色和技能特效會一起出現並成長
    currentFrame = floor(attackFrameCounter / animSpeed);
  } else {
    currentFrame = floor(frameCount / animSpeed) % totalFrames;
  }
  const sx = currentFrame * frameW;
  const sy = 0;

  // 計算攻擊時的 Y 軸位移
  let yOffset = 0;
  if (charState === 'attacking') {
    // 使用 sin 函式製造一個從 0 -> 峰值 -> 0 的平滑上下移動曲線
    const currentAttackFrame = floor(attackFrameCounter / animSpeed);

    // 當動畫在第 9 幀到第 15 幀時 (索引 8 到 14)，讓角色移動
    if (currentAttackFrame >= 8 && currentAttackFrame < 15) {
      const attackMoveSpeed = moveSpeed * 1.5; // 攻擊時的移動速度可以快一點
      const halfCharWidth = (frameW * scaleFactor) / 2;

      if (facingDirection === 1 && charX < width - halfCharWidth) { // 向右移動
        charX += attackMoveSpeed;
      } else if (facingDirection === -1 && charX > halfCharWidth) { // 向左移動
        charX -= attackMoveSpeed;
      }

      // 在攻擊有效幀內進行碰撞檢測
      const hitDistance = abs(charX - char2X);
      const hitThreshold = (frameW * scaleFactor) / 2 + (char2FrameW * scaleFactor) / 2; // 兩個角色寬度的一半
      
      if (hitDistance < hitThreshold && !hasHitThisAttack && dialogueState === 'battle') {
        score++;
        char2State = 'hit'; // 將角色2狀態設為受擊
        hit2FrameCounter = 0; // 重置受擊動畫計數器
        hasHitThisAttack = true; // 標記本次攻擊已計分
      }
    }

    const attackProgress = (attackFrameCounter / (totalFrames * animSpeed)); // 0.0 ~ 1.0
    yOffset = -sin(attackProgress * PI) * 30; // 向上移動最多 30 像素
  }

  push(); // 儲存目前的繪圖狀態
  translate(charX, charY + yOffset); // 將畫布原點移動到角色的位置 (包含Y軸位移)
  scale(facingDirection, 1); // 根據面向的方向翻轉畫布 (x軸)

  image(
    currentSheet,
    0, 0, // 因為已經 translate，所以在新原點 (0,0) 繪製
    frameW * scaleFactor,
    frameH * scaleFactor,
    sx, sy,
    frameW, frameH
  );

  pop(); // 恢復原本的繪圖狀態
}

function keyPressed() {
  // 當按下空白鍵且角色不在攻擊狀態時，開始攻擊
  if (key === ' ' && charState !== 'attacking') {
    charState = 'attacking';
    attackFrameCounter = 0; // 重置攻擊動畫計數器
    hasHitThisAttack = false; // 重置攻擊計分標記
  }

  // 當玩家在輸入框中按下 Enter 鍵
  if (keyCode === ENTER && dialogueState === 'asking') {
    playerName = nameInput.value();
    if (playerName.trim() !== '') { // 確保玩家有輸入內容
      dialogueState = 'answered';
      answeredFrame = frameCount; // 記錄當前幀數
      nameInput.value(''); // 清空輸入框
    }
  } else if (keyCode === ENTER && dialogueState === 'victory_question') {
    // 勝利提問後按下 Enter 的邏輯 (目前是清空並隱藏輸入框)
    nameInput.value('');
    nameInput.hide();
    dialogueState = 'none'; // 可以重置狀態或進入下一個階段
  }
}

function windowResized() {
  // 當瀏覽器視窗大小改變時，自動調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
  // 避免角色在視窗縮放後位置跑掉，可以選擇是否要重置位置
  // charX = width / 2;
}
