/**
 * Created by JHT on 2017/7/22.
 */

'use strict';

let game = {
    level : 0,
    income : 0,
    status : {
        isResumeUpdate : false,
        isBoundUpdate : false,
        isIncomeUpdate : false
    },
    balls : [],
    bullets : [],
    attackers : [],
    defenders : [],
    levelCount : 0,
    levelSpeed : 1,
    iteratorId : 0
};

let GameConst = {
    boundUpdateRate : 1,
    resumeUpdateRate : 1,
    teamColor :['#484848', '#80ff5d','#ff6579'],
    ballRadius : [20, 40, 60, 80],
    maxHp : [[30, 45, 60],[60, 90, 120],[90, 135, 180],[150, 225, 300]],
    resumeRate : [[1, 2 ,3], [3, 4, 5], [5, 6, 7], [7, 8, 9]],//恢复速率
    bulletSpeed: 0.4,
    width : 1000,
    hwRate : 0.7, //高宽比，height = width * hwRate
    height : 700,
    attackerRadius : 150,
    defenderRadius : 150,
    defenderSlowDown : 1,
    attackerCollRadius : 20,
    defenderCollRadius : 20,
    scale : 1,
    minScale : 0.5
};

function Ball(x, y, quality, team, curHp, autoAttackStyle) {
    this.x = x;
    this.y = y;
    this.quality = quality;
    this.r = GameConst.ballRadius[quality];
    this.team = team;
    this.curHp = curHp;
    this.level = 0;
    this.maxHp = GameConst.maxHp[quality][0] * (1 + GameConst.boundUpdateRate * game.status.isBoundUpdate);
    this.autoAttackStyle = autoAttackStyle;

    game.balls.push(this);
}
Ball.prototype.autoAttack = function () {
    let target;
    let weight;
    switch (this.autoAttackStyle) {
        case 0:
            return;
        case 1:
            weight = (GameConst.width * GameConst.width + GameConst.height * GameConst.height) * (0.4 + 1);
            for(let ball of game.balls) {
                let temp = ((this.x - ball.x) * (this.x - ball.x) + (this.y - ball.y) * (this.y - ball.y)) * (0.4 + (ball.team === 0));
                if(temp < weight && temp > 0) {
                    weight = temp;
                    target = ball;
                }
            }
            if(weight > (GameConst.width * GameConst.width + GameConst.height * GameConst.height) * (0.4 + 1) * 0.6){
                this.levelUp();
                return;
            }
            break;
        case 2:
            weight = (GameConst.width * GameConst.width + GameConst.height * GameConst.height) * (0.4 + 1);
            for(let ball of game.balls) {
                let temp = ((this.x - ball.x) * (this.x - ball.x) + (this.y - ball.y) * (this.y - ball.y)) * (0.4 + (ball.team !== 0));
                if(temp < weight && temp > 0) {
                    weight = temp;
                    target = ball;
                }
            }
            if(weight > (GameConst.width * GameConst.width + GameConst.height * GameConst.height) * (0.4 + 1) * 0.3){
                this.levelUp();
                return;
            }
            break;
        default:
            break;
    }
    this.attack(getAngle(target));
};
Ball.prototype.getAngle = function(target) {
    let theta;
    if(this.x === target.x) {

        if(this.y < target.y)
            theta = Math.PI / 2;
        else
            theta = Math.PI * 1.5;
    }
    else {
        let t = Math.atan((target.y - this.y) / (target.x - this.x));
        if(target.x > this.x && target.y >= this.y)
            theta = t;
        else if(target.x > this.x && target.y < this.y)
            theta = Math.PI * 2 + t;
        else
            theta = Math.PI + t;
    }
    return theta;
};
Ball.prototype.update = function () {
    if(this.team === 0)
        return;
    if(this.curHp < this.maxHp) {
        this.curHp += GameConst.resumeRate[this.quality][this.level] * (1 + GameConst.resumeUpdateRate * game.status.isResumeUpdate);
        if(this.curHp > this.maxHp)
            this.curHp = this.maxHp;
    }
};
Ball.prototype.levelUp = function () {
    this.level++;
    this.maxHp = GameConst.maxHp[quality][this.level] * (1 + GameConst.boundUpdateRate * game.status.isBoundUpdate);
};
Ball.prototype.translate = function (hp, team) {
    if(this.team === team)
        this.curHp += hp;
    else {
        this.curHp -= hp;
        if(this.curHp < 0) {
            this.team = team;
            this.curHp = -this.curHp;
        }
        else if(this.curHp === 0) {
            this.team = 0;
        }
    }

};
Ball.prototype.attack = function (theta) {
    if(this.hp <= 1)
        return;
    new Bullet(this.x, this.y, this.team, this.hp / 2, theta, GameConst.bulletSpeed);
    this.hp /= 2;
};


