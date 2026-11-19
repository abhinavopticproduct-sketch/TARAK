/**
 * Jalebi-Fafda Morning Rush — Core Game Engine
 * TMKOC Inspired HTML5 Canvas Web Game
 * 
 * Ready for GitHub and static deployment on Vercel.
 */

/* ==============================================================================
   GAME CONFIGURATION (Easily Editable)
   ============================================================================== */
const GAME_CONFIG = {
  recipientName: "Archana",
  targetScore: 500,
  noticeTitle: "GOKULDHAM SOCIETY — SPECIAL NOTICE",
  suvichar: "Aaj ka Suvichar: Some people are even sweeter than Sunday morning Jalebi-Fafda.",
  personalMessage: "Archana, you bring more sweetness, warmth, and smiles into every single day than a fresh Sunday plate of crispy hot Jalebi-Fafda. Thank you for being so wonderfully special!",
  signedBy: "— Ekameva Secretary, Aatmaram Tukaram Bhide & All of Gokuldham"
};

(function () {
  'use strict';

  // Game States
  const STATES = {
    START: 'START',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    FINALE_MODAL: 'FINALE_MODAL',
    GAMEOVER: 'GAMEOVER'
  };

  let gameState = STATES.START;
  let score = 0;
  let bestScore = 0;
  let lives = 3;
  let hasWonFinale = false; // Triggered once per session when reaching targetScore

  // Timing & Animation
  let lastTime = 0;
  let animTime = 0;
  let spawnTimer = 0;
  let babitaTimer = 0; // Active countdown in seconds (0 = inactive)
  const BABITA_DURATION = 6.0;

  // Screen shake
  let screenShakeTimer = 0;
  let screenShakeMagnitude = 0;

  // DOM Elements
  const container = document.getElementById('gameContainer');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const confettiCtx = confettiCanvas.getContext('2d');

  // HUD Elements
  const hudScore = document.getElementById('hudScore');
  const hudBest = document.getElementById('hudBest');
  const hudLives = document.getElementById('hudLives');
  const muteBtn = document.getElementById('muteBtn');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressLabel = document.getElementById('progressLabel');
  const babitaHudBanner = document.getElementById('babitaHudBanner');
  const babitaTimerFill = document.getElementById('babitaTimerFill');
  const chappalWarningBanner = document.getElementById('chappalWarningBanner');

  // Modals
  const startScreen = document.getElementById('startScreen');
  const startBtn = document.getElementById('startBtn');
  const noticeBoardModal = document.getElementById('noticeBoardModal');
  const modalNoticeTitle = document.getElementById('modalNoticeTitle');
  const modalSuvichar = document.getElementById('modalSuvichar');
  const modalRecipient = document.getElementById('modalRecipient');
  const modalPersonalMessage = document.getElementById('modalPersonalMessage');
  const modalSignedBy = document.getElementById('modalSignedBy');
  const continueEndlessBtn = document.getElementById('continueEndlessBtn');
  const noticePlayAgainBtn = document.getElementById('noticePlayAgainBtn');
  const gameOverModal = document.getElementById('gameOverModal');
  const finalScoreVal = document.getElementById('finalScoreVal');
  const bestScoreVal = document.getElementById('bestScoreVal');
  const retryBtn = document.getElementById('retryBtn');

  // Logical Resolution (Virtual Canvas Size)
  let viewWidth = 400;
  let viewHeight = 700;
  let dpr = 1;

  // Player Character
  const player = {
    x: 200,
    y: 580,
    targetX: 200,
    width: 90,
    height: 110,
    state: 'happy', // 'happy' or 'sad'
    sadTimer: 0,
    plateBounce: 0,
    plateVelocity: 0
  };

  // Falling Items Pool
  let items = [];

  // Floating Text Popups
  let popups = [];

  // Confetti Particles
  let confettiParticles = [];
  let confettiActive = false;

  // Pending Chappal Warnings (0.6s alert before drop)
  let chappalWarnings = [];

  // ==========================================
  // INITIALIZATION & RESIZE
  // ==========================================

  function init() {
    // Load best score from localStorage
    try {
      bestScore = parseInt(localStorage.getItem('tmkoc_jalebi_rush_best') || '0', 10);
    } catch (e) {
      bestScore = 0;
    }
    updateHud();

    // Populate Notice Board content from GAME_CONFIG
    populateNoticeBoard();

    // Handle responsive canvas sizing
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Bind Controls
    bindControls();

    // Start Animation Loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);

    // Testing & Preview URL query parameters:
    // ?autostart=1 -> auto start gameplay
    // ?preview=1   -> preview 500-pt Notice Board immediately
    // ?gameover=1  -> preview Game Over screen
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('preview') === '1') {
        setTimeout(previewNoticeBoard, 150);
      } else if (urlParams.get('autostart') === '1') {
        setTimeout(startGame, 150);
      } else if (urlParams.get('gameover') === '1') {
        setTimeout(() => {
          startGame();
          triggerGameOver();
        }, 150);
      }
    } catch (e) {}
  }

  function populateNoticeBoard() {
    if (modalNoticeTitle) modalNoticeTitle.textContent = GAME_CONFIG.noticeTitle;
    if (modalSuvichar) modalSuvichar.textContent = GAME_CONFIG.suvichar;
    if (modalRecipient) modalRecipient.textContent = `Dear ${GAME_CONFIG.recipientName},`;
    if (modalPersonalMessage) modalPersonalMessage.textContent = GAME_CONFIG.personalMessage;
    if (modalSignedBy) modalSignedBy.textContent = GAME_CONFIG.signedBy;
  }

  function handleResize() {
    const rect = container.getBoundingClientRect();
    viewWidth = Math.round(rect.width);
    viewHeight = Math.round(rect.height);
    dpr = window.devicePixelRatio || 1;

    // Primary Game Canvas
    canvas.width = viewWidth * dpr;
    canvas.height = viewHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Confetti Canvas
    confettiCanvas.width = viewWidth * dpr;
    confettiCanvas.height = viewHeight * dpr;
    confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Reposition Player to ground level
    player.y = viewHeight * 0.82;
    player.width = Math.min(100, Math.max(75, viewWidth * 0.22));
    player.height = player.width * 1.22;
    player.targetX = Math.max(player.width / 2, Math.min(viewWidth - player.width / 2, player.x));
    player.x = player.targetX;
  }

  // ==========================================
  // INPUT HANDLING (Mobile Touch & Desktop Keys)
  // ==========================================

  function bindControls() {
    let isDragging = false;

    function updateTargetPosition(clientX) {
      const rect = container.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const minX = player.width * 0.45;
      const maxX = viewWidth - player.width * 0.45;
      player.targetX = Math.max(minX, Math.min(maxX, relativeX));
    }

    // Pointer events on container
    container.addEventListener('pointerdown', (e) => {
      if (gameState === STATES.PLAYING) {
        isDragging = true;
        updateTargetPosition(e.clientX);
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (isDragging && gameState === STATES.PLAYING) {
        updateTargetPosition(e.clientX);
      }
    });

    window.addEventListener('pointerup', () => { isDragging = false; });
    window.addEventListener('pointercancel', () => { isDragging = false; });

    // Touch events fallback with preventDefault to stop scroll/zoom
    container.addEventListener('touchmove', (e) => {
      if (gameState === STATES.PLAYING && e.touches.length > 0) {
        e.preventDefault();
        updateTargetPosition(e.touches[0].clientX);
      }
    }, { passive: false });

    // Desktop Keyboard Controls (Left/Right Arrow & A/D)
    window.addEventListener('keydown', (e) => {
      // Shift + W shortcut to preview 500-pt Notice Board anytime
      if (e.shiftKey && (e.key === 'W' || e.key === 'w')) {
        e.preventDefault();
        previewNoticeBoard();
        return;
      }

      if (gameState !== STATES.PLAYING) return;

      const step = 45;
      const minX = player.width * 0.45;
      const maxX = viewWidth - player.width * 0.45;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.targetX = Math.max(minX, player.targetX - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.targetX = Math.min(maxX, player.targetX + step);
      }
    });

    // Button Bindings
    startBtn.addEventListener('click', startGame);
    retryBtn.addEventListener('click', restartGame);
    continueEndlessBtn.addEventListener('click', continueEndless);
    noticePlayAgainBtn.addEventListener('click', restartGame);

    muteBtn.addEventListener('click', () => {
      const muted = window.GameAudio.toggleMute();
      muteBtn.textContent = muted ? '🔇' : '🔊';
    });
  }

  // ==========================================
  // GAME LIFECYCLE
  // ==========================================

  function startGame() {
    // Unlock Mobile AudioContext on first tap
    window.GameAudio.unlockAudio();

    // Reset game parameters
    score = 0;
    lives = 3;
    hasWonFinale = false;
    items = [];
    popups = [];
    chappalWarnings = [];
    babitaTimer = 0;
    spawnTimer = 0.90; // Trigger first breakfast item immediately!
    gameState = STATES.PLAYING;

    // Hide Start Screen
    startScreen.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    noticeBoardModal.classList.add('hidden');
    babitaHudBanner.style.display = 'none';
    chappalWarningBanner.style.display = 'none';

    // Start background score
    window.GameAudio.playSocietyBgm();
    updateHud();
  }

  function restartGame() {
    window.GameAudio.stopAllAudio();
    stopConfetti();
    startGame();
  }

  function triggerGameOver() {
    gameState = STATES.GAMEOVER;
    window.GameAudio.stopAllAudio();

    // Save High Score
    if (score > bestScore) {
      bestScore = score;
      try {
        localStorage.setItem('tmkoc_jalebi_rush_best', bestScore.toString());
      } catch (e) {}
    }

    finalScoreVal.textContent = score;
    bestScoreVal.textContent = bestScore;
    updateHud();

    // Show Game Over modal
    gameOverModal.classList.remove('hidden');
  }

  /**
   * 500-Point Finale Gift Celebration
   */
  function triggerFinaleNotice() {
    hasWonFinale = true;
    gameState = STATES.FINALE_MODAL;

    // Pause Babita music if active
    window.GameAudio.stopBabitaBgm(false);
    window.GameAudio.pauseSocietyBgm();

    // Play Victory Celebration Fanfare & Confetti
    window.GameAudio.playWinFanfare();
    startConfetti();

    // Open Notice Board Modal
    noticeBoardModal.classList.remove('hidden');
  }

  /**
   * Continue Endless Mode after viewing 500-Point Notice Board
   */
  function continueEndless() {
    noticeBoardModal.classList.add('hidden');
    stopConfetti();
    gameState = STATES.PLAYING;

    // Resume Society BGM
    window.GameAudio.playSocietyBgm();
  }

  /**
   * Shift + W shortcut to preview the Notice Board modal
   */
  function previewNoticeBoard() {
    if (gameState === STATES.FINALE_MODAL) {
      noticeBoardModal.classList.add('hidden');
      stopConfetti();
      gameState = STATES.PLAYING;
    } else {
      gameState = STATES.FINALE_MODAL;
      populateNoticeBoard();
      startConfetti();
      noticeBoardModal.classList.remove('hidden');
    }
  }

  // ==========================================
  // HUD & PROGRESS UPDATER
  // ==========================================

  function updateHud() {
    hudScore.textContent = score;
    hudBest.textContent = `BEST: ${bestScore}`;

    // Hearts string
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += (i < lives) ? '❤️' : '🖤';
    }
    hudLives.textContent = hearts;

    // 500-Point Progress Bar
    const target = GAME_CONFIG.targetScore || 500;
    const pct = Math.min(100, Math.max(0, (score / target) * 100));
    progressBarFill.style.width = `${pct}%`;
    progressLabel.textContent = `GOAL: ${target}`;
  }

  // ==========================================
  // SPAWNING SYSTEM
  // ==========================================

  function updateSpawning(dt) {
    spawnTimer += dt;

    // Difficulty curve: relaxed (0.95s) at 0–199 pts; drops down to 0.65s at 200+ pts
    let spawnInterval = 0.95;
    if (score >= 200) {
      const difficultyFactor = Math.min(1, (score - 200) / 300);
      spawnInterval = 0.95 - (difficultyFactor * 0.30); // 0.95s -> 0.65s
    }

    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnRandomItem();
    }
  }

  function spawnRandomItem() {
    // Column margin
    const margin = 40;
    const spawnX = margin + Math.random() * (viewWidth - margin * 2);

    // Speed progression:
    // 0-199 pts: base speed ~170-220 px/s
    // 200+ pts: base speed ~240-360 px/s
    let baseSpeed = 180 + Math.random() * 40;
    if (score >= 200) {
      const boost = Math.min(150, (score - 200) * 0.4);
      baseSpeed += boost;
    }

    // Rare Babita Power-Up check (only 1 on screen at a time, ~6% chance)
    const hasBabitaFalling = items.some(it => it.type === 'babita');
    if (!hasBabitaFalling && babitaTimer <= 0 && Math.random() < 0.07) {
      items.push({
        type: 'babita',
        x: spawnX,
        y: -40,
        size: Math.min(54, viewWidth * 0.13),
        speed: baseSpeed * 0.85
      });
      return;
    }

    // Chappal Hazard check (Only spawns at score >= 200 with 0.6s red ! warning)
    if (score >= 200 && Math.random() < 0.22) {
      // Create a pending Chappal warning at top
      chappalWarnings.push({
        x: spawnX,
        timer: 0.60, // 0.6s warning
        speed: baseSpeed * 1.35 // Chappals fall fast!
      });
      // Play subtle warning alert
      window.GameAudio.playWarningAlert();
      showChappalBanner();
      return;
    }

    // Regular collectible & hazard pool
    const rand = Math.random();
    if (rand < 0.44) {
      // Jalebi (+10)
      items.push({
        type: 'jalebi',
        x: spawnX,
        y: -35,
        size: Math.min(48, viewWidth * 0.12),
        speed: baseSpeed
      });
    } else if (rand < 0.68) {
      // Faluda (+15)
      items.push({
        type: 'faluda',
        x: spawnX,
        y: -40,
        width: Math.min(46, viewWidth * 0.11),
        height: Math.min(54, viewWidth * 0.13),
        speed: baseSpeed * 0.95
      });
    } else if (rand < 0.82) {
      // Masala Chai (+25 bonus)
      items.push({
        type: 'chai',
        x: spawnX,
        y: -40,
        size: Math.min(46, viewWidth * 0.11),
        speed: baseSpeed * 1.05
      });
    } else if (rand < 0.93) {
      // Karela Juice (-1 Life hazard)
      items.push({
        type: 'karela',
        x: spawnX,
        y: -40,
        size: Math.min(48, viewWidth * 0.12),
        speed: baseSpeed * 0.92
      });
    } else {
      // Sundarlal's Taxi Bill (-30 pts hazard)
      items.push({
        type: 'taxibill',
        x: spawnX,
        y: -35,
        size: Math.min(50, viewWidth * 0.12),
        speed: baseSpeed * 0.90
      });
    }
  }

  function showChappalBanner() {
    chappalWarningBanner.style.display = 'flex';
  }

  function hideChappalBanner() {
    chappalWarningBanner.style.display = 'none';
  }

  // ==========================================
  // GAME UPDATE LOOP
  // ==========================================

  function update(dt) {
    animTime += dt;

    // 1. Player Movement Lerp Smoothing (0.22 lerp)
    player.x += (player.targetX - player.x) * 0.22;

    // Player expression reset
    if (player.sadTimer > 0) {
      player.sadTimer -= dt;
      if (player.sadTimer <= 0) {
        player.state = 'happy';
      }
    }

    // Plate bounce spring physics
    player.plateBounce += player.plateVelocity * dt * 60;
    player.plateVelocity -= player.plateBounce * 0.28; // Spring tension
    player.plateVelocity *= 0.82; // Damping

    // 2. Babita Power-Up Countdown
    if (babitaTimer > 0) {
      babitaTimer -= dt;
      babitaHudBanner.style.display = 'flex';
      const pct = Math.max(0, (babitaTimer / BABITA_DURATION) * 100);
      babitaTimerFill.style.width = `${pct}%`;

      if (babitaTimer <= 0) {
        babitaTimer = 0;
        babitaHudBanner.style.display = 'none';
        window.GameAudio.stopBabitaBgm(true); // Stop Babita music, resume society BGM
      }
    }

    // 3. Screen Shake Decay
    if (screenShakeTimer > 0) {
      screenShakeTimer -= dt;
    }

    // 4. Update Pending Chappal Warnings (0.6s flashing alert)
    for (let i = chappalWarnings.length - 1; i >= 0; i--) {
      const warn = chappalWarnings[i];
      warn.timer -= dt;
      if (warn.timer <= 0) {
        // Spawn actual fast Chappal
        items.push({
          type: 'chapal',
          x: warn.x,
          y: -40,
          width: Math.min(48, viewWidth * 0.12),
          height: Math.min(52, viewWidth * 0.13),
          speed: warn.speed,
          rot: (Math.random() - 0.5) * 0.5
        });
        chappalWarnings.splice(i, 1);
      }
    }
    if (chappalWarnings.length === 0) {
      hideChappalBanner();
    }

    // 5. Update Falling Items
    // During Babita Power-Up: 40% slower fall speed
    const speedMultiplier = (babitaTimer > 0) ? 0.60 : 1.0;
    const scoreMultiplier = (babitaTimer > 0) ? 2 : 1;

    // Steel Plate Catch Collision Zone (held at waist/chest level below Jetha's smiling face)
    const plateY = player.y + player.height * 0.22 + player.plateBounce;
    const plateW = player.width * 1.08;
    const catchRadiusX = plateW * 0.55;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.y += item.speed * speedMultiplier * dt;

      // Check collision with Jethalal's plate
      const itemSize = item.size || item.height || 40;
      const isNearY = (item.y + itemSize * 0.4 >= plateY - 12 && item.y - itemSize * 0.4 <= plateY + 16);
      const isNearX = Math.abs(item.x - player.x) < catchRadiusX;

      if (isNearY && isNearX) {
        // Collision Triggered!
        handleCatch(item, scoreMultiplier);
        items.splice(i, 1);
        continue;
      }

      // Despawn if fallen past bottom
      if (item.y > viewHeight + 60) {
        items.splice(i, 1);
      }
    }

    // 6. Update Floating Text Popups
    for (let p = popups.length - 1; p >= 0; p--) {
      const popup = popups[p];
      popup.life -= dt;
      popup.y -= 45 * dt; // Float upward
      if (popup.life <= 0) {
        popups.splice(p, 1);
      }
    }

    // 7. Check 500-Point Finale
    if (!hasWonFinale && score >= (GAME_CONFIG.targetScore || 500)) {
      triggerFinaleNotice();
    }
  }

  // ==========================================
  // CATCH & COLLISION HANDLER
  // ==========================================

  function handleCatch(item, multiplier) {
    // Bounce plate down on catch
    player.plateVelocity = 7.5;

    switch (item.type) {
      case 'jalebi': {
        const pts = 10 * multiplier;
        score += pts;
        window.GameAudio.playCatchChime(false);
        addPopup(item.x, item.y, multiplier > 1 ? `2x! +${pts}` : `+${pts}`, '#2ecc71');
        break;
      }

      case 'faluda': {
        const pts = 15 * multiplier;
        score += pts;
        window.GameAudio.playCatchChime(true);
        addPopup(item.x, item.y, multiplier > 1 ? `2x! +${pts}` : `+${pts}`, '#00cec9');
        break;
      }

      case 'chai': {
        const pts = 25 * multiplier;
        score += pts;
        window.GameAudio.playChaiBonus();
        addPopup(item.x, item.y, multiplier > 1 ? `2x! +${pts} CHAI` : `+${pts} CHAI`, '#f39c12');
        break;
      }

      case 'babita': {
        // Activate Babita Power-Up!
        babitaTimer = BABITA_DURATION;
        window.GameAudio.startBabitaBgm();
        addPopup(item.x, item.y, '💖 GOOD MORNING BABITA JI!', '#ff477e');
        break;
      }

      case 'karela': {
        // Hazard: -1 Life
        lives--;
        triggerDamageEffect('🤢 YUCK! -1 LIFE');
        break;
      }

      case 'chapal': {
        // Fast Hazard: -1 Life
        lives--;
        triggerDamageEffect('💥 CHAPPAL! -1 LIFE');
        break;
      }

      case 'taxibill': {
        // Penalty: -30 pts
        score = Math.max(0, score - 30);
        window.GameAudio.playTaxiDrain();
        addPopup(item.x, item.y, '-30 PTS TAXI', '#e84118');
        break;
      }
    }

    // Update best score tracker
    if (score > bestScore) {
      bestScore = score;
    }
    updateHud();

    // Game Over Check
    if (lives <= 0) {
      triggerGameOver();
    }
  }

  function triggerDamageEffect(popupText) {
    player.state = 'sad';
    player.sadTimer = 0.65; // Sad face for 650ms
    screenShakeTimer = 0.25;
    screenShakeMagnitude = 10;

    // Play Jethalal Goat scream
    window.GameAudio.playDamageSound();
    addPopup(player.x, player.y - player.height * 0.3, popupText, '#e74c3c');
  }

  function addPopup(x, y, text, color) {
    popups.push({
      x,
      y,
      text,
      color,
      life: 0.85,
      maxLife: 0.85
    });
  }

  // ==========================================
  // RENDERING ENGINE
  // ==========================================

  function render() {
    ctx.save();

    // 1. Screen Shake Transform
    if (screenShakeTimer > 0) {
      const sx = (Math.random() - 0.5) * screenShakeMagnitude;
      const sy = (Math.random() - 0.5) * screenShakeMagnitude;
      ctx.translate(sx, sy);
    }

    // 2. Draw Gokuldham Society Morning Background
    window.GameSprites.drawGokuldhamBackground(ctx, viewWidth, viewHeight, animTime);

    // 3. Babita Power-Up Golden/Pink Border Glow
    if (babitaTimer > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 107, 129, ${0.4 + Math.sin(animTime * 6) * 0.25})`;
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, viewWidth, viewHeight);

      // Inner subtle gold border
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, viewWidth - 12, viewHeight - 12);
      ctx.restore();
    }

    // 4. Draw Pending Chappal Warning Indicators at top edge
    chappalWarnings.forEach(warn => {
      ctx.save();
      ctx.translate(warn.x, 24);
      const pulse = 1 + Math.sin(animTime * 20) * 0.2;
      ctx.scale(pulse, pulse);

      // Flashing Red Alert Triangle & !
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(14, 12);
      ctx.lineTo(-14, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 2);

      // Red downward warning laser line
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(0, viewHeight * 0.7);
      ctx.stroke();

      ctx.restore();
    });

    // 5. Draw Falling Items
    items.forEach(item => {
      switch (item.type) {
        case 'jalebi':
          window.GameSprites.drawJalebi(ctx, item.x, item.y, item.size);
          break;
        case 'faluda':
          window.GameSprites.drawFaluda(ctx, item.x, item.y, item.width, item.height);
          break;
        case 'chai':
          window.GameSprites.drawMasalaChai(ctx, item.x, item.y, item.size, animTime);
          break;
        case 'babita':
          window.GameSprites.drawBabitaBadge(ctx, item.x, item.y, item.size, animTime);
          break;
        case 'karela':
          window.GameSprites.drawKarelaJuice(ctx, item.x, item.y, item.size, animTime);
          break;
        case 'chapal':
          window.GameSprites.drawChappal(ctx, item.x, item.y, item.width, item.height, item.rot || 0);
          break;
        case 'taxibill':
          window.GameSprites.drawTaxiBill(ctx, item.x, item.y, item.size, animTime);
          break;
      }
    });

    // 6. Draw Player Jethalal & Shiny Steel Thali
    const isBabita = (babitaTimer > 0);
    window.GameSprites.drawPlayerJetha(
      ctx,
      player.x,
      player.y,
      player.width,
      player.height,
      player.state,
      isBabita,
      animTime
    );

    // Shiny Steel Plate held by Jetha's hands in front of his waist/kurta
    const plateY = player.y + player.height * 0.22;
    window.GameSprites.drawSteelPlate(ctx, player.x, plateY, player.width, player.plateBounce);

    // 7. Draw Floating Text Popups
    popups.forEach(pop => {
      ctx.save();
      const alpha = Math.max(0, pop.life / pop.maxLife);
      const scale = 1 + (1 - alpha) * 0.3;

      ctx.translate(pop.x, pop.y);
      ctx.scale(scale, scale);

      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = pop.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 6;
      ctx.globalAlpha = alpha;
      ctx.fillText(pop.text, 0, 0);

      ctx.restore();
    });

    ctx.restore();
  }

  // ==========================================
  // CONFETTI PARTICLE SYSTEM (500-pt Finale)
  // ==========================================

  function startConfetti() {
    confettiActive = true;
    confettiParticles = [];
    const colors = ['#f1c40f', '#e67e22', '#e74c3c', '#2ecc71', '#3498db', '#ff6b81', '#ffffff'];

    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: Math.random() * viewWidth,
        y: -10 - Math.random() * viewHeight * 0.5,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  function stopConfetti() {
    confettiActive = false;
    confettiParticles = [];
    confettiCtx.clearRect(0, 0, viewWidth, viewHeight);
  }

  function updateAndRenderConfetti(dt) {
    if (!confettiActive && confettiParticles.length === 0) return;

    confettiCtx.clearRect(0, 0, viewWidth, viewHeight);

    for (let i = 0; i < confettiParticles.length; i++) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;

      // Wrap around edges
      if (p.y > viewHeight + 20) {
        p.y = -10;
        p.x = Math.random() * viewWidth;
      }

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }
  }

  // ==========================================
  // MAIN ANIMATION LOOP
  // ==========================================

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === STATES.PLAYING) {
      updateSpawning(dt);
      update(dt);
    }

    render();

    // Render Confetti if active
    if (confettiActive) {
      updateAndRenderConfetti(dt);
    }

    requestAnimationFrame(gameLoop);
  }

  // Kick off initialization on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
