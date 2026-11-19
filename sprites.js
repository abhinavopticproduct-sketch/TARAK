/**
 * Jalebi-Fafda Morning Rush — Sprite & Visuals Engine
 * TMKOC Inspired HTML5 Canvas Web Game
 * 
 * Maps all 6 original SVGs from ./photos/ with strict relative paths and exact case:
 * 1. Happy Jethalal  -> ./photos/tarak-happpy.svg
 * 2. Sad Jethalal    -> ./photos/sad.svg
 * 3. Jalebi          -> ./photos/jalebi.svg
 * 4. Faluda          -> ./photos/faluda.svg
 * 5. Babita          -> ./photos/babita.svg
 * 6. Chappal         -> ./photos/chapal.svg
 * 
 * Auto-generates vector visuals:
 * - Gokuldham Society morning compound background
 * - Jethalal's shiny steel thali (plate) with dynamic catch bounce
 * - Masala Chai (+25 bonus) with rising steam
 * - Karela Juice (-1 Life hazard) with bitter gourd & stink lines
 * - Sundarlal's Taxi Bill (-30 hazard) pink envelope
 * - Babita power-up pink heart sticker badge & Jetha blush/hearts aura
 * - Crisp Canvas vector fallbacks for all sprites
 */

(function (window) {
  'use strict';

  // Strict relative paths with exact case-sensitive matching on disk
  const SPRITE_CONFIG = {
    happyJetha: {
      path: encodeURI('./photos/tarak-happpy.svg'),
      crop: { x: 412, y: 174, w: 616, h: 462 },
      aspect: 616 / 462
    },
    sadJetha: {
      path: encodeURI('./photos/sad.svg'),
      crop: { x: 227, y: 127, w: 987, h: 555 },
      aspect: 987 / 555
    },
    jalebi: {
      path: encodeURI('./photos/jalebi.svg'),
      crop: { x: 474, y: 159, w: 492, h: 492 },
      aspect: 1
    },
    faluda: {
      path: encodeURI('./photos/faluda.svg'),
      crop: { x: 382, y: 179, w: 676, h: 452 },
      aspect: 676 / 452
    },
    babita: {
      path: encodeURI('./photos/babita.svg'),
      crop: { x: 548, y: 177, w: 344, h: 456 },
      aspect: 344 / 456
    },
    chapal: {
      path: encodeURI('./photos/chapal.svg'),
      crop: { x: 507, y: 192, w: 426, h: 426 },
      aspect: 1
    }
  };

  const sprites = {
    images: {},
    cropped: {},
    loaded: {},
    allLoaded: false
  };

  /**
   * Pre-load and create cropped offscreen canvases for sharp, margin-free rendering
   */
  function initSprites(onComplete) {
    const keys = Object.keys(SPRITE_CONFIG);
    let loadedCount = 0;
    const total = keys.length;

    keys.forEach(key => {
      const cfg = SPRITE_CONFIG[key];
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        sprites.images[key] = img;
        sprites.loaded[key] = true;

        // Create high-res offscreen canvas cropped tightly around the graphic
        try {
          const natW = img.naturalWidth || 1440;
          const natH = img.naturalHeight || 810;
          const scaleX = natW / 1440;
          const scaleY = natH / 810;

          const sx = cfg.crop.x * scaleX;
          const sy = cfg.crop.y * scaleY;
          const sw = cfg.crop.w * scaleX;
          const sh = cfg.crop.h * scaleY;

          // Target crisp resolution
          const targetW = Math.max(256, Math.round(cfg.crop.w * 0.5));
          const targetH = Math.max(256, Math.round(cfg.crop.h * 0.5));

          const off = document.createElement('canvas');
          off.width = targetW;
          off.height = targetH;
          const offCtx = off.getContext('2d');
          offCtx.imageSmoothingEnabled = true;
          offCtx.imageSmoothingQuality = 'high';

          offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
          sprites.cropped[key] = off;
        } catch (e) {
          // If security or canvas error, use raw image
          sprites.cropped[key] = img;
        }

        loadedCount++;
        if (loadedCount === total) {
          sprites.allLoaded = true;
          if (typeof onComplete === 'function') onComplete();
        }
      };

      img.onerror = () => {
        // Silent vector fallback is ready if any image fails
        sprites.loaded[key] = false;
        loadedCount++;
        if (loadedCount === total) {
          sprites.allLoaded = true;
          if (typeof onComplete === 'function') onComplete();
        }
      };

      img.src = cfg.path;
    });
  }

  // Kick off preload immediately
  if (typeof window !== 'undefined') {
    initSprites();
  }

  // ==========================================
  // SPRITE DRAWING HELPERS WITH VECTOR FALLBACKS
  // ==========================================

  /**
   * Draw Jethalal player character
   */
  function drawPlayerJetha(ctx, x, y, width, height, state = 'happy', babitaActive = false, animTime = 0) {
    const isSad = (state === 'sad');
    const spriteKey = isSad ? 'sadJetha' : 'happyJetha';
    const croppedCanvas = sprites.cropped[spriteKey];

    ctx.save();

    // Babita blessing glow around Jetha
    if (babitaActive) {
      ctx.shadowColor = '#ff6b81';
      ctx.shadowBlur = 18 + Math.sin(animTime * 6) * 6;
    }

    if (croppedCanvas && sprites.loaded[spriteKey]) {
      ctx.drawImage(croppedCanvas, x - width / 2, y - height / 2, width, height);
    } else {
      // High-quality cartoon vector fallback
      drawFallbackJetha(ctx, x, y, width, height, isSad);
    }

    // Floating hearts & rosy blush during Babita power-up
    if (babitaActive && !isSad) {
      drawBabitaAura(ctx, x, y, width, height, animTime);
    }

    ctx.restore();
  }

  /**
   * Shiny Indian Stainless Steel Thali (Plate)
   * Held by Jethalal, bounces dynamically with spring offset on catch
   */
  function drawSteelPlate(ctx, x, y, width, bounceOffset = 0) {
    ctx.save();
    const plateY = y + bounceOffset;
    const plateWidth = width * 1.05;
    const plateHeight = plateWidth * 0.32;

    ctx.translate(x, plateY);

    // Subtle drop shadow under the plate
    ctx.beginPath();
    ctx.ellipse(0, plateHeight * 0.45, plateWidth * 0.48, plateHeight * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

    // Outer steel rim (metallic gradient)
    const rimGrad = ctx.createLinearGradient(-plateWidth / 2, -plateHeight / 2, plateWidth / 2, plateHeight / 2);
    rimGrad.addColorStop(0, '#e0e0e0');
    rimGrad.addColorStop(0.2, '#ffffff');
    rimGrad.addColorStop(0.5, '#b0b8c0');
    rimGrad.addColorStop(0.8, '#d4d8dd');
    rimGrad.addColorStop(1, '#8e969d');

    ctx.beginPath();
    ctx.ellipse(0, 0, plateWidth / 2, plateHeight / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#5a626a';
    ctx.stroke();

    // Inner plate surface
    const innerGrad = ctx.createRadialGradient(0, -plateHeight * 0.1, 2, 0, 0, plateWidth * 0.42);
    innerGrad.addColorStop(0, '#f5f7f9');
    innerGrad.addColorStop(0.65, '#d0d5dc');
    innerGrad.addColorStop(1, '#9aa1aa');

    ctx.beginPath();
    ctx.ellipse(0, 0, plateWidth * 0.43, plateHeight * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Concentric lathe rings on traditional Indian thali
    ctx.beginPath();
    ctx.ellipse(0, 0, plateWidth * 0.30, plateHeight * 0.29, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Specular diagonal light glint
    ctx.beginPath();
    ctx.ellipse(-plateWidth * 0.18, -plateHeight * 0.15, plateWidth * 0.14, plateHeight * 0.08, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Jalebi Collectible (+10 pts)
   */
  function drawJalebi(ctx, x, y, size) {
    ctx.save();
    const croppedCanvas = sprites.cropped.jalebi;
    if (croppedCanvas && sprites.loaded.jalebi) {
      ctx.drawImage(croppedCanvas, x - size / 2, y - size / 2, size, size);
    } else {
      drawFallbackJalebi(ctx, x, y, size);
    }
    ctx.restore();
  }

  /**
   * Faluda Collectible (+15 pts)
   */
  function drawFaluda(ctx, x, y, width, height) {
    ctx.save();
    const croppedCanvas = sprites.cropped.faluda;
    if (croppedCanvas && sprites.loaded.faluda) {
      ctx.drawImage(croppedCanvas, x - width / 2, y - height / 2, width, height);
    } else {
      drawFallbackFaluda(ctx, x, y, width, height);
    }
    ctx.restore();
  }

  /**
   * Babita Power-Up Item
   * Render inside a cute glowing pink heart/circle sticker badge so it stands out while falling
   */
  function drawBabitaBadge(ctx, x, y, size, animTime = 0) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = 1 + Math.sin(animTime * 6) * 0.08;
    ctx.scale(pulse, pulse);

    // Glowing pink/golden outer ring
    ctx.shadowColor = '#ff477e';
    ctx.shadowBlur = 14;

    // Outer sticker border
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.54, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Inner glossy pink badge background
    const bgGrad = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    bgGrad.addColorStop(0, '#ff9a9e');
    bgGrad.addColorStop(0.5, '#fecfef');
    bgGrad.addColorStop(1, '#ff6b81');
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.49, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ff3366';
    ctx.stroke();

    // Babita portrait
    const croppedCanvas = sprites.cropped.babita;
    if (croppedCanvas && sprites.loaded.babita) {
      const portW = size * 0.72;
      const portH = size * 0.76;
      ctx.drawImage(croppedCanvas, -portW / 2, -portH / 2, portW, portH);
    } else {
      drawFallbackBabita(ctx, 0, 0, size * 0.75);
    }

    // Little heart badge at the top-right corner
    ctx.shadowBlur = 0;
    drawMiniHeart(ctx, size * 0.36, -size * 0.36, size * 0.22, '#ff1493');

    // "BABITA JI" cute banner text at badge bottom
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(-size * 0.45, size * 0.30, size * 0.90, size * 0.20, 6);
    ctx.fill();
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `bold ${Math.round(size * 0.12)}px 'Arial', sans-serif`;
    ctx.fillStyle = '#d63031';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖 BABITA JI', 0, size * 0.40);

    ctx.restore();
  }

  /**
   * Chappal Hazard (-1 Life)
   */
  function drawChappal(ctx, x, y, width, height, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);

    const croppedCanvas = sprites.cropped.chapal;
    if (croppedCanvas && sprites.loaded.chapal) {
      ctx.drawImage(croppedCanvas, -width / 2, -height / 2, width, height);
    } else {
      drawFallbackChapal(ctx, 0, 0, width, height);
    }

    ctx.restore();
  }

  /**
   * Masala Chai (+25 pts bonus collectible with rising steam)
   */
  function drawMasalaChai(ctx, x, y, size, animTime = 0) {
    ctx.save();
    ctx.translate(x, y);

    const w = size * 0.72;
    const h = size * 0.88;

    // Saucer / Plate at bottom
    ctx.beginPath();
    ctx.ellipse(0, h * 0.45, w * 0.65, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d8d8d8';
    ctx.fill();
    ctx.strokeStyle = '#b0b0b0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cutting Chai Glass (tapered)
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -h * 0.25);
    ctx.lineTo(w * 0.35, -h * 0.25);
    ctx.lineTo(w * 0.26, h * 0.38);
    ctx.lineTo(-w * 0.26, h * 0.38);
    ctx.closePath();

    // Glass translucency
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.stroke();

    // Spiced Masala Chai Liquid
    const teaGrad = ctx.createLinearGradient(0, -h * 0.15, 0, h * 0.36);
    teaGrad.addColorStop(0, '#e67e22');
    teaGrad.addColorStop(0.3, '#d35400');
    teaGrad.addColorStop(1, '#8e44ad'); // deep cardamon/caramel tone

    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.10);
    ctx.lineTo(w * 0.32, -h * 0.10);
    ctx.lineTo(w * 0.25, h * 0.36);
    ctx.lineTo(-w * 0.25, h * 0.36);
    ctx.closePath();
    ctx.fillStyle = teaGrad;
    ctx.fill();

    // Milky foam froth on tea top
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.10, w * 0.31, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fce4cb';
    ctx.fill();

    // Fluted glass vertical ridges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    for (let offset of [-0.18, 0, 0.18]) {
      ctx.beginPath();
      ctx.moveTo(w * offset, -h * 0.20);
      ctx.lineTo(w * offset * 0.8, h * 0.34);
      ctx.stroke();
    }

    // Rising animated steam swirls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const steamPhase = animTime * 3 + i * 1.5;
      const sx = i * (w * 0.16);
      const sy = -h * 0.28;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        sx + Math.sin(steamPhase) * 6, sy - h * 0.12,
        sx - Math.sin(steamPhase) * 6, sy - h * 0.24,
        sx + Math.cos(steamPhase) * 4, sy - h * 0.38
      );
      ctx.stroke();
    }

    // Gold sparkle badge "+25"
    ctx.font = `bold ${Math.round(size * 0.20)}px sans-serif`;
    ctx.fillStyle = '#f39c12';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText('✨+25', 0, -h * 0.44);

    ctx.restore();
  }

  /**
   * Karela Juice (-1 Life hazard, green glass with bitter gourd slice and stink lines)
   */
  function drawKarelaJuice(ctx, x, y, size, animTime = 0) {
    ctx.save();
    ctx.translate(x, y);

    const w = size * 0.68;
    const h = size * 0.86;

    // Toxic noxious glow
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 8;

    // Glass shape
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.22);
    ctx.lineTo(w * 0.32, -h * 0.22);
    ctx.lineTo(w * 0.22, h * 0.38);
    ctx.lineTo(-w * 0.22, h * 0.38);
    ctx.closePath();

    const juiceGrad = ctx.createLinearGradient(0, -h * 0.2, 0, h * 0.38);
    juiceGrad.addColorStop(0, '#27ae60');
    juiceGrad.addColorStop(0.5, '#1e8449');
    juiceGrad.addColorStop(1, '#145a32');
    ctx.fillStyle = juiceGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#52be80';
    ctx.stroke();

    // Floating bubbles
    ctx.fillStyle = '#a9dfbf';
    for (let i = 0; i < 3; i++) {
      const bY = h * 0.2 - ((animTime * 40 + i * 18) % (h * 0.4));
      const bX = (i - 1) * w * 0.12;
      ctx.beginPath();
      ctx.arc(bX, bY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Karela (Bitter Gourd) round slice perched on the glass rim
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.translate(w * 0.28, -h * 0.22);
    ctx.rotate(-0.35);

    // Dark green jagged rim
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.20, 0, Math.PI * 2);
    ctx.fillStyle = '#196f3d';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#145a32';
    ctx.stroke();

    // Pale green center with seeds
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = '#d5f5e3';
    ctx.fill();

    // Bitter seeds
    ctx.fillStyle = '#27ae60';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * w * 0.07, Math.sin(a) * w * 0.07, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Green wavy stink lines at the top
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const phase = animTime * 4 + i * 2;
      const sx = i * (w * 0.16);
      const sy = -h * 0.28;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        sx + Math.sin(phase) * 5, sy - h * 0.10,
        sx - Math.sin(phase) * 5, sy - h * 0.20,
        sx + Math.cos(phase) * 4, sy - h * 0.32
      );
      ctx.stroke();
    }

    // Skull / Hazard text "YUCK!"
    ctx.font = `bold ${Math.round(size * 0.18)}px sans-serif`;
    ctx.fillStyle = '#e74c3c';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.textAlign = 'center';
    ctx.fillText('🤢 -1 LIFE', 0, -h * 0.38);

    ctx.restore();
  }

  /**
   * Sundarlal's Taxi Bill (-30 pts hazard, pink receipt/envelope)
   */
  function drawTaxiBill(ctx, x, y, size, animTime = 0) {
    ctx.save();
    ctx.translate(x, y);

    const wobble = Math.sin(animTime * 5) * 0.15;
    ctx.rotate(wobble);

    const w = size * 0.88;
    const h = size * 0.62;

    // Soft paper shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Pink receipt envelope
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 4);
    ctx.fillStyle = '#ffb8b8';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e84118';
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Envelope flap fold line
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(0, h * 0.05);
    ctx.lineTo(w / 2, -h / 2);
    ctx.strokeStyle = '#e84118';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red rubber stamp "SUNDAR TAXI ₹5000"
    ctx.save();
    ctx.rotate(-0.15);
    ctx.fillStyle = '#c23616';
    ctx.font = `bold ${Math.round(size * 0.13)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('TAXI BILL', 0, -h * 0.02);
    ctx.font = `bold ${Math.round(size * 0.18)}px sans-serif`;
    ctx.fillText('₹ 5,000', 0, h * 0.26);

    ctx.strokeStyle = '#c23616';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-w * 0.38, -h * 0.18, w * 0.76, h * 0.52);
    ctx.restore();

    // "-30 pts" floating tag
    ctx.font = `bold ${Math.round(size * 0.17)}px sans-serif`;
    ctx.fillStyle = '#e84118';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 3;
    ctx.textAlign = 'center';
    ctx.fillText('-30 PTS', 0, -h * 0.44);

    ctx.restore();
  }

  /**
   * Babita Power-Up Aura around Happy Jethalal
   * Floating pink rose petals, rosy cheeks, and sparkling heart aura
   */
  function drawBabitaAura(ctx, x, y, width, height, animTime) {
    ctx.save();

    // Rosy pink blush cheeks on Jethalal
    ctx.fillStyle = 'rgba(255, 107, 129, 0.65)';
    ctx.beginPath();
    ctx.ellipse(x - width * 0.18, y - height * 0.06, width * 0.10, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x + width * 0.18, y - height * 0.06, width * 0.10, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting floating hearts
    for (let i = 0; i < 4; i++) {
      const angle = animTime * 2.5 + (i * Math.PI / 2);
      const hx = x + Math.cos(angle) * (width * 0.58);
      const hy = y - height * 0.25 + Math.sin(angle * 1.5) * (height * 0.28);
      const heartSize = 14 + Math.sin(animTime * 6 + i) * 3;
      drawMiniHeart(ctx, hx, hy, heartSize, '#ff3366');
    }

    // Floating pink rose petals
    for (let i = 0; i < 3; i++) {
      const px = x + Math.sin(animTime * 3 + i * 2) * (width * 0.45);
      const py = y + height * 0.35 - ((animTime * 60 + i * 35) % (height * 1.1));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(animTime * 2 + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw mini vector heart helper
   */
  function drawMiniHeart(ctx, hx, hy, size, color) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.fillStyle = color;
    ctx.beginPath();
    const d = size / 2;
    ctx.moveTo(0, d * 0.4);
    ctx.bezierCurveTo(-d, -d * 0.5, -d * 1.1, d * 0.5, 0, d * 1.1);
    ctx.bezierCurveTo(d * 1.1, d * 0.5, d, -d * 0.5, 0, d * 0.4);
    ctx.fill();
    ctx.restore();
  }

  // ==========================================
  // GOKULDHAM SOCIETY MORNING BACKGROUND
  // ==========================================

  /**
   * Complete Gokuldham Society Compound Canvas Art
   * Features:
   * - Pastel A/B/C wings with balconies and windows
   * - Society Name Banner "GOKULDHAM CO-OP HOUSING SOCIETY"
   * - Warm rising sun and morning rays
   * - Drifting fluffy morning clouds
   * - Compound paved courtyard with decorative trees
   */
  function drawGokuldhamBackground(ctx, width, height, time = 0) {
    ctx.save();

    // 1. Warm morning sunrise sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#74b9ff');     // Soft morning blue
    skyGrad.addColorStop(0.38, '#ffeaa7');  // Golden warm sunlight
    skyGrad.addColorStop(0.65, '#fab1a0');  // Peach sunrise horizon
    skyGrad.addColorStop(1, '#dfe6e9');     // Ground reflection
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Rising Morning Sun with soft pulsing rays
    const sunX = width * 0.82;
    const sunY = height * 0.16;
    const sunR = width * 0.11;

    // Sun corona rays
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(time * 0.15);
    for (let r = 0; r < 12; r++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-sunR * 0.15, -sunR * 1.65);
      ctx.lineTo(sunR * 0.15, -sunR * 1.65);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 234, 167, 0.18)';
      ctx.fill();
    }
    ctx.restore();

    // Sun disc
    const sunGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.4, '#fff9e6');
    sunGrad.addColorStop(1, 'rgba(255, 204, 0, 0.45)');
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // 3. Drifting Fluffy Morning Clouds
    drawDriftingCloud(ctx, (width * 0.15 + time * 12) % (width + 160) - 80, height * 0.08, width * 0.24);
    drawDriftingCloud(ctx, (width * 0.65 + time * 8) % (width + 200) - 100, height * 0.14, width * 0.32);
    drawDriftingCloud(ctx, (width * 0.35 + time * 10) % (width + 180) - 90, height * 0.22, width * 0.22);

    // 4. Distant Gokuldham Wings (A-Wing, B-Wing, C-Wing)
    const groundY = height * 0.76;
    const bldgTop = height * 0.32;
    const bldgHeight = groundY - bldgTop;

    // Wing A (Left - Pastel Peach)
    drawSocietyWing(ctx, width * 0.02, bldgTop, width * 0.30, bldgHeight, '#f8a5c2', '#e77f9f', 'A-WING');

    // Wing B (Center - Warm Cream / Yellow)
    drawSocietyWing(ctx, width * 0.35, bldgTop - height * 0.03, width * 0.30, bldgHeight + height * 0.03, '#ffeaa7', '#fdcb6e', 'B-WING');

    // Wing C (Right - Soft Mint Green)
    drawSocietyWing(ctx, width * 0.68, bldgTop + height * 0.01, width * 0.30, bldgHeight - height * 0.01, '#81ecec', '#00cec9', 'C-WING');

    // 5. Society Archway / Main Entrance Signboard
    const archW = width * 0.88;
    const archH = height * 0.075;
    const archX = (width - archW) / 2;
    const archY = groundY - height * 0.15;

    // Arch Pillars
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(archX, archY, width * 0.06, height * 0.15);
    ctx.fillRect(archX + archW - width * 0.06, archY, width * 0.06, height * 0.15);

    // Arch Board with Red TMKOC Heritage Styling
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.roundRect(archX, archY, archW, archH, 8);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Society Name Text
    ctx.font = `bold ${Math.max(11, Math.round(width * 0.036))}px 'Arial', sans-serif`;
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ GOKULDHAM CO-OP HOUSING SOCIETY ★', width / 2, archY + archH * 0.36);

    ctx.font = `italic ${Math.max(9, Math.round(width * 0.024))}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Powai, Mumbai • Sunday Morning Breakfast Rush', width / 2, archY + archH * 0.74);

    // 6. Compound Paved Ground
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#636e72');
    groundGrad.addColorStop(0.35, '#535c68');
    groundGrad.addColorStop(1, '#2d3436');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Compound cobblestone pavers pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1.5;
    const rowH = (height - groundY) / 7;
    for (let r = 0; r < 7; r++) {
      const py = groundY + r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      const offset = (r % 2) * (width * 0.08);
      for (let px = offset; px < width; px += width * 0.16) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + rowH);
        ctx.stroke();
      }
    }

    // 7. Decorative Society Greenery (Ashoka trees along wall)
    drawAshokaTree(ctx, width * 0.05, groundY, height * 0.18);
    drawAshokaTree(ctx, width * 0.95, groundY, height * 0.18);

    ctx.restore();
  }

  /**
   * Draw single society building wing with balconies and windows
   */
  function drawSocietyWing(ctx, x, y, w, h, wallColor, trimColor, wingLabel) {
    ctx.save();

    // Building Wall
    ctx.fillStyle = wallColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Wing Label on Top
    ctx.fillStyle = trimColor;
    ctx.fillRect(x, y, w, h * 0.08);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(9, Math.round(w * 0.13))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(wingLabel, x + w / 2, y + h * 0.06);

    // 3 Floors with Balconies & Windows
    const floors = 3;
    const floorH = (h * 0.88) / floors;
    for (let f = 0; f < floors; f++) {
      const fy = y + h * 0.10 + f * floorH;

      // Window pair
      const winW = w * 0.28;
      const winH = floorH * 0.45;
      const winY = fy + floorH * 0.10;

      // Left Window
      ctx.fillStyle = '#74b9ff';
      ctx.fillRect(x + w * 0.14, winY, winW, winH);
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + w * 0.14, winY, winW, winH);

      // Right Window
      ctx.fillRect(x + w * 0.58, winY, winW, winH);
      ctx.strokeRect(x + w * 0.58, winY, winW, winH);

      // Balcony Railing
      const balcY = fy + floorH * 0.60;
      const balcH = floorH * 0.35;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + w * 0.08, balcY, w * 0.84, balcH);
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + w * 0.08, balcY, w * 0.84, balcH);

      // Balcony vertical bars
      for (let bx = x + w * 0.15; bx < x + w * 0.85; bx += w * 0.12) {
        ctx.beginPath();
        ctx.moveTo(bx, balcY);
        ctx.lineTo(bx, balcY + balcH);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Draw cloud helper
   */
  function drawDriftingCloud(ctx, cx, cy, csize) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(cx, cy, csize * 0.28, 0, Math.PI * 2);
    ctx.arc(cx + csize * 0.22, cy - csize * 0.12, csize * 0.32, 0, Math.PI * 2);
    ctx.arc(cx + csize * 0.48, cy, csize * 0.24, 0, Math.PI * 2);
    ctx.arc(cx + csize * 0.24, cy + csize * 0.08, csize * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw Indian Ashoka conical tree helper
   */
  function drawAshokaTree(ctx, tx, groundY, treeH) {
    ctx.save();
    // Trunk
    ctx.fillStyle = '#795548';
    ctx.fillRect(tx - 3, groundY - treeH * 0.25, 6, treeH * 0.25);

    // Conical foliage
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(tx, groundY - treeH);
    ctx.lineTo(tx + 16, groundY - treeH * 0.22);
    ctx.lineTo(tx - 16, groundY - treeH * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ==========================================
  // VECTOR FALLBACK DRAWERS (Zero-Crash Guarantee)
  // ==========================================

  function drawFallbackJetha(ctx, x, y, width, height, isSad) {
    ctx.save();
    ctx.translate(x, y);

    // Body / Colorful TMKOC Shirt
    ctx.fillStyle = isSad ? '#636e72' : '#e67e22';
    ctx.beginPath();
    ctx.roundRect(-width * 0.4, 0, width * 0.8, height * 0.5, [12, 12, 0, 0]);
    ctx.fill();

    // Shirt collar & colorful pattern
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(-width * 0.15, 0);
    ctx.lineTo(0, height * 0.2);
    ctx.lineTo(width * 0.15, 0);
    ctx.fill();

    // Head / Face
    ctx.fillStyle = '#ffcf96';
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.16, width * 0.32, height * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hair / Bald on sides with classic Jetha cut
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.36, width * 0.30, height * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Tilak
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-2, -height * 0.34, 4, 8);

    // Eyes
    ctx.fillStyle = '#2d3436';
    if (isSad) {
      // Shocked/sad wide eyes
      ctx.beginPath();
      ctx.arc(-width * 0.12, -height * 0.18, 5, 0, Math.PI * 2);
      ctx.arc(width * 0.12, -height * 0.18, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cheerful smiling eyes
      ctx.beginPath();
      ctx.arc(-width * 0.12, -height * 0.18, 3.5, 0, Math.PI * 2);
      ctx.arc(width * 0.12, -height * 0.18, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Iconic Thick Jethalal Mustache
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.ellipse(-width * 0.08, -height * 0.08, width * 0.12, height * 0.05, -0.2, 0, Math.PI * 2);
    ctx.ellipse(width * 0.08, -height * 0.08, width * 0.12, height * 0.05, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    if (isSad) {
      ctx.arc(0, -height * 0.02, width * 0.12, Math.PI, 0, false);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.arc(0, -height * 0.06, width * 0.12, 0, Math.PI, false);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFallbackJalebi(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing golden syrup shadow
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 8;

    // Golden spiral coils of crispy Jalebi
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = size * 0.13;
    ctx.lineCap = 'round';

    ctx.beginPath();
    const turns = 2.8;
    for (let a = 0; a < Math.PI * 2 * turns; a += 0.15) {
      const r = (a / (Math.PI * 2 * turns)) * (size * 0.38);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Hot sugar syrup glaze highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    ctx.restore();
  }

  function drawFallbackFaluda(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);

    const w = width * 0.55;
    const h = height * 0.75;

    // Tall dessert glass
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -h * 0.35);
    ctx.lineTo(w * 0.4, -h * 0.35);
    ctx.lineTo(w * 0.25, h * 0.35);
    ctx.lineTo(-w * 0.25, h * 0.35);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rose syrup bottom layer
    ctx.fillStyle = '#e84393';
    ctx.fillRect(-w * 0.24, h * 0.15, w * 0.48, h * 0.20);

    // Faluda vermicelli / sweet cream middle
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(-w * 0.30, -h * 0.12, w * 0.60, h * 0.27);

    // Kulfi ice cream scoop on top
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath();
    ctx.arc(0, -h * 0.35, w * 0.35, Math.PI, 0);
    ctx.fill();

    // Red glazed cherry
    ctx.fillStyle = '#d63031';
    ctx.beginPath();
    ctx.arc(0, -h * 0.45, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFallbackBabita(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Soft feminine face vector
    ctx.fillStyle = '#ffcf96';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Glossy brown styled hair
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.2, size * 0.40, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gentle smiling eyes & red bindi
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, -size * 0.12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(0, size * 0.14, size * 0.12, 0, Math.PI, false);
    ctx.fill();

    ctx.restore();
  }

  function drawFallbackChapal(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);

    const w = width * 0.45;
    const h = height * 0.75;

    // Classic blue hawai chappal sole
    ctx.fillStyle = '#0984e3';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, [w * 0.4, w * 0.4, w * 0.3, w * 0.3]);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // V-shaped rubber straps
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.15);
    ctx.lineTo(-w * 0.4, h * 0.15);
    ctx.moveTo(0, -h * 0.15);
    ctx.lineTo(w * 0.4, h * 0.15);
    ctx.stroke();

    ctx.restore();
  }

  // Export engine globally
  window.GameSprites = {
    sprites,
    initSprites,
    drawPlayerJetha,
    drawSteelPlate,
    drawJalebi,
    drawFaluda,
    drawBabitaBadge,
    drawChappal,
    drawMasalaChai,
    drawKarelaJuice,
    drawTaxiBill,
    drawGokuldhamBackground
  };

})(typeof window !== 'undefined' ? window : this);