function Bullet(x, y, team, hp, theta, speed) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = hp;
    this.angle = theta;
    this.speed = speed;

    this.r = this.getRadius();
    game.bullets.push(this);


}
Bullet.prototype.getRadius = function () {

    return Math.max(this.hp / 3, 10);
};
Bullet.prototype.update = function () {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    this.r = this.getRadius();
    if(this.x - this.r <= 0)
    {
        this.angle = Math.PI - this.angle;
        this.x = this.r;
    }
    else if(this.x + this.r >= GameConst.width) {
        this.angle = Math.PI - this.angle;
        this.x = GameConst.width - this.r;
    }
    if(this.y - this.r <= 0)
    {
        this.angle = 2 * Math.PI - this.angle;
        this.y = this.r;
    }
    else if(this.y + this.r >= GameConst.height) {
        this.angle = 2 * Math.PI - this.angle;
        this.y = GameConst.height - this.r;
    }

    for(let ball of game.balls) {
        if(this.hp <= 0)
            break;
        if ((this.x - ball.x) * (this.x - ball.x) + (this.y - ball.y) * (this.y - ball.y) <=
            (this.r + ball.r) * (this.r + ball.r)) {
            this.hp -= 2;
            ball.translate(2, this.team);
            this.r = this.getRadius();
            redrawBall(ball);
        }
    }
    for(let attacker of game.attackers) {
        if(this.hp <= 0)
            break;
        if ((this.x - attacker.x) * (this.x - attacker.x) + (this.y - attacker.y) * (this.y - attacker.y) <=
            (this.r + GameConst.attackerCollRadius) * (this.r + GameConst.attackerCollRadius)) {
            this.hp -= 2;
            attacker.translate(2, this.team);
            this.r = this.getRadius();

        }
    }
    for(let defender of game.defenders) {
        if(this.hp <= 0)
            break;
        if ((this.x - defender.x) * (this.x - defender.x) + (this.y - defender.y) * (this.y - defender.y) <=
            (this.r + GameConst.defenderCollRadius) * (this.r + GameConst.defenderCollRadius)) {
            this.hp -= 2;
            defender.translate(2, this.team);
            this.r = this.getRadius();
        }
    }

    for(let bullet of game.bullets) {
        if(this.hp <= 0)
            break;
        if ((this.x - bullet.x) * (this.x - bullet.x) + (this.y - bullet.y) * (this.y - bullet.y) <=
            (this.r + bullet.r) * (this.r + bullet.r) && this.team !== bullet.team) {
            this.hp -= 1;
            bullet.hp -= 1;
            this.r = this.getRadius();
            bullet.r = bullet.getRadius();

        }
    }
    let l = game.bullets.length;
    for(let i = 0; i < l; i++) {
        if(game.bullets[i].hp <= 0) {
            game.bullets.splice(i, 1);
            i--;
            l--;
        }
    }
};


