class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach((l) => l(message, payload));
        }
    }
    clear() {
        this.listeners = {};
    }
}

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
    GAME_END_LOSS: "GAME_END_LOSS",
    GAME_END_WIN: "GAME_END_WIN",
};

let heroImg,
    enemyImg,
    laserImg,
    explosionImg,
    lifeImg,
    bossImg,
    bossLaserImg, laserRedShotImg,
    shieldImg,
    meteorBigImg, meteorSmallImg,
    starBackground,
    canvas,
    ctx,
    gameObjects = [],
    hero,
    gameLoopId,
    eventEmitter = new EventEmitter();

let stage = 1; // 현재 스테이지를 관리하는 변수
let bossDefeated = false; // 보스 처치 여부


class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.type = "";
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }

    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width,
        };
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}
class Hero extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 99;
        this.height = 75;
        this.type = "Hero";
        this.cooldown = 0;
        this.life = 3;
        this.points = 0;

        // 쉴드 관련 상태
        this.shieldActive = false; // 쉴드 활성화 여부
        this.shieldCooldown = false; // 쉴드 사용 가능 여부

        // 차지 게이지 관련
        this.chargeGauge = 0; // 현재 차지 게이지
        this.chargeMax = 100; // 최대 차지 게이지
        this.chargeInterval = setInterval(() => {
            if (this.chargeGauge < this.chargeMax) {
                this.chargeGauge += 1; // 게이지 증가
            }
        }, 100); // 0.1초마다 증가
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;

        // 화면 경계 제한
        if (this.x < 0) this.x = 0; // 왼쪽 경계
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width; // 오른쪽 경계
        if (this.y < 0) this.y = 0; // 위쪽 경계
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height; // 아래쪽 경계
    }

    fireMeteor() {
        if (this.chargeGauge >= 50) {
            const meteorType = this.chargeGauge === 100 ? "big" : "small";
            const meteor = new Meteor(
                this.x + this.width / 2 - 20, // 메테오 위치 설정
                this.y - 40,
                meteorType
            );
            gameObjects.push(meteor);

            // 게이지 감소
            this.chargeGauge = meteorType === "big" ? 0 : this.chargeGauge - 50;
        }
    }

    fire() {
        if (this.canFire()) {
            const laserX = this.x + this.width / 2 - 4.5;
            const laserY = this.y - 10;
            gameObjects.push(new Laser(laserX, laserY));
            this.cooldown = 500;
            let id = setInterval(() => {
                if (this.cooldown > 0) {
                    this.cooldown -= 100;
                } else {
                    clearInterval(id);
                }
            }, 100);
        }
    }

    canFire() {
        return this.cooldown === 0;
    }

    activateShield() {
        if (!this.shieldCooldown && !this.shieldActive) {
            this.shieldActive = true; // 쉴드 활성화
            this.shieldCooldown = true; // 쉴드 사용 불가 상태로 설정
            const originalImg = this.img; // 원래 이미지 저장
            this.img = shieldImg; // 쉴드 이미지로 변경

            // 2초 후 쉴드 비활성화
            setTimeout(() => {
                this.shieldActive = false;
                this.img = originalImg; // 원래 이미지로 복구
            }, 2000);
        }
    }

    decrementLife() {
        if (!this.shieldActive) { // 쉴드가 비활성화된 경우에만 생명 감소
            this.life--;
            if (this.life <= 0) {
                this.dead = true;
                // 게임 종료 메시지 트리거
                eventEmitter.emit(Messages.GAME_END_LOSS);
            }
        }
    }

    incrementPoints() {
        this.points += 100;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.type = "Enemy";
        let id = setInterval(() => {
            if (!this.dead) {
                if (this.y + this.height < canvas.height) {
                    this.y += 5; // 적이 아래로 이동
                } else {
                    clearInterval(id); // 적이 화면 아래로 도달했을 경우 정지
                }
            }
        }, 300);
    }
}

