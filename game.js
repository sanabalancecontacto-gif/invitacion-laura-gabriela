/* ==========================================================================
   Invitación Aventura Congelada - Laura Gabriela (4º Cumpleaños)
   Game Engine: Breakout / Rompe-Hielo, Memory Popups, Web Audio & Navigation
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
    const galleryScroll = document.getElementById('galleryScroll');

    // --- MEMORY PHOTOS LIST ---
    const memoryPhotos = [
        './assets/photos/Imagen de Codex 19 sept 2026, 12_22_19 p.m..png',
        './assets/photos/Imagen de Codex 19 sept 2026, 12_29_57 p.m..png',
        './assets/photos/WhatsApp Image 2026-09-19 at 12.09.15 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-19 at 12.16.35 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.38.57 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.39.52 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.39.53 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.39.54 PM.jpeg',
        './assets/photos/WhatsApp Image 2026-09-20 at 12.40.43 PM.jpeg'
    ];

    let unlockedPhotos = [];

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
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'break') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'photo') {
                // Arpeggio for photo unlock magic!
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


    // --- TRANSPARENT BACKGROUND HELPER (KEYING OUT BLACK BACKGROUNDS) ---
    function makeTransparentCanvas(img, threshold = 40) {
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
                // If pixel is near black/dark, make transparent
                if (r < threshold && g < threshold && b < threshold) {
                    data[i + 3] = 0; // Alpha 0
                }
            }
            offCtx.putImageData(imgData, 0, 0);
        } catch (e) {
            console.log('Canvas image data keying note:', e);
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


    // --- SCREEN NAVIGATION & GALLERY POPULATION ---
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
        const photosToDisplay = unlockedPhotos.length > 0 ? unlockedPhotos : memoryPhotos;

        photosToDisplay.forEach(photoSrc => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${photoSrc}" alt="Recuerdo de Laura Gabriela">`;
            item.addEventListener('click', () => {
                showMemoryPopup(photoSrc);
            });
            galleryScroll.appendChild(item);
        });
    }

    function showMemoryPopup(photoSrc) {
        memoryPopupImg.src = photoSrc;
        memoryPopup.classList.add('active');
        playIceSound('photo');

        setTimeout(() => {
            memoryPopup.classList.remove('active');
        }, 2200);
    }

    memoryPopup.addEventListener('click', () => {
        memoryPopup.classList.remove('active');
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

    // Image Loaders
    const bgImg = new Image();
    bgImg.src = './assets/Frozen_path_through_snowy_forest_20260919111318.jpeg';

    const snowballRaw = new Image();
    snowballRaw.src = './assets/Fluffy_white_snowball_with_ice_20260919111321.jpeg';

    const icebergRaw = new Image();
    icebergRaw.src = './assets/Glowing_jagged_iceberg_isolated_20260919111325.jpeg';

    const characterImg = new Image();
    characterImg.src = './assets/foto_invitacion_LAU.jpeg';

    let snowballCanvas = null;
    let icebergCanvas = null;

    snowballRaw.onload = () => { snowballCanvas = makeTransparentCanvas(snowballRaw, 35); };
    icebergRaw.onload = () => { icebergCanvas = makeTransparentCanvas(icebergRaw, 35); };

    let gameLoopId = null;
    let isGameRunning = false;

    // Game Variables
    let paddle = { x: 0, y: 0, width: 115, height: 26, speed: 8 };
    let ball = { x: 0, y: 0, radius: 14, dx: 4, dy: -5, speed: 5 };
    let bricks = [];
    let particles = [];
    
    const brickRows = 4;
    const brickCols = 5;
    let totalBricks = brickRows * brickCols;
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
        photosCount.textContent = `0/${memoryPhotos.length}`;

        const padding = 8;
        const offsetTop = 45;
        const offsetLeft = 12;

        const brickWidth = (gameCanvas.width - (offsetLeft * 2) - (padding * (brickCols - 1))) / brickCols;
        const brickHeight = Math.min(45, (gameCanvas.height * 0.22) / brickRows);

        // Shuffle memory photos for random hidden blocks
        const shuffledPhotos = [...memoryPhotos].sort(() => Math.random() - 0.5);
        let photoIndex = 0;

        for (let r = 0; r < brickRows; r++) {
            for (let c = 0; c < brickCols; c++) {
                let photoForBrick = null;
                // Assign photo to some bricks
                if (photoIndex < shuffledPhotos.length && (Math.random() > 0.3 || (r * brickCols + c) >= (brickRows * brickCols - shuffledPhotos.length + photoIndex))) {
                    photoForBrick = shuffledPhotos[photoIndex++];
                }

                bricks.push({
                    x: offsetLeft + c * (brickWidth + padding),
                    y: offsetTop + r * (brickHeight + padding),
                    width: brickWidth,
                    height: brickHeight,
                    active: true,
                    hitsRequired: (r === 0) ? 2 : 1,
                    hitsLeft: (r === 0) ? 2 : 1,
                    photo: photoForBrick
                });
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
        ball.dx = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 1.5);
        ball.dy = - (4.5 + Math.random());
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
        const rect = gameCanvas.getBoundingClientRect();
        const touchX = clientX - rect.left;
        paddle.x = Math.max(0, Math.min(gameCanvas.width - paddle.width, touchX - paddle.width / 2));
    }

    window.addEventListener('mousemove', (e) => {
        if (isGameRunning) movePaddleTo(e.clientX);
    });

    window.addEventListener('touchmove', (e) => {
        if (isGameRunning && e.touches.length > 0) {
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


    // --- PARTICLE EFFECTS & PHOTO POPUPS ---
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

        // Draw Frozen Forest Background
        if (bgImg.complete && bgImg.naturalWidth !== 0) {
            ctx.drawImage(bgImg, 0, 0, gameCanvas.width, gameCanvas.height);
            ctx.fillStyle = 'rgba(6, 17, 28, 0.35)';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        } else {
            ctx.fillStyle = '#0a1826';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        }

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
                        if (brick.photo && !unlockedPhotos.includes(brick.photo)) {
                            unlockedPhotos.push(brick.photo);
                            photosCount.textContent = `${unlockedPhotos.length}/${memoryPhotos.length}`;
                            showMemoryPopup(brick.photo);
                        }
                    } else {
                        playIceSound('bounce');
                    }
                }
            }
        });

        // DRAW ICEBERG BRICKS (Sin fondo / Transparent)
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

                // Camera icon indicator if brick hides a memory photo
                if (brick.photo) {
                    ctx.fillStyle = '#ffd700';
                    ctx.font = '12px FontAwesome, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('📷', brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
                }

                ctx.restore();
            }
        });

        // DRAW PADDLE (Sled + Laura Portrait Badge)
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

        // Laura's character badge in center of paddle
        if (characterImg.complete && characterImg.naturalWidth !== 0) {
            const badgeRadius = 18;
            const badgeX = paddle.x + paddle.width / 2;
            const badgeY = paddle.y + paddle.height / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(characterImg, badgeX - badgeRadius, badgeY - badgeRadius, badgeRadius * 2, badgeRadius * 2);
            ctx.restore();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // DRAW BALL (Snowball - Sin fondo / Transparent)
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
        const colors = ['#00d2ff', '#3a7bd5', '#ffffff', '#ffd700', '#ff65a3'];
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