function Attacker(x, y, hp, move) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.move = move;
    this.team = 0;

    game.attackers.push(this);

}
Attacker.prototype.update = function() {
    if(this.team === 0)
        return;
    let flag = false;
    for(let ball of game.balls) {
        if((this.x - ball.x) * (this.x - ball.x) + (this.y - ball.y) * (this.y - ball.y) <=
            (GameConst.attackerRadius + ball.r) * (GameConst.attackerRadius + ball.r)){
            ball.translate(1, this.team);
            redrawBall(ball);
            drawThunder(this.x, this.y, ball.x, ball.y, this.team);
            flag = true;
        }
    }
    if(this.move)
        this.move();
    if(flag)
        this.hp -= 1;
    if(this.hp <= 0) {
        this.hp = 0;
        this.team = 0;
    }
};
Attacker.prototype.translate = function (hp, team) {
    if(this.team === team) {
        this.hp += hp;
    }
    else {
        this.hp -= hp;
        if(this.hp < 0) {
            this.team = team;
            this.hp = -this.hp;
        }
        else if(this.hp === 0) {
            this.team = 0;
        }
    }

};


function Defender(x, y, hp, move) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.move = move;
    this.team = 0;

    game.defenders.push(this);
}
Defender.prototype.update = function() {
    if(this.move)
        this.move();
    if(this.team === 0)
        return;
    for(let bullet of game.bullets) {
        if((this.x - bullet.x) * (this.x - bullet.x) + (this.y - bullet.y) * (this.y - bullet.y) <=
            (GameConst.defenderRadius + bullet.r) * (GameConst.defenderRadius + bullet.r)) {

            bullet.translate(3, this.team);
            bullet.speed -= GameConst.defenderSlowDown;
            drawThunder(this.x, this.y, bullet.x, bullet.y, this.team);
            this.hp -= 1;
            if(this.hp <= 0)
                break;
        }

    }

    if(this.hp <= 0) {
        this.hp = 0;
        this.team = 0;
    }
};
Defender.prototype.translate = function (hp, team) {
    if(this.team === team) {
        this.hp += hp;
    }
    else {
        this.hp -= hp;
        if(this.hp < 0) {
            this.team = team;
            this.hp = -this.hp;
        }
        else if(this.hp === 0) {
            this.team = 0;
        }
    }

};


function resize() {
    let width = Math.min(document.body.clientWidth * 0.9, document.body.clientHeight / GameConst.hwRate);
    GameConst.scale = width / GameConst.width;
    if(GameConst.scale < GameConst.minScale)
        GameConst.scale = GameConst.minScale;
    drawBalls();
    drawBullets();
    drawAttackers();
    drawDefenders();
    clearThunders();


}
window.onresize = resize;
function gameInit() {
    resize();
}

function levelInit(level) {
    switch (level) {
        case 1:
            game.balls.push(new Ball());
            break;
        default:
            break;
    }
}

function update() {
    game.levelCount++;

    if(game.levelCount % parseInt(120 / game.levelSpeed) === 0) {
        for(let ball of game.balls) {
            ball.update();
            ball.autoAttack();
        }

        drawBalls();

    }
    if(game.levelCount % parseInt(80 / game.levelSpeed) === 0) {
        for(let attacker of game.attackers) {
            attacker.update();
        }
        for(let defender of game.defenders) {
            defender.update();
        }
        drawAttackers();
        drawDefenders();
    }
    else if(game.levelCount % parseInt(80 / game.levelSpeed) === 2) {
        clearThunders();
    }

    for(let bullet of game.bullets) {
        bullet.update();
        drawBullets();
    }
    game.iteratorId = window.requestAnimationFrame(update);
}