class BossEnemy extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 150;
        this.height = 100;
        this.type = "BossEnemy";
        this.dead = false; // 보스 생존 상태 명시적으로 설정
        this.health = 500; // 보스 체력
        this.maxHealth = 500; // 최대 체력 (체력 표시용)
        this.img = bossImg; // UFO 이미지
        this.movementDirectionX = 1; // 좌우 이동 방향
        this.movementDirectionY = 1; // 상하 이동 방향

        // 보스 이동 (좌우 + 상하)
        this.movementInterval = setInterval(() => {
            if (!this.dead) {
                this.x += this.movementDirectionX * 3;
                this.y += this.movementDirectionY * 2;

                // 좌우 경계 체크
                if (this.x <= 0 || this.x + this.width >= canvas.width) {
                    this.movementDirectionX *= -1;
                }

                // 상하 경계 체크
                if (this.y <= 30 || this.y + this.height >= canvas.height / 2) {
                    this.movementDirectionY *= -1;
                }
            } else {
                clearInterval(this.movementInterval);
            }
        }, 50);

        // 보스 레이저 주기적으로 발사
        this.attackInterval = setInterval(() => {
            if (!this.dead) this.fire();
        }, 1500);
    }

    fire() {
        const laserX = this.x + this.width / 2 - 4.5;
        const laserY = this.y + this.height;
        const bossLaser = new BossLaser(laserX, laserY); // 보스 레이저 객체 생성
        gameObjects.push(bossLaser);
    }

    decrementHealth(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.dead = true;
            clearInterval(this.movementInterval);
            clearInterval(this.attackInterval);
        }
    }
}

class Laser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 9;
        this.height = 33;
        this.type = "Laser";
        this.img = laserImg;
        let id = setInterval(() => {
            if (this.y > 0) {
                this.y -= 15;
            } else {
                this.dead = true;
                clearInterval(id);
            }
        }, 100);
    }
}

class BossLaser extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 10; // 보스 레이저 크기
        this.height = 40;
        this.type = "BossLaser"; // 타입 설정
        this.img = bossLaserImg; // assets/laserGreen.png
        let id = setInterval(() => {
            if (this.y < canvas.height) {
                this.y += 10; // 아래로 이동
            } else {
                this.dead = true; // 화면 밖으로 나가면 제거
                clearInterval(id);
            }
        }, 100);
    }
}

class Meteor extends GameObject {
    constructor(x, y, size) {
        super(x, y);
        this.type = "Meteor";
        this.width = size === "big" ? 100 : 50; // 메테오 크기
        this.height = size === "big" ? 100 : 50;
        this.damage = size === "big" ? 20 : 10; // 데미지
        this.img = size === "big" ? meteorBigImg : meteorSmallImg;

        let id = setInterval(() => {
            this.y -= 10; // 메테오 위로 이동
            if (this.y < 0) {
                this.dead = true; // 화면 밖으로 나가면 제거
                clearInterval(id);
            } else {
                // 메테오 경로에 적 제거
                const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
                enemies.forEach((enemy) => {
                    if (intersectRect(this.rectFromGameObject(), enemy.rectFromGameObject())) {
                        enemy.dead = true;
                    }
                });

                // 보스에 데미지 적용
                const boss = gameObjects.find((go) => go.type === "BossEnemy" && !go.dead);
                if (boss && intersectRect(this.rectFromGameObject(), boss.rectFromGameObject())) {
                    boss.decrementHealth(this.damage);
                }
            }
        }, 100); // 0.1초마다 이동
    }
}

class CollisionEffect extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98;
        this.height = 50;
        this.img = explosionImg;
        this.lifetime = 300;
        setTimeout(() => {
            this.dead = true;
        }, this.lifetime);
    }
}

function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
    });
}

let smallHeroes = [];

const mainHeroWidth = 90;
const mainHeroHeight = 90;

const smallHeroWidth = 45;
const smallHeroHeight = 45;

function createHero() {
    hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
    hero.img = heroImg;
    hero.width = mainHeroWidth;
    hero.height = mainHeroHeight;
    gameObjects.push(hero);

    const leftSmallHero = new Hero(
        canvas.width / 2 - mainHeroWidth / 2 - smallHeroWidth - 10,
        canvas.height - canvas.height / 4 + (smallHeroHeight * 3) / 4
    );
    const rightSmallHero = new Hero(
        canvas.width / 2 + mainHeroWidth / 2 + 10,
        canvas.height - canvas.height / 4 + (smallHeroHeight * 3) / 4
    );

    leftSmallHero.img = heroImg;
    rightSmallHero.img = heroImg;

    leftSmallHero.width = smallHeroWidth;
    leftSmallHero.height = smallHeroHeight;
    rightSmallHero.width = smallHeroWidth;
    rightSmallHero.height = smallHeroHeight;

    gameObjects.push(leftSmallHero);
    gameObjects.push(rightSmallHero);

    smallHeroes.push(leftSmallHero, rightSmallHero);
}

let autoAttackTimers = []; // 자동 공격 타이머 추적 배열

function startAutoAttack() {
    autoAttackTimers.forEach(clearInterval); // 이전 타이머 모두 제거
    autoAttackTimers = []; // 타이머 배열 초기화

    smallHeroes.forEach((smallHero) => {
        const timerId = setInterval(() => {
            if (!smallHero.dead) {
                smallHero.fire();
            }
        }, 1000);
        autoAttackTimers.push(timerId); // 새 타이머 추가
    });
}

function createEnemies() {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * 98;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;
    for (let x = START_X; x < STOP_X; x += 98) {
        for (let y = 0; y < 50 * 5; y += 50) {
            const enemy = new Enemy(x, y);
            enemy.img = enemyImg;
            gameObjects.push(enemy);
        }
    }
}

function createBoss() {
    const boss = new BossEnemy(canvas.width / 2 - 75, 50);
    gameObjects.push(boss);
}

function intersectRect(r1, r2) { 
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

function updateStage() {
    const remainingEnemies = gameObjects.filter(
        (go) => go.type === "Enemy" && !go.dead
    ).length;
    const boss = gameObjects.find(
        (go) => go.type === "BossEnemy" && !go.dead
    );

    // 스테이지 전환 처리
    if (remainingEnemies === 0 && stage < 3 && !boss) {
        stage++;

        // 스테이지가 올라갈 때 모든 레이저 제거
        gameObjects = gameObjects.filter((go) => go.type !== "Laser");

        if (stage === 3) {
            // 3단계: 보스 생성
            createBoss();
        } else {
            createEnemies(); // 1단계 -> 2단계: 일반 적 생성
        }
        return; // 스테이지 전환 시 추가 작업 중단
    }

    // 3단계에서 보스가 처치된 경우에만 승리
    if (stage === 3 && !boss) {
        eventEmitter.emit(Messages.GAME_END_WIN); // 게임 승리
    }
}

function updateGameObjects() {
    const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
    const lasers = gameObjects.filter((go) => go.type === "Laser" && !go.dead);
    const boss = gameObjects.find((go) => go.type === "BossEnemy" && !go.dead);

    // 적의 위치를 확인하여 아래쪽 경계에 도달했는지 검사
    enemies.forEach((enemy) => {
        if (enemy.y + enemy.height >= canvas.height) {
            // 적이 화면 아래로 도달했을 경우 게임 종료
            eventEmitter.emit(Messages.GAME_END_LOSS);
        }
    });

    // 아군 레이저와 적 충돌 처리
    lasers.forEach((laser) => {
        enemies.forEach((enemy) => {
            if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
                    first: laser,
                    second: enemy,
                });
            }
        });
    });

    // 아군과 적 충돌 처리
    enemies.forEach((enemy) => {
        const heroRect = hero.rectFromGameObject();
        if (intersectRect(heroRect, enemy.rectFromGameObject())) {
            eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
        }
    });

    // 보스와 아군 레이저 충돌 처리
    if (boss) {
        lasers.forEach((laser) => {
            if (intersectRect(laser.rectFromGameObject(), boss.rectFromGameObject())) {
                boss.decrementHealth(10); // 보스 체력 감소
                laser.dead = true;
            }
        });
    }

    // 보스 레이저와 아군 충돌 처리
    handleBossLaserCollision();

    // 죽은 객체 제거
    gameObjects = gameObjects.filter((go) => !go.dead);

    // 스테이지 업데이트
    updateStage();
}


function drawLife() {
    const START_POS = canvas.width - 180;
    for (let i = 0; i < hero.life; i++) {
        ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), canvas.height - 37);
    }
}

function drawPoints() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "left";
    ctx.fillText(`Points: ${hero.points}`, 10, canvas.height - 20);
}

function drawBossHealth() {
    const boss = gameObjects.find((go) => go.type === "BossEnemy" && !go.dead);
    if (boss) {
        const healthBarWidth = boss.width; // 보스 크기와 동일하게
        const healthBarHeight = 10; // 체력 바 높이
        const healthBarX = boss.x; // 보스 위치에 맞게
        const healthBarY = boss.y - 15; // 보스 위에 표시

        // 체력 바 배경
        ctx.fillStyle = "red";
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // 현재 체력에 따른 너비
        const currentHealthWidth = (boss.health / boss.maxHealth) * healthBarWidth;

        // 현재 체력 표시
        ctx.fillStyle = "green";
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

        // 테두리
        ctx.strokeStyle = "black";
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
}

function drawChargeGauge() {
    const gaugeWidth = 200; // 게이지 너비
    const gaugeHeight = 20; // 게이지 높이
    const gaugeX = (canvas.width - gaugeWidth) / 2; // 화면 중앙
    const gaugeY = canvas.height - 50; // 화면 하단 기준

    // 배경
    ctx.fillStyle = "grey";
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

    // 현재 게이지
    const currentWidth = (hero.chargeGauge / hero.chargeMax) * gaugeWidth;
    ctx.fillStyle = hero.chargeGauge === 100 ? "gold" : "blue"; // 100일 때 강조
    ctx.fillRect(gaugeX, gaugeY, currentWidth, gaugeHeight);

    // 테두리
    ctx.strokeStyle = "black";
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

    // 텍스트
    ctx.font = "14px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(`Charge: ${hero.chargeGauge}`, gaugeX + gaugeWidth / 2, gaugeY - 5);
}


function endGame(win) {
    clearInterval(gameLoopId);
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = win ? "green" : "red";
        ctx.textAlign = "center";
        ctx.fillText(
            win
                ? "Victory!!! Press [Enter] to start a new game"
                : "Game Over!!! Press [Enter] to restart",
            canvas.width / 2,
            canvas.height / 2
        );
    }, 200);
}

function resetGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId); // 게임 루프 중지
    }

    // 모든 상태 초기화
    stage = 1; // 1단계로 초기화
    bossDefeated = false; // 보스 처치 상태 초기화
    gameObjects = []; // 모든 객체 초기화
    smallHeroes = []; // 미니 비행기 초기화

    // 기존 이벤트 리스너 제거
    eventEmitter.clear();

    // 1단계부터 게임 다시 시작
    initGame();
    startGameLoop();
}

function startGameLoop() {
    gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = ctx.createPattern(starBackground, "repeat");
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawPoints();
        drawLife();

        // 현재 스테이지 표시 (화면 경계 고려)
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(`Stage: ${stage}`, 20, 30); // 왼쪽 상단으로 이동

        // 보스 체력 표시
        drawBossHealth();

         // 차지 게이지 표시
         drawChargeGauge();

        // 메인 비행기 파괴 시 미니 비행기 제거
        if (hero.dead) {
            smallHeroes.forEach((miniHero) => (miniHero.dead = true));
        }

        updateGameObjects();
        gameObjects.forEach((go) => go.draw(ctx));
    }, 100);
}

function updateSmallHeroesPosition() {
    const offsetX = smallHeroWidth + 10; // 좌우 미니 비행기 간격
    const offsetY = (smallHeroHeight * 3) / 4; // Y축 기준점

    // 왼쪽 미니 비행기 위치 제한
    smallHeroes[0].x = Math.max(hero.x - offsetX, 0);
    smallHeroes[0].y = Math.min(
        hero.y + offsetY,
        canvas.height - smallHeroes[0].height
    );

    // 오른쪽 미니 비행기 위치 제한
    smallHeroes[1].x = Math.min(
        hero.x + hero.width + 10,
        canvas.width - smallHeroes[1].width
    );
    smallHeroes[1].y = Math.min(
        hero.y + offsetY,
        canvas.height - smallHeroes[1].height
    );
}

