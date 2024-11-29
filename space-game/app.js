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
}

const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
    KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
    COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
    COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
   };

let heroImg, 
    enemyImg, 
    laserImg,
    explosionImg,
    canvas, ctx, 
    gameObjects = [], 
    hero, 
    eventEmitter = new EventEmitter();

class GameObject {
    constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false; // 객체가 파괴되었는지 여부
    this.type = ""; // 객체 타입 (영웅/적)
    this.width = 0; // 객체의 폭
    this.height = 0; // 객체의 높이
    this.img = undefined; // 객체의 이미지
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
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height); // 캔버스에 이미지 그리기
    }
   }

   class Hero extends GameObject {
    constructor(x, y) {
    super(x, y);
    (this.width = 99), (this.height = 75);
    this.type = "Hero";
    this.speed = { x: 0, y: 0 };
    this.cooldown = 0;
    }
    fire() {
    if (this.canFire()) {
    // 비행기의 중앙에서 레이저 발사
    const laserX = this.x + this.width / 2 - 4.5; // 레이저 폭(9px)의 절반만큼 보정
    const laserY = this.y - 10; // 비행기 상단 바로 위
    gameObjects.push(new Laser(laserX, laserY));
    this.cooldown = 500; // 쿨다운 500ms
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
    return this.cooldown === 0; // 쿨다운이 끝났는지 확인
    }
   }

class Enemy extends GameObject {
    constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    // 적 캐릭터의 자동 이동 (Y축 방향)
    let id = setInterval(() => {
    if (this.y < canvas.height - this.height) {
    this.y += 5; // 아래로 이동
    } else {
    console.log('Stopped at', this.y);
    clearInterval(id); // 화면 끝에 도달하면 정지
    }
    }, 300);
    }
}

class Laser extends GameObject {
    constructor(x, y) {
    super(x, y);
    (this.width = 9), (this.height = 33);
    this.type = 'Laser';
    this.img = laserImg;
    let id = setInterval(() => {
    if (this.y > 0) {
    this.y -= 15; // 레이저가 위로 이동
    } else {
    this.dead = true; // 화면 상단에 도달하면 제거
    clearInterval(id);
    }
    }, 100);
    }
}

function loadTexture(path) {
    return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
    resolve(img);
    };
    })
   }

/*
function createEnemies(ctx, canvas, enemyImg) {
 const MONSTER_TOTAL = 5;
 const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
 const START_X = (canvas.width - MONSTER_WIDTH) / 2;
 const STOP_X = START_X + MONSTER_WIDTH;
 for (let x = START_X; x < STOP_X; x += enemyImg.width) {
 for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
 ctx.drawImage(enemyImg, x, y);
 }
 }
}
*/
let smallHeroes = [];

const mainHeroWidth = 90;
const mainHeroHeight = 90;
    
const smallHeroWidth = 45;
const smallHeroHeight = 45;

function createHero() {
    hero = new Hero(
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
    );
    hero.img = heroImg;
    hero.width = mainHeroWidth; // 메인 히어로 크기 설정
    hero.height = mainHeroHeight;
    gameObjects.push(hero);

    // 작은 비행기 생성
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

    smallHeroes.push(leftSmallHero, rightSmallHero); // 작은 비행기 배열에 추가
}

// 자동 공격 함수
function startAutoAttack() {
    smallHeroes.forEach((smallHero) => {
        setInterval(() => {
            if (!smallHero.dead) { // 비행기가 파괴되지 않았으면 공격
                smallHero.fire(); // 레이저 발사
            }
        }, 1000); // 1초 간격으로 발사
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

function createEnemies2(ctx, canvas, enemyImg) {
    const MONSTER_TOTAL = 5; // 첫 행의 우주선 수
    const MONSTER_WIDTH = enemyImg.width;

    for (let row = 0; row < MONSTER_TOTAL; row++) {
        // 각 행의 우주선 수는 위로 올라갈수록 하나씩 줄어듦
        const enemiesInRow = MONSTER_TOTAL - row;
        
        // 각 행의 시작 위치 계산 (가운데 정렬)
        const rowWidth = enemiesInRow * MONSTER_WIDTH;
        const startX = (canvas.width - rowWidth) / 2;
        const y = row * enemyImg.height; // 각 행의 y 좌표는 고정 간격으로 배치

        // 현재 행에 있는 모든 우주선 그리기
        for (let i = 0; i < enemiesInRow; i++) {
            const x = startX + i * MONSTER_WIDTH;
            ctx.drawImage(enemyImg, x, y);
        }
    }
}

function intersectRect(r1, r2) {
    return !(
    r2.left > r1.right || // r2가 r1의 오른쪽에 있음
    r2.right < r1.left || // r2가 r1의 왼쪽에 있음
    r2.top > r1.bottom || // r2가 r1의 아래에 있음
    r2.bottom < r1.top // r2가 r1의 위에 있음
    );
   }

function updateGameObjects() {
    const enemies = gameObjects.filter(go => go.type === 'Enemy');
    const lasers = gameObjects.filter((go) => go.type === "Laser");
    lasers.forEach((l) => {
    enemies.forEach((m) => {
    if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
    eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
    first: l,
    second: m,
    });
    }
    });
    });
    // 죽은 객체 제거
    gameObjects = gameObjects.filter(go => !go.dead);
   }