function drawBalls() {
    let can = document.getElementById('balls');
    let ctx = can.getContext('2d');

    can.width = GameConst.width;
    can.height = GameConst.height;

    for(let ball of game.balls) {
        ctx.fillStyle = GameConst.teamColor[ball.team];
        ctx.strokeStyle = GameConst.teamColor[ball.team];
        ctx.lineWidth = ball.r * GameConst.scale * 0.1;

        ctx.beginPath();
        ctx.arc(ball.x * GameConst.scale, ball.y * GameConst.scale, ball.r * GameConst.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = GameConst.teamColor[ball.team];
        ctx.lineWidth = ball.r * GameConst.scale * 0.3;

        ctx.beginPath();
        ctx.arc(ball.x * GameConst.scale, ball.y * GameConst.scale, ball.r * GameConst.scale, -Math.PI / 2, Math.PI * (2 * ball.curHp / ball.maxHp - 0.5),false);
        ctx.stroke();
        ctx.font = (ball.r * GameConst.scale * 0.5).toString() + 'px';
        ctx.fillText(ball.curHp.toString(), ball.x * GameConst.scale - ball.r * GameConst.scale * 0.1 * ball.curHp.toString().length, ball.y * GameConst.scale + ball.r * GameConst.scale * 0.1);
    }
}

function redrawBall(ball) {
    let can = document.getElementById('balls');
    let ctx = can.getContext('2d');
    ctx.clearRect((ball.x - ball.r * 1.15) * GameConst.scale, (ball.y - ball.r * 1.15) * GameConst.scale, ball.r * 2.3 * GameConst.scale + 1, ball.r * 2.3 * GameConst.scale + 1);

    ctx.fillStyle = GameConst.teamColor[ball.team];
    ctx.strokeStyle = GameConst.teamColor[ball.team];
    ctx.lineWidth = ball.r * GameConst.scale * 0.1;
    ctx.moveTo(ball.x * GameConst.scale, ball.y * GameConst.scale);
    ctx.beginPath();
    ctx.arc(ball.x * GameConst.scale, ball.y * GameConst.scale, ball.r * GameConst.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = GameConst.teamColor[ball.team];
    ctx.lineWidth = ball.r * GameConst.scale * 0.3;
    ctx.moveTo(ball.x * GameConst.scale, ball.y * GameConst.scale);

    ctx.beginPath();
    ctx.arc(ball.x * GameConst.scale, ball.y * GameConst.scale, ball.r * GameConst.scale, -Math.PI / 2, Math.PI * (2 * ball.curHp / ball.maxHp - 0.5),false);
    ctx.stroke();
    ctx.font = (ball.r * GameConst.scale * 0.5).toString() + 'px';
    ctx.fillText(ball.curHp.toString(), ball.x * GameConst.scale - ball.r * GameConst.scale * 0.1 * ball.curHp.toString().length, ball.y * GameConst.scale + ball.r * GameConst.scale * 0.1);

}

function drawBullets() {
    let can = document.getElementById('bullets');
    let ctx = can.getContext('2d');

    can.width = GameConst.width;
    can.height = GameConst.height;

    for(let bullet of game.bullets) {
        ctx.strokeStyle = GameConst.teamColor[bullet.team];
        ctx.lineWidth = bullet.r * GameConst.scale * 0.03;
        for(let i = 0; i < bullet.r; i += 5) {
            for(let j = 0; j < 6; j++){
                ctx.beginPath();
                ctx.arc((bullet.x + i * Math.cos(Math.PI / 3 * j + Math.PI / 45 * i)) * GameConst.scale, (bullet.y + i * Math.sin(Math.PI / 3 * j+ Math.PI / 45 * i)) * GameConst.scale, 2.5 * GameConst.scale, 0, Math.PI * 2,false);
                ctx.stroke();
            }
        }
    }
}

function drawAttackers() {
    let can = document.getElementById('attackers');
    let ctx = can.getContext('2d');

    can.width = GameConst.width;
    can.height = GameConst.height;
    for(let attacker of game.attackers) {
        ctx.strokeStyle = '#414141';
        ctx.lineWidth = GameConst.attackerCollRadius * GameConst.scale * 0.1;
        ctx.strokeRect((attacker.x - GameConst.attackerCollRadius / 1.414) * GameConst.scale, (attacker.y - GameConst.attackerCollRadius / 1.414) * GameConst.scale,
            GameConst.attackerCollRadius * 2 / 1.414 * GameConst.scale, GameConst.attackerCollRadius * 2 / 1.414 * GameConst.scale);
        ctx.fillStyle = GameConst.teamColor[attacker.team];
        ctx.font = (attacker.r * GameConst.scale * 0.5).toString() + 'px';
        ctx.fillText(attacker.hp.toString(), attacker.x * GameConst.scale - GameConst.attackerCollRadius * GameConst.scale * 0.15 * attacker.hp.toString().length, attacker.y * GameConst.scale + GameConst.attackerCollRadius * GameConst.scale * 0.1);
    }


}

function drawDefenders() {
    let can = document.getElementById('defenders');
    let ctx = can.getContext('2d');

    can.width = GameConst.width;
    can.height = GameConst.height;

    for(let defender of game.defenders) {
        ctx.strokeStyle = '#414141';
        ctx.lineWidth = GameConst.attackerCollRadius * GameConst.scale * 0.1;
        ctx.moveTo((defender.x + GameConst.defenderCollRadius)* 0.8 * GameConst.scale, defender.y * GameConst.scale);
        ctx.beginPath();
        for(let i = 0; i < 7; i++) {

            ctx.arc(defender.x  * GameConst.scale, defender.y * GameConst.scale,
                GameConst.defenderCollRadius * GameConst.scale, i * Math.PI / 3, i * Math.PI / 3 + Math.PI / 6, false);
            ctx.arc(defender.x  * GameConst.scale, defender.y * GameConst.scale,
                GameConst.defenderCollRadius * GameConst.scale * 0.8, i * Math.PI / 3 + Math.PI / 6, (i + 1) * Math.PI / 3, false);
        }
        ctx.stroke();
        ctx.fillStyle = GameConst.teamColor[defender.team];

        ctx.font = (GameConst.defenderCollRadius * GameConst.scale * 0.3).toString() + 'px';
        ctx.fillText(defender.hp.toString(), defender.x * GameConst.scale - GameConst.defenderCollRadius * GameConst.scale * 0.15 *defender.hp.toString().length, defender.y * GameConst.scale + GameConst.defenderCollRadius * GameConst.scale * 0.1);

    }


}

function drawThunder(x1, y1, x2, y2, team) {

    let can = document.getElementById('thunder');
    let ctx = can.getContext('2d');

    ctx.strokeStyle = GameConst.teamColor[team];
    let d = Math.sqrt((x2  - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) * GameConst.scale;
    let theta;
    if(x1 === x2) {

        if(y1 < y2)
            theta = Math.PI / 2;
        else
            theta = Math.PI * 1.5;
    }
    else {
        let t = Math.atan((y2 - y1) / (x2 - x1));
        if(x2 > x1 && y2 >= y1)
            theta = t;
        else if(x2 > x1 && y2 < y1)
            theta = Math.PI * 2 + t;
        else
            theta = Math.PI + t;
    }

    ctx.beginPath();
    ctx.moveTo(x1 * GameConst.scale, y1 * GameConst.scale);
    ctx.lineTo(x1 * GameConst.scale + d / 2 * Math.cos(theta + Math.PI / 20), y1 * GameConst.scale + d / 2 * Math.sin(theta + Math.PI / 20));
    ctx.lineTo(x2 * GameConst.scale + d / 2 * Math.cos(theta  + Math.PI * 21 / 20), y2 * GameConst.scale + d / 2 * Math.sin(theta + Math.PI * 21 / 20));
    ctx.lineTo(x2 * GameConst.scale, y2 * GameConst.scale);
    ctx.stroke();



}
function clearThunders() {
    let can = document.getElementById('thunder');
    let ctx = can.getContext('2d');

    can.width = GameConst.width;
    can.height = GameConst.height;
}


new Ball(100, 100, 2, 2, 1, 0);
new Ball(500, 500, 2, 2, 150, 0);

//drawBalls();
new Bullet(300, 100, 1, 50, 0, GameConst.bulletSpeed);
drawBullets();

new Attacker(100,200,100,null);
game.attackers[0].team = 1;
//drawAttackers();

new Defender(100,500,100,null);

//drawDefenders();
clearThunders();
//drawThunder(100, 300, 100, 100, 1);

game.iteratorId = requestAnimationFrame(update);