function handleBossLaserCollision() {
    const bossLasers = gameObjects.filter((go) => go.type === "BossLaser" && !go.dead);

    bossLasers.forEach((laser) => {
        if (intersectRect(hero.rectFromGameObject(), laser.rectFromGameObject())) {
            laser.dead = true; // 레이저 제거
            hero.decrementLife(); // 아군 체력 감소

            // 충돌 이미지 추가
            const collisionEffect = new CollisionEffect(laser.x, laser.y);
            collisionEffect.img = laserRedShotImg; // assets/laserRedShot.png
            gameObjects.push(collisionEffect);
        }
    });
}

function initGame() {
    gameObjects = []; // 모든 게임 객체 초기화
    smallHeroes = []; // 미니 비행기 초기화
    stage = 1; // 초기 스테이지 설정
    bossDefeated = false; // 보스 처치 상태 초기화

    createEnemies(); // 적 생성
    createHero(); // 주인공 비행기와 미니 비행기 생성

    hero.shieldCooldown = false; // 쉴드 초기화

    // 방향키 이벤트와 스페이스바 이벤트 리스너 추가
    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        hero.move(0, -7); // 위로 이동
        updateSmallHeroesPosition();
    });
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        hero.move(0, 7); // 아래로 이동
        updateSmallHeroesPosition();
    });
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
        hero.move(-7, 0); // 왼쪽으로 이동
        updateSmallHeroesPosition();
    });
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
        hero.move(7, 0); // 오른쪽으로 이동
        updateSmallHeroesPosition();
    });
    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) hero.fire();
    });
    eventEmitter.on(Messages.KEY_EVENT_ENTER, resetGame);

    // 충돌 이벤트 처리
    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true;
        second.dead = true;
        hero.incrementPoints();
        gameObjects.push(new CollisionEffect(second.x, second.y));
    });

    eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
        enemy.dead = true;
        hero.decrementLife();
    });

    // 게임 종료 이벤트 처리
    eventEmitter.on(Messages.GAME_END_WIN, () => {
        if (stage === 3) { // 오직 3단계에서 승리 가능
            endGame(true);
        }
    });

    eventEmitter.on(Messages.GAME_END_LOSS, () => endGame(false)); // 게임 패배 처리

    startAutoAttack(); // 미니 비행기 자동 공격 활성화
}

window.onload = async () => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    heroImg = await loadTexture("assets/player.png");
    enemyImg = await loadTexture("assets/enemyShip.png");
    laserImg = await loadTexture("assets/laserRed.png");
    explosionImg = await loadTexture("assets/laserGreenShot.png");
    lifeImg = await loadTexture("assets/life.png");
    starBackground = await loadTexture("assets/starBackground.png");
    bossImg = await loadTexture("assets/enemyUFO.png");
    bossLaserImg = await loadTexture("assets/laserGreen.png");
    laserRedShotImg = await loadTexture("assets/laserRedShot.png");
    shieldImg = await loadTexture("assets/shield.png");
    meteorBigImg = await loadTexture("assets/meteorBig.png");
    meteorSmallImg = await loadTexture("assets/meteorSmall.png");

    initGame();
    startGameLoop();

    window.addEventListener("keydown", (e) => {

        // 기본 동작 방지 (화면 롤링 방지)
        const keysToPrevent = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
        if (keysToPrevent.includes(e.key)) e.preventDefault();

        // 키 입력에 따른 이벤트 트리거
        if (e.code === "ArrowUp") eventEmitter.emit(Messages.KEY_EVENT_UP);
        if (e.code === "ArrowDown") eventEmitter.emit(Messages.KEY_EVENT_DOWN);
        if (e.code === "ArrowLeft") eventEmitter.emit(Messages.KEY_EVENT_LEFT);
        if (e.code === "ArrowRight") eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
        if (e.code === "Space") eventEmitter.emit(Messages.KEY_EVENT_SPACE);
        if (e.code === "Enter") eventEmitter.emit(Messages.KEY_EVENT_ENTER);
        if (e.code === "KeyQ") hero.activateShield(); // 쉴드 활성화
        if (e.code === "KeyR") hero.fireMeteor(); // 메테오 발사
    });
};