// 작은 비행기 위치 업데이트 함수
function updateSmallHeroesPosition() {
    // 왼쪽 작은 비행기 위치 업데이트
    smallHeroes[0].x = hero.x - smallHeroWidth - 10;
    smallHeroes[0].y = hero.y + (smallHeroHeight * 3) / 4;

    // 오른쪽 작은 비행기 위치 업데이트
    smallHeroes[1].x = hero.x + hero.width + 10;
    smallHeroes[1].y = hero.y + (smallHeroHeight * 3) / 4;
}

class CollisionEffect extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = 98; // 충돌 이미지의 폭 (적 크기와 동일)
        this.height = 50; // 충돌 이미지의 높이
        this.img = explosionImg;
        this.lifetime = 300; // 충돌 이미지 표시 시간 (ms)

        // 일정 시간 후 제거
        setTimeout(() => {
            this.dead = true;
        }, this.lifetime);
    }
}

function initGame() {
    gameObjects = [];
    createEnemies();
    createHero();
    
    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -=5 ;
    updateSmallHeroesPosition();
    })
    
    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += 5;
    updateSmallHeroesPosition();
    });
    
    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= 5;
    updateSmallHeroesPosition();
    });
    
    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += 5;
    updateSmallHeroesPosition();
    });

    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (hero.canFire()) {
        hero.fire();
        }
    });

    eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
        first.dead = true; // 레이저 제거
        second.dead = true; // 적 제거

         // 충돌 이미지 추가
        const collisionEffect = new CollisionEffect(second.x, second.y);
        gameObjects.push(collisionEffect); // 충돌 이미지를 게임 객체에 추가
    });
    startAutoAttack(); // 작은 비행기 자동 공격 시작
}

function drawGameObjects(ctx) {
    gameObjects.forEach(go => go.draw(ctx));
}

window.onload = async() => {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    heroImg = await loadTexture('assets/player.png')
    enemyImg = await loadTexture('assets/enemyShip.png')
    laserImg = await loadTexture("assets/laserRed.png");
    explosionImg = await loadTexture('assets/laserGreenShot.png'); // 충돌 이미지 로드

    initGame();
    
     const starBackground = await loadTexture('assets/starBackground.png');
     
     const pattern = ctx.createPattern(starBackground, 'repeat');
     ctx.fillStyle = pattern;
     ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(heroImg, canvas.width / 2 - mainHeroWidth / 2, canvas.height - (canvas.height / 4), mainHeroWidth, mainHeroHeight);

    ctx.drawImage(heroImg, canvas.width / 2 - mainHeroWidth / 2 - smallHeroWidth - 10, canvas.height - (canvas.height / 4) + (smallHeroHeight*3 / 4), smallHeroWidth, smallHeroHeight);
    ctx.drawImage(heroImg, canvas.width / 2 + mainHeroWidth / 2 + 10, canvas.height - (canvas.height / 4) + (smallHeroHeight*3 / 4), smallHeroWidth, smallHeroHeight);

    createEnemies2(ctx, canvas, enemyImg);

    let gameLoopId = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGameObjects(ctx);
        updateGameObjects(); // 충돌 감지
       }, 100);
    
    let onKeyDown = function (e) {
        console.log(e.keyCode);
        switch (e.keyCode) {
        case 37: // 왼쪽 화살표
        case 39: // 오른쪽 화살표
        case 38: // 위쪽 화살표
        case 40: // 아래쪽 화살표
        case 32: // 스페이스바
        e.preventDefault();
        break;
        default:
        break;
        }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener("keyup", (evt) => {
        if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
        } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
        } else if (evt.key === "ArrowLeft") {
        eventEmitter.emit(Messages.KEY_EVENT_LEFT);
        } else if (evt.key === "ArrowRight") {
        eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
        } else if(evt.keyCode === 32) {
            eventEmitter.emit(Messages.KEY_EVENT_SPACE);
        }   
    });
};




   