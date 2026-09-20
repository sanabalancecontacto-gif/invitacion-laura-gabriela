/* ==========================================================================
   Invitación Pool Party - Laura (4º Cumpleaños)
   Game Engine: Crisp Crystal Ice, Preloaded Memory Popups, Clean Canvas
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const introScreen = document.getElementById('introScreen');
    const gameScreen = document.getElementById('gameScreen');
    const inviteScreen = document.getElementById('inviteScreen');

    const btnStartGame = document.getElementById('btnStartGame');
    const btnSkipToInvite = document.getElementById('btnSkipToInvite');
    const btnFastForward = document.getElementById('btnFastForward');
    const btnReplayGame = document.getElementById('btnReplayGame');

    const barInner = document.getElementById('barInner');
    const progressPercent = document.getElementById('progressPercent');
    const photosCount = document.getElementById('photosCount');
    const touchGuide = document.getElementById('touchGuide');

    const memoryPopup = document.getElementById('memoryPopup');
    const memoryPopupImg = document.getElementById('memoryPopupImg');
    const btnClosePopup = document.getElementById('btnClosePopup');
    const galleryScroll = document.getElementById('galleryScroll');

    // --- ALL 13 MEMORY PHOTOS LIST (NO REPETITIONS) ---
    const memoryPhotos = [
        './assets/photos/Imagen de Codex 19 sept 2026, 12_22_19 p.m..png',
        './assets/photos/Imagen de Codex 19 sept 2026, 12_29_57 p.m..png',
        './assets/photos/WhatsApp Image 2026-09-06 at 11.27.38 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-06 at 11.27.38 jj.jpeg',
        './assets/photos/WhatsApp Image 2026-09-19 at 12.09.15 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-19 at 12.16.35 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.38.57 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.39.52 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.39.53 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.39.54 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-ggg.jpeg',
        './assets/photos/gfgd.jpeg',
        './assets/photos/gfgfd.jpeg'
    ];

    // Preload memory photos in browser memory
    const preloadedImageCache = {};
    memoryPhotos.forEach(src => {
        const img = new Image();
        img.src = src;
        preloadedImageCache[src] = img;
    });

    let unlockedPhotos = [];
    let isGamePaused = false; // Pause ball when photo popup is open!

    // --- SOUND EFFECTS (Web Audio API) ---
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playIceSound(type) {
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            if (type === 'bounce') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'break') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'photo') {
                const notes = [659.25, 830.61, 987.77, 1318.51];
                notes.forEach((freq, idx) => {
                    const pOsc = audioCtx.createOscillator();
                    const pGain = audioCtx.createGain();
                    pOsc.type = 'sine';
                    pOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    pGain.gain.setValueAtTime(0.3, now + idx * 0.08);
                    pGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
                    pOsc.connect(pGain);
                    pGain.connect(audioCtx.destination);
                    pOsc.start(now + idx * 0.08);
                    pOsc.stop(now + idx * 0.08 + 0.3);
                });
            } else if (type === 'win') {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const noteOsc = audioCtx.createOscillator();
                    const noteGain = audioCtx.createGain();
                    noteOsc.type = 'sine';
                    noteOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
                    noteGain.gain.setValueAtTime(0.3, now + idx * 0.12);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4);
                    noteOsc.connect(noteGain);
                    noteGain.connect(audioCtx.destination);
                    noteOsc.start(now + idx * 0.12);
                    noteOsc.stop(now + idx * 0.12 + 0.4);
                });
            }
        } catch (e) {
            console.log('Audio disabled or blocked:', e);
        }
    }


    // --- TRANSPARENT BACKGROUND HELPER ---
    function makeTransparentCanvas(img, threshold = 35) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.naturalWidth || img.width;
        offCanvas.height = img.naturalHeight || img.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(img, 0, 0);

        try {
            const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r < threshold && g < threshold && b < threshold) {
                    data[i + 3] = 0;
                }
            }
            offCtx.putImageData(imgData, 0, 0);
        } catch (e) {
            console.log('Canvas image keying note:', e);
        }
        return offCanvas;
    }


    // --- BACKGROUND SNOWFALL ENGINE ---
    const snowCanvas = document.getElementById('snowCanvas');
    const snowCtx = snowCanvas.getContext('2d');
    let snowflakes = [];

    function resizeSnowCanvas() {
        snowCanvas.width = window.innerWidth;
        snowCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeSnowCanvas);
    resizeSnowCanvas();

    function createSnowflakes() {
        snowflakes = [];
        const count = Math.floor(window.innerWidth / 12);
        for (let i = 0; i < count; i++) {
            snowflakes.push({
                x: Math.random() * snowCanvas.width,
                y: Math.random() * snowCanvas.height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 1.5 + 0.5,
                wind: Math.random() * 0.5 - 0.25,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }
    createSnowflakes();

    function drawSnow() {
        snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
        snowCtx.fillStyle = '#ffffff';
        snowflakes.forEach(flake => {
            snowCtx.beginPath();
            snowCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            snowCtx.globalAlpha = flake.opacity;
            snowCtx.fill();

            flake.y += flake.speed;
            flake.x += flake.wind;

            if (flake.y > snowCanvas.height) {
                flake.y = -10;
                flake.x = Math.random() * snowCanvas.width;
            }
        });
        requestAnimationFrame(drawSnow);
    }
    drawSnow();


    // --- SCREEN NAVIGATION & POPUPS ---
    function showScreen(screenToShow) {
        [introScreen, gameScreen, inviteScreen].forEach(screen => {
            screen.classList.remove('active');
        });
        screenToShow.classList.add('active');

        if (screenToShow === inviteScreen) {
            populateInviteGallery();
        }
    }

    function populateInviteGallery() {
        galleryScroll.innerHTML = '';
        memoryPhotos.forEach(photoSrc => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${photoSrc}" alt="Recuerdo de Laura">`;
            item.addEventListener('click', () => {
                showMemoryPopup(photoSrc);
            });
            galleryScroll.appendChild(item);
        });
    }

    let popupTimeout = null;

    function showMemoryPopup(photoSrc) {
        // PAUSE THE BALL SO IT DOES NOT CONTINUE BOUNCING OR TRIGGERING OTHER POPUPS!
        isGamePaused = true;

        memoryPopupImg.src = '';
        memoryPopupImg.src = photoSrc;
        
        memoryPopup.classList.add('active');
        playIceSound('photo');

        if (popupTimeout) clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
            closeMemoryPopup();
        }, 2600);
    }

    function closeMemoryPopup() {
        if (popupTimeout) clearTimeout(popupTimeout);
        memoryPopup.classList.remove('active');
        // RESUME THE GAME BALL MOVEMENT!
        isGamePaused = false;
    }

    btnClosePopup.addEventListener('click', closeMemoryPopup);

    memoryPopup.addEventListener('click', (e) => {
        if (e.target === memoryPopup || e.target.classList.contains('polaroid-card')) {
            closeMemoryPopup();
        }
    });

    btnStartGame.addEventListener('click', () => {
        initAudio();
        showScreen(gameScreen);
        initGame();
    });

    btnSkipToInvite.addEventListener('click', () => {
        initAudio();
        showScreen(inviteScreen);
        triggerConfetti();
    });

    btnFastForward.addEventListener('click', () => {
        stopGame();
        playIceSound('win');
        showScreen(inviteScreen);
        triggerConfetti();
    });

    btnReplayGame.addEventListener('click', () => {
        showScreen(gameScreen);
        initGame();
    });


    // --- GAME ENGINE ---
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');

    // Clean Aurora Background
    const bgImg = new Image();
    bgImg.src = './assets/clean_frozen_bg.png';

    // Snowball Sprite
    const snowballRaw = new Image();
    snowballRaw.src = './assets/Fluffy_white_snowball_with_ice_20260919111321.jpeg';

    // Glowing 3D Crystal Ice Block
    const icebergRaw = new Image();
    icebergRaw.src = './assets/crystal_ice_block.png';

    // Laura Portrait Avatar
    const characterImg = new Image();
    characterImg.src = './assets/foto_invitacion_LAU.jpeg';

    let snowballCanvas = null;
    let icebergCanvas = null;

    snowballRaw.onload = () => { snowballCanvas = makeTransparentCanvas(snowballRaw, 35); };
    icebergRaw.onload = () => { icebergCanvas = makeTransparentCanvas(icebergRaw, 35); };

    let gameLoopId = null;
    let isGameRunning = false;

    // Game Variables
    let paddle = { x: 0, y: 0, width: 115, height: 26, speed: 8.5 };
    let ball = { x: 0, y: 0, radius: 14, dx: 4, dy: -5, speed: 5 };
    let bricks = [];
    let particles = [];
    
    const brickRows = 4;
    const brickCols = 5;
    let totalBricks = brickRows * brickCols; // 20 blocks total
    let brokenBricks = 0;

    function resizeGameCanvas() {
        const wrapper = gameCanvas.parentElement;
        gameCanvas.width = wrapper.clientWidth;
        gameCanvas.height = wrapper.clientHeight;

        paddle.y = gameCanvas.height - 45;
        paddle.width = Math.min(135, gameCanvas.width * 0.28);
    }

    function initBricks() {
        bricks = [];
        brokenBricks = 0;
        unlockedPhotos = [];
        isGamePaused = false;
        photosCount.textContent = `0/${memoryPhotos.length}`;

        const padding = 8;
        const offsetTop = 40;
        const offsetLeft = 12;

        const brickWidth = (gameCanvas.width - (offsetLeft * 2) - (padding * (brickCols - 1))) / brickCols;
        const brickHeight = Math.min(48, (gameCanvas.height * 0.24) / brickRows);

        // Assign exactly 13 unique photos to 13 distinct ice blocks, remaining 7 blocks have NO photo!
        const shuffledIndices = Array.from({ length: brickRows * brickCols }, (_, i) => i).sort(() => Math.random() - 0.5);
        const photoMap = {};

        for (let i = 0; i < memoryPhotos.length; i++) {
            const brickIdx = shuffledIndices[i];
            photoMap[brickIdx] = memoryPhotos[i];
        }

        let blockIndex = 0;

        for (let r = 0; r < brickRows; r++) {
            for (let c = 0; c < brickCols; c++) {
                const photoForThisBlock = photoMap[blockIndex] || null;

                bricks.push({
                    x: offsetLeft + c * (brickWidth + padding),
                    y: offsetTop + r * (brickHeight + padding),
                    width: brickWidth,
                    height: brickHeight,
                    active: true,
                    hitsRequired: (r === 0) ? 2 : 1,
                    hitsLeft: (r === 0) ? 2 : 1,
                    photo: photoForThisBlock
                });
                blockIndex++;
            }
        }
        totalBricks = bricks.reduce((acc, b) => acc + b.hitsRequired, 0);
        updateProgress();
    }

    function updateProgress() {
        const percent = Math.min(100, Math.floor((brokenBricks / totalBricks) * 100));
        barInner.style.width = percent + '%';
        progressPercent.textContent = percent + '%';

        if (percent >= 100) {
            onGameWin();
        }
    }

    function resetBallAndPaddle() {
        paddle.x = (gameCanvas.width - paddle.width) / 2;
        ball.x = gameCanvas.width / 2;
        ball.y = paddle.y - ball.radius - 5;
        ball.dx = (Math.random() > 0.5 ? 1 : -1) * (3.8 + Math.random() * 1.5);
        ball.dy = - (4.8 + Math.random());
    }

    function initGame() {
        resizeGameCanvas();
        initBricks();
        resetBallAndPaddle();
        particles = [];
        isGameRunning = true;

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoop();

        touchGuide.style.opacity = '0.9';
        setTimeout(() => {
            touchGuide.style.opacity = '0';
        }, 4000);
    }

    function stopGame() {
        isGameRunning = false;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
    }

    // --- CONTROLS ---
    function movePaddleTo(clientX) {
        if (isGamePaused) return; // Freeze paddle too while popup is open!
        const rect = gameCanvas.getBoundingClientRect();
        const touchX = clientX - rect.left;
        paddle.x = Math.max(0, Math.min(gameCanvas.width - paddle.width, touchX - paddle.width / 2));
    }

    window.addEventListener('mousemove', (e) => {
        if (isGameRunning && !isGamePaused) movePaddleTo(e.clientX);
    });

    window.addEventListener('touchmove', (e) => {
        if (isGameRunning && !isGamePaused && e.touches.length > 0) {
            movePaddleTo(e.touches[0].clientX);
            e.preventDefault();
        }
    }, { passive: false });

    // Keyboard support
    let rightPressed = false;
    let leftPressed = false;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
        if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
        if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
    });


    // --- PARTICLE EFFECTS ---
    function createIceExplosion(x, y) {
        for (let i = 0; i < 18; i++) {
            particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 9,
                dy: (Math.random() - 0.5) * 9,
                size: Math.random() * 5 + 2,
                color: Math.random() > 0.5 ? '#00d2ff' : '#ffffff',
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }


    // --- GAME LOOP ---
    function gameLoop() {
        if (!isGameRunning) return;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Draw Sleek Clean Aurora Background
        if (bgImg.complete && bgImg.naturalWidth !== 0) {
            ctx.drawImage(bgImg, 0, 0, gameCanvas.width, gameCanvas.height);
            ctx.fillStyle = 'rgba(4, 13, 26, 0.25)';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        } else {
            ctx.fillStyle = '#06111c';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        }

        // ONLY UPDATE PHYSICS & MOVEMENT IF NOT PAUSED BY POPUP!
        if (!isGamePaused) {
            // Move Paddle via keyboard
            if (rightPressed && paddle.x < gameCanvas.width - paddle.width) paddle.x += paddle.speed;
            if (leftPressed && paddle.x > 0) paddle.x -= paddle.speed;

            // Move Ball
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collisions
            if (ball.x + ball.radius > gameCanvas.width || ball.x - ball.radius < 0) {
                ball.dx = -ball.dx;
                playIceSound('bounce');
            }
            if (ball.y - ball.radius < 0) {
                ball.dy = -ball.dy;
                playIceSound('bounce');
            }

            // Paddle collision
            if (ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height) {
                if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
                    let hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    ball.dx = hitPos * 6.5;
                    ball.dy = -Math.abs(ball.dy);
                    playIceSound('bounce');
                }
            }

            // Ball reset at bottom
            if (ball.y - ball.radius > gameCanvas.height) {
                resetBallAndPaddle();
            }

            // Brick collisions
            bricks.forEach(brick => {
                if (brick.active) {
                    if (ball.x + ball.radius > brick.x &&
                        ball.x - ball.radius < brick.x + brick.width &&
                        ball.y + ball.radius > brick.y &&
                        ball.y - ball.radius < brick.y + brick.height) {

                        ball.dy = -ball.dy;
                        brick.hitsLeft--;
                        brokenBricks++;
                        updateProgress();

                        createIceExplosion(ball.x, ball.y);

                        if (brick.hitsLeft <= 0) {
                            brick.active = false;
                            playIceSound('break');

                            // Check if block has hidden photo!
                            if (brick.photo) {
                                if (!unlockedPhotos.includes(brick.photo)) {
                                    unlockedPhotos.push(brick.photo);
                                }
                                photosCount.textContent = `${unlockedPhotos.length}/${memoryPhotos.length}`;
                                showMemoryPopup(brick.photo);
                            }
                        } else {
                            playIceSound('bounce');
                        }
                    }
                }
            });
        }

        // DRAW CRISP CRYSTAL ICE BLOCKS (High-Res 3D Glass)
        bricks.forEach(brick => {
            if (brick.active) {
                ctx.save();
                if (icebergCanvas) {
                    ctx.drawImage(icebergCanvas, brick.x, brick.y, brick.width, brick.height);
                } else if (icebergRaw.complete && icebergRaw.naturalWidth !== 0) {
                    ctx.drawImage(icebergRaw, brick.x, brick.y, brick.width, brick.height);
                } else {
                    ctx.fillStyle = '#00d2ff';
                    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                }

                // Draw delicate ice sparkle star if brick contains photo
                if (brick.photo) {
                    ctx.fillStyle = 'rgba(255, 230, 0, 0.9)';
                    ctx.beginPath();
                    ctx.arc(brick.x + brick.width / 2, brick.y + brick.height / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        });

        // DRAW PADDLE (Sled + Perfect 1:1 Circular Laura Badge)
        ctx.save();
        let grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        grad.addColorStop(0, '#00d2ff');
        grad.addColorStop(1, '#3a7bd5');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 12);
        ctx.fill();

        // Laura's character badge in center of paddle (100% UN-DEFORMED SQUARE CROP TO CIRCLE)
        if (characterImg.complete && characterImg.naturalWidth !== 0) {
            const badgeRadius = 16;
            const badgeX = paddle.x + paddle.width / 2;
            const badgeY = paddle.y + paddle.height / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.clip();

            const srcSize = Math.min(characterImg.naturalWidth, characterImg.naturalHeight);
            const srcX = (characterImg.naturalWidth - srcSize) / 2;
            const srcY = 0;

            ctx.drawImage(
                characterImg,
                srcX, srcY, srcSize, srcSize,
                badgeX - badgeRadius, badgeY - badgeRadius, badgeRadius * 2, badgeRadius * 2
            );
            ctx.restore();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // DRAW BALL (Snowball)
        ctx.save();
        if (snowballCanvas) {
            ctx.drawImage(snowballCanvas, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
        } else if (snowballRaw.complete && snowballRaw.naturalWidth !== 0) {
            ctx.drawImage(snowballRaw, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Particles
        updateParticles();
        drawParticles();

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function onGameWin() {
        stopGame();
        playIceSound('win');
        setTimeout(() => {
            showScreen(inviteScreen);
            triggerConfetti();
        }, 600);
    }


    // --- CONFETTI CANNON ---
    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiPieces = [];

    function resizeConfettiCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfettiCanvas);
    resizeConfettiCanvas();

    function triggerConfetti() {
        confettiPieces = [];
        const colors = ['#00d2ff', '#3a7bd5', '#ffffff', '#ffe600', '#ff65a3'];
        for (let i = 0; i < 120; i++) {
            confettiPieces.push({
                x: Math.random() * confettiCanvas.width,
                y: -20,
                w: Math.random() * 10 + 6,
                h: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                dy: Math.random() * 4 + 2,
                dx: Math.random() * 2 - 1,
                rotation: Math.random() * 360,
                rSpeed: Math.random() * 6 - 3,
                opacity: 1
            });
        }
        animateConfetti();
    }

    function animateConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        let activeCount = 0;

        confettiPieces.forEach(p => {
            if (p.opacity > 0) {
                activeCount++;
                confettiCtx.save();
                confettiCtx.globalAlpha = p.opacity;
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate((p.rotation * Math.PI) / 180);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                confettiCtx.restore();

                p.x += p.dx;
                p.y += p.dy;
                p.rotation += p.rSpeed;

                if (p.y > confettiCanvas.height - 50) {
                    p.opacity -= 0.02;
                }
            }
        });

        if (activeCount > 0) {
            requestAnimationFrame(animateConfetti);
        }
    }

});
