/**
 * Created by JHT on 2017/7/22.
 */

'use strict';

let game = {
    level : 1,
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
    iteratorId : 0,
    clickPicker: 0,
    clickBall : null,
    buttons: [],
    mouseUp : {},
    beginFlag : 0,//开始界面时为0，结束界面时为2，游戏中为1，与绘制按钮有关
    success : false
};

let GameConst = {
    boundUpdateRate : 1,
    resumeUpdateRate : 1,
    teamColor :['#484848', '#80ff5d','#ff6579', '#f0bf57', '#6f63f0', '#ff5234'],
    ballRadius : [20, 35, 50, 65],
    maxHp : [[30, 45, 60],[60, 90, 120],[90, 135, 180],[150, 225, 300]],
    resumeRate : [[1, 2 ,3], [3, 4, 5], [5, 6, 7], [7, 8, 9]],//恢复速率
    bulletSpeed: 0.4,
    width : 1000,
    hwRate : 0.7, //高宽比，height = width * hwRate
    height : 700,
    attackerRadius : 150,
    defenderRadius : 150,
    defenderSlowDown : 0.04,
    attackerCollRadius : 20,
    defenderCollRadius : 20,
    scale : 1,
    moveX : 0,
    moveY : 0,
    minScale : 0.5,
    arrowLength : 15,
    maxLevel : 2,
    backgroundImg : new Image(),
    buttonImg : {},
    maxGameLevel : 18
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

    return Math.max(this.hp / 1.8, 10);
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

    drawAttackers();
    drawDefenders();
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
    if(this.curHp < this.maxHp / 2)
        return;
    switch (this.autoAttackStyle) {
        case 0:
            return;
        case 1:
            weight = (GameConst.width * GameConst.width + GameConst.height * GameConst.height) * (0.4 + 1);
            for(let ball of game.balls) {
                if(ball.team === this.team)
                    continue;
                let temp = ((this.x - ball.x) * (this.x - ball.x) + (this.y - ball.y) * (this.y - ball.y)) * (0.4 + (ball.team === 0));
                if(temp < weight && temp > 0) {
                    weight = temp;
                    target = ball;
                }
            }
            for(let attacker of game.attackers) {
                let temp = ((this.x - attacker.x) * (this.x - attacker.x) + (this.y - attacker.y) * (this.y - attacker.y)) * (0.2);
                if(temp < weight && temp > 0 && (attacker.team !== this.team || attacker.hp <= 30)) {
                    weight = temp;
                    target = attacker;
                }
            }
            for(let defender of game.defenders) {
                let temp = ((this.x - defender.x) * (this.x - defender.x) + (this.y - defender.y) * (this.y - defender.y)) * (1.4);
                if(temp < weight && temp > 0 && (defender.team !== this.team || defender.hp <= 30)) {
                    weight = temp;
                    target = defender;
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
                if(ball.team === this.team)
                    continue;
                let temp = ((this.x - ball.x) * (this.x - ball.x) + (this.y - ball.y) * (this.y - ball.y)) * (0.4 + (ball.team !== 0));
                if(temp < weight && temp > 0) {
                    weight = temp;
                    target = ball;
                }
            }
            for(let attacker of game.attackers) {
                let temp = ((this.x - attacker.x) * (this.x - attacker.x) + (this.y - attacker.y) * (this.y - attacker.y)) * (1);
                if(temp < weight && temp > 0 && (attacker.team !== this.team || attacker.hp <= 30)) {
                    weight = temp;
                    target = attacker;
                }
            }
            for(let defender of game.defenders) {
                let temp = ((this.x - defender.x) * (this.x - defender.x) + (this.y - defender.y) * (this.y - defender.y)) * (1);
                if(temp < weight && temp > 0 && (defender.team !== this.team || defender.hp <= 30)) {
                    weight = temp;
                    target = defender;
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
    if(target)
        this.attack(this.getAngle(target));
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
    if(this.curHp > parseInt(this.maxHp / 2)) {
        this.level++;
        this.curHp -= parseInt(this.maxHp / 2);
        this.maxHp = GameConst.maxHp[this.quality][this.level] * (1 + GameConst.boundUpdateRate * game.status.isBoundUpdate);
        redrawBall(this);
    }

};
Ball.prototype.translate = function (hp, team) {
    if(this.team === team)
        this.curHp += hp;
    else {
        this.curHp -= hp;
        if(this.curHp < 0) {
            this.team = team;
            this.curHp = -this.curHp;
            if(team === 1)
                this.autoAttackStyle = 0;
            else
                this.autoAttackStyle = 1;
        }
        else if(this.curHp === 0) {
            this.team = 0;
            this.autoAttackStyle = 0;
        }
    }

};
Ball.prototype.attack = function (theta) {
    if(this.hp <= 1)
        return;
    let bullet = new Bullet(this.x, this.y, this.team, parseInt(this.curHp / 2), theta, GameConst.bulletSpeed);
    bullet.x = bullet.x + (this.r + bullet.r + 1) * Math.cos(theta);
    bullet.y = bullet.y + (this.r + bullet.r + 1) * Math.sin(theta);
    this.curHp = parseInt(this.curHp / 2);
    redrawBall(this);
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
            if(this.team === bullet.team)
                continue;
            bullet.hp -= 3;
            if(bullet.speed > 0)
                bullet.speed -= GameConst.defenderSlowDown;
            drawThunder(this.x, this.y, bullet.x, bullet.y, this.team);
            this.hp -= 1;
            if(this.hp <= 0)
                break;
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


function Button(x, y, width, height, text, func, num, imgName){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.func = func;
    this.num = num;
    if(imgName) {
        this.imgName = imgName;
    }
    game.buttons.push(this);
}
Button.prototype.work = function(ball, index){
    switch(this.func)//记得判断ball = null
    {
        case 0://暂停
            break;
        case 1:
            game.buttons[index].imgName = 'speed1Chosen';
            game.buttons[index + 1].imgName = 'speed2';
            game.buttons[index + 2].imgName = 'speed3';
            break;
        case 2:
            game.levelSpeed = 2;
            game.buttons[index - 1].imgName = 'speed1';
            game.buttons[index].imgName = 'speed2Chosen';
            game.buttons[index + 1].imgName = 'speed3';
            break;
        case 3:
            game.levelSpeed = 3;
            game.buttons[index - 2].imgName = 'speed1';
            game.buttons[index - 1].imgName = 'speed2';
            game.buttons[index].imgName = 'speed3Chosen';
            break;
        case 4:
            if(ball && ball.level < GameConst.maxLevel)
                ball.levelUp();
            if(ball.level === GameConst.maxLevel)
            {
                this.num = -1;
            }
            break;
        case 5: //不作为
            if(ball)
            {
                ball.autoAttackStyle = 0;
                game.buttons[index].imgName = 'noAIChosen';
                game.buttons[index + 1].imgName = 'aggressive';
                game.buttons[index + 2].imgName = 'defence';

            }

            break;
        case 6: //攻击
            if(ball) {
                ball.autoAttackStyle = 1;
                game.buttons[index - 1].imgName = 'noAI';
                game.buttons[index].imgName = 'aggressiveChosen';
                game.buttons[index + 1].imgName = 'defence';
            }
            break;
        case 7: //防御
            if(ball)
            {
                ball.autoAttackStyle = 2;
                game.buttons[index - 2].imgName = 'noAI';
                game.buttons[index - 1].imgName = 'aggressive';
                game.buttons[index].imgName = 'defenceChosen';

            }
            break;
        case 8:
            if(ball)
            {
                for(let mball of game.balls)
                {
                    if(mball.team === 1)
                        mball.autoAttackStyle = ball.autoAttackStyle;
                }
            }
            break;
        default:
            break;
    }

    drawButtons();
};

function resize() {
    let width = Math.min(document.body.clientWidth * 0.9, document.body.clientHeight * 0.8 / GameConst.hwRate);
    GameConst.scale = width / GameConst.width;
    if(GameConst.scale < GameConst.minScale)
        GameConst.scale = GameConst.minScale;

    GameConst.moveX = (document.body.clientWidth - GameConst.width * GameConst.scale) / 2;
    if(GameConst.moveX < 0)
        GameConst.moveX = 0;
    GameConst.moveY = (document.body.clientHeight - GameConst.height * 1.2 * GameConst.scale) / 2;
    if(GameConst.moveY < 0)
        GameConst.moveY = 0;


    drawBalls();
    drawBullets();
    drawAttackers();
    drawDefenders();
    clearThunders();
    drawButtons();
    drawBackground();
    if(game.beginFlag === 0)
        drawBegin();
    else if(game.beginFlag === 2)
        drawEnd();

}
window.onresize = resize;

function update() {
    game.levelCount++;
    let isSucceed = true;
    let isFalse = true;
    if(game.levelCount % parseInt(120 / game.levelSpeed) === 0) {
        for(let ball of game.balls) {
            ball.update();
            if(ball.team === 1)
                isFalse = false;
            if(ball.team !== 1 && ball.team !== 0)
                isSucceed = false;
        }
        if(game.beginFlag === 1 && isSucceed === true)
        {
            game.success = true;
            game.level += 1;
            if(game.level > GameConst.maxGameLevel)
                game.level = 1;
            game.income += 100 * (1 + game.status.isIncomeUpdate);
            drawEnd();
            game.iteratorId = window.requestAnimationFrame(update);
            return;
        }
        if(game.beginFlag === 1 && isFalse === true)
        {
            game.success = false;
            drawEnd();
            game.iteratorId = window.requestAnimationFrame(update);
            return;
        }
        drawBalls();

    }

    if(game.levelCount % parseInt(300 / game.levelSpeed) === 0) {
        for(let ball of game.balls) {
            ball.autoAttack();
        }


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
    for(let i = 0; i < game.levelSpeed; i++) {
        for(let bullet of game.bullets) {
            bullet.update();
            drawBullets();
        }
    }

    game.iteratorId = window.requestAnimationFrame(update);

}

function drawBalls() {
    let can = document.getElementById('balls');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
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
        ctx.lineWidth = ball.r * GameConst.scale * 0.15;
        for(let i = 0; i < ball.level; i++) {
            ctx.beginPath();
            ctx.moveTo(ball.x * GameConst.scale, (ball. y - (1 - 2 * i) * ball.r) * GameConst.scale);
            ctx.lineTo(ball.x * GameConst.scale, (ball. y - (1 - 2 * i) * ball.r * 1.25) * GameConst.scale);
            ctx.stroke();
        }
    }
}

function redrawBall(ball) {
    let can = document.getElementById('balls');
    let ctx = can.getContext('2d');
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
    ctx.clearRect((ball.x - ball.r * 1.15) * GameConst.scale, (ball.y - ball.r * 1.4) * GameConst.scale, ball.r * 2.3 * GameConst.scale + 1, ball.r * 2.8 * GameConst.scale + 1);

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

    ctx.lineWidth = ball.r * GameConst.scale * 0.15;
    for(let i = 0; i < ball.level; i++) {
        ctx.beginPath();
        ctx.moveTo(ball.x * GameConst.scale, (ball. y - (1 - 2 * i) * ball.r) * GameConst.scale);
        ctx.lineTo(ball.x * GameConst.scale, (ball. y - (1 - 2 * i) * ball.r * 1.25) * GameConst.scale);
        ctx.stroke();
    }
}

function drawBullets() {
    let can = document.getElementById('bullets');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
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

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
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

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
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
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
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

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
}

function drawArrow(ball, x, y) {
    let can = document.getElementById('arrow');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = GameConst.teamColor[1];
    let target = {x: x, y : y};
    let theta = ball.getAngle(target);
    let center = {x: ball.x, y : ball.y};

    for (let i = 0; i < 3; i++) {
        center.x = ball.x + i * 1.5 * GameConst.arrowLength * Math.cos(theta);
        center.y = ball.y + i * 1.5 * GameConst.arrowLength * Math.sin(theta);

        ctx.beginPath();
        ctx.moveTo((center.x + ball.r * Math.cos(theta - Math.PI / 15)) * GameConst.scale, (center.y + ball.r * Math.sin(theta - Math.PI / 15)) * GameConst.scale);
        ctx.arc(center.x * GameConst.scale, center.y * GameConst.scale, ball.r * GameConst.scale, theta - Math.PI / 15, theta + Math.PI / 15, false);
        ctx.lineTo((center.x + ball.r * Math.cos(theta + Math.PI / 15) + GameConst.arrowLength * Math.cos(theta)) * GameConst.scale,
            (center.y + ball.r * Math.sin(theta + Math.PI / 15) + GameConst.arrowLength * Math.sin(theta)) * GameConst.scale);
        ctx.lineTo((center.x + (ball.r + GameConst.arrowLength * 1.2) * Math.cos(theta)) * GameConst.scale, (center.y + (ball.r + GameConst.arrowLength * 1.2) * Math.sin(theta)) * GameConst.scale);
        ctx.lineTo((center.x + ball.r * Math.cos(theta - Math.PI / 15) + GameConst.arrowLength * Math.cos(theta)) * GameConst.scale,
            (center.y + ball.r * Math.sin(theta - Math.PI / 15) + GameConst.arrowLength * Math.sin(theta)) * GameConst.scale);
        ctx.closePath();
        ctx.fill();
    }




}
function clearArrow() {
    let can = document.getElementById('arrow');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
}

function drawButtons() {
    let can = document.getElementById('buttons');
    let ctx = can.getContext('2d');
    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale * 6 / 5;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
    if(game.beginFlag === 1) {
        let h = can.height / 6;
        for(let i = 0; i < h; i++) {
            ctx.drawImage(GameConst.buttonImg.bg_footer, 0, GameConst.height * GameConst.scale + i, GameConst.width *GameConst.scale, 1);
        }

    }
    if(game.clickPicker !== 1 && game.beginFlag === 1)
    {
        for (let button of game.buttons) {
            if(! button.imgName) {
                ctx.fillStyle = "#0000FF";
                if(button.num > 0) {
                    if (button.func !== -1) {
                        ctx.beginPath();
                        ctx.moveTo(button.x * GameConst.scale, button.y * GameConst.scale);
                        ctx.strokeRect(button.x * GameConst.scale, button.y * GameConst.scale, button.width * GameConst.scale, button.height * GameConst.scale);
                        ctx.stroke();
                    }
                    ctx.font = (button.height * GameConst.scale * 0.5).toString() + 'px';
                    ctx.fillText(button.text, (button.x + button.width * 0.1) * GameConst.scale, (button.y + button.height * 0.6) * GameConst.scale);
                }
            }
            else if(button.num > 0) {
                ctx.drawImage(GameConst.buttonImg[button.imgName], button.x * GameConst.scale, button.y * GameConst.scale, button.width * GameConst.scale, button.height * GameConst.scale);
            }

        }
        return;
    }
    for (let button of game.buttons) {
        if(! button.imgName) {
            ctx.fillStyle = "#0000FF";
            if(button.num !== -1) {
                if (button.func !== -1) {
                    ctx.beginPath();
                    ctx.moveTo(button.x * GameConst.scale, button.y * GameConst.scale);
                    ctx.strokeRect(button.x * GameConst.scale, button.y * GameConst.scale, button.width * GameConst.scale, button.height * GameConst.scale);
                    ctx.stroke();
                }
                ctx.font = (button.height * GameConst.scale * 0.5).toString() + 'px';
                ctx.fillText(button.text, (button.x + button.width * 0.1) * GameConst.scale, (button.y + button.height * 0.6) * GameConst.scale);
            }
        }
        else if(button.num !== -1) {
            ctx.drawImage(GameConst.buttonImg[button.imgName], button.x * GameConst.scale, button.y * GameConst.scale, button.width * GameConst.scale, button.height * GameConst.scale);
        }

    }

}

game.iteratorId = requestAnimationFrame(update);

document.onmousedown = function(event){
    let pre = event || window.event;
    let e = {
        clientX : pre.clientX - GameConst.moveX,
        clientY : pre.clientY - GameConst.moveY
    };

    if(game.beginFlag === 1) {
        let ai = [];
        for (let button of game.buttons) {
            if(button.text === 'noAI') {
                ai[0] = button;
            }
            else if(button.text === 'aggressive') {
                ai[1] = button;
            }
            else if(button.text === 'defence') {
                ai[2] = button;
            }
            if (e.clientX > button.x * GameConst.scale && e.clientX < (button.x + button.width) * GameConst.scale && e.clientY > button.y * GameConst.scale && e.clientY < (button.y + button.height) * GameConst.scale) {
                button.work(game.clickBall, game.buttons.indexOf(button));
                return;
            }
        }
        if(e.clientX >= 0 && e.clientX <= GameConst.width * GameConst.scale && e.clientY >= 0 && e.clientY <= GameConst.height * GameConst.scale) {
            game.clickPicker = 0;//清空选中
            game.clickBall = null;
        }
        for (let ball of game.balls) {
            if (ball.team === 1 && (e.clientX - ball.x * GameConst.scale) * (e.clientX - ball.x * GameConst.scale) + (e.clientY - ball.y * GameConst.scale) * (e.clientY - ball.y * GameConst.scale) <= ball.r * ball.r * GameConst.scale * GameConst.scale) {
                document.onmousemove = function (event) {
                    let pre = event || window.event;
                    let e = {
                        clientX : pre.clientX - GameConst.moveX,
                        clientY : pre.clientY - GameConst.moveY
                    };

                    drawArrow(ball, e.clientX / GameConst.scale, e.clientY / GameConst.scale);

                };
                game.clickPicker = 1;
                game.clickBall = ball;
                break;
            }
        }

        drawButtons();
    }
    if(game.beginFlag === 0)
    {
        for (let button of game.buttons) {
            if (e.clientX > button.x * GameConst.scale && e.clientX < (button.x + button.width) * GameConst.scale && e.clientY > button.y * GameConst.scale && e.clientY < (button.y + button.height) * GameConst.scale) {
                if(button.num === 1) {
                   game.level += 1;
                   if(game.level > GameConst.maxGameLevel)
                       game.level = 1;
                   drawBegin();
                   return;
               }
               else if(button.num === 2)
                {
                    game.level -= 1;
                    if(game.level < 1)
                        game.level = GameConst.maxGameLevel;
                    drawBegin();
                    return;
                }
               else
               {
                   if(game.level > 0 && game.level <= GameConst.maxGameLevel)
                   {
                       levelInit(game.level);
                       clearBegin();
                       return;
                   }
               }
            }
        }
    }
    if(game.beginFlag === 2)
    {
        for (let button of game.buttons) {
            if (e.clientX > button.x * GameConst.scale && e.clientX < (button.x + button.width) * GameConst.scale && e.clientY > button.y * GameConst.scale && e.clientY < (button.y + button.height) * GameConst.scale) {
               console.log(button.num);

                switch(button.num)
                {
                    case 1:
                        if(game.income >= 200) {
                            game.status.isBoundUpdate = true;
                            game.income -= 200;
                        }
                        drawEnd();
                        break;
                    case 2:
                        if(game.income >= 200) {
                             game.status.isIncomeUpdate = true;
                            game.income -= 200;
                        }
                        drawEnd();
                        break;
                    case 3:
                        if(game.income >= 200) {
                            game.status.isResumeUpdate = true;
                            game.income -= 200;
                        }
                        drawEnd();
                        break;
                    case 4:
                        levelInit(game.level);
                        break;
                    default:
                        break;
                }
                return;
            }
        }
    }
};

document.onmouseup = function(event){
    let pre = event || window.event;
    let e = {
        clientX : pre.clientX - GameConst.moveX,
        clientY : pre.clientY - GameConst.moveY
    };
    document.onmousemove =null;
    clearArrow();
    if(game.clickPicker === 1)
    {
        game.mouseUp.x = e.clientX / GameConst.scale;
        game.mouseUp.y = e.clientY / GameConst.scale;
        if(game.mouseUp.x > GameConst.width || game.mouseUp.x < 0 || game.mouseUp.y < 0 || game.mouseUp.y > GameConst.height)
            return;
        if(game.clickBall !== null && game.clickBall.team === 1 && ((game.clickBall.x - game.mouseUp.x)*(game.clickBall.x - game.mouseUp.x) + (game.clickBall.y - game.mouseUp.y)*(game.clickBall.y - game.mouseUp.y) > game.clickBall.r*game.clickBall.r))
        {
            game.clickBall.attack(game.clickBall.getAngle(game.mouseUp));

        }

    }
};

(function gameInit() {
    GameConst.backgroundImg.src = "res/bg.jpg";
    GameConst.backgroundImg.onload = resize;

    GameConst.buttonImg.title = new Image();
    GameConst.buttonImg.title.src = 'res/title.png';
    GameConst.buttonImg.up = new Image();
    GameConst.buttonImg.up.src = 'res/up.png';
    GameConst.buttonImg.down = new Image();
    GameConst.buttonImg.down.src = 'res/down.png';
    GameConst.buttonImg.play = new Image();
    GameConst.buttonImg.play.src = 'res/play.png';
    GameConst.buttonImg.speed1 = new Image();
    GameConst.buttonImg.speed1.src = 'res/speed1.png';
    GameConst.buttonImg.speed2 = new Image();
    GameConst.buttonImg.speed2.src = 'res/speed2.png';
    GameConst.buttonImg.speed3 = new Image();
    GameConst.buttonImg.speed3.src = 'res/speed3.png';
    GameConst.buttonImg.speed1Chosen = new Image();
    GameConst.buttonImg.speed1Chosen.src = 'res/speed1Chosen.png';
    GameConst.buttonImg.speed2Chosen = new Image();
    GameConst.buttonImg.speed2Chosen.src = 'res/speed2Chosen.png';
    GameConst.buttonImg.speed3Chosen = new Image();
    GameConst.buttonImg.speed3Chosen.src = 'res/speed3Chosen.png';
    GameConst.buttonImg.noAI = new Image();
    GameConst.buttonImg.noAI.src = 'res/noAI.png';
    GameConst.buttonImg.noAIChosen = new Image();
    GameConst.buttonImg.noAIChosen.src = 'res/noAIChosen.png';
    GameConst.buttonImg.defence = new Image();
    GameConst.buttonImg.defence.src = 'res/defence.png';
    GameConst.buttonImg.defenceChosen = new Image();
    GameConst.buttonImg.defenceChosen.src = 'res/defenceChosen.png';
    GameConst.buttonImg.aggressive = new Image();
    GameConst.buttonImg.aggressive.src = 'res/aggressive.png';
    GameConst.buttonImg.aggressiveChosen = new Image();
    GameConst.buttonImg.aggressiveChosen.src = 'res/aggressiveChosen.png';
    GameConst.buttonImg.replay = new Image();
    GameConst.buttonImg.replay.src = 'res/replay.png';
    GameConst.buttonImg.continue = new Image();
    GameConst.buttonImg.continue.src = 'res/continue.png';
    GameConst.buttonImg.applyToAll = new Image();
    GameConst.buttonImg.applyToAll.src = 'res/applyToAll.png';
    GameConst.buttonImg.levelUp = new Image();
    GameConst.buttonImg.levelUp.src = 'res/levelUp.png';
    GameConst.buttonImg.incomeUpdate = new Image();
    GameConst.buttonImg.incomeUpdate.src = 'res/incomeUpdate.png';
    GameConst.buttonImg.resumeUpdate = new Image();
    GameConst.buttonImg.resumeUpdate.src = 'res/resumeUpdate.png';
    GameConst.buttonImg.boundUpdate = new Image();
    GameConst.buttonImg.boundUpdate.src = 'res/boundUpdate.png';

    GameConst.buttonImg.bg_footer = new Image();
    GameConst.buttonImg.bg_footer.src = 'res/bg_footer.png';
    GameConst.buttonImg.title.onload = function () {
        let can = document.getElementById('begin');
        let ctx = can.getContext('2d');
        ctx.drawImage(GameConst.buttonImg.title, GameConst.width * 0.3 * GameConst.scale, GameConst.height / 12 * 2 * GameConst.scale, 334 * GameConst.scale, 90 * GameConst.scale);

    };
    GameConst.buttonImg.play.onload = drawButtons;



})();

function levelInit(level) {
    game.balls = [];
    game.bullets = [];
    game.attackers = [];
    game.defenders = [];
    game.levelSpeed = 1;
    game.clickPicker = 0;
    game.clickBall = null;
    game.beginFlag = 1;
    game.buttons = [];
    game.success = false;
    game.levelCount = 0;

    drawButtons();
    clearArrow();
    drawAttackers();
    drawBalls();
    drawBullets();
    drawDefenders();
    clearThunders();
    clearBegin();
    clearEnd();
    new Button(40, GameConst.height + 45, 40, 40, "一倍速", 1, 1, 'speed1Chosen');
    new Button(40 * 2, GameConst.height + 45, 40, 40, "二倍速", 2, 2, 'speed2');
    new Button(40 * 3, GameConst.height + 45,  40, 40, "三倍速", 3, 3, 'speed3');
    new Button(560, GameConst.height + 5, 60, 30, "攻击策略:", -1, 0);
    new Button(560, GameConst.height + 40, 138, 23, "noAI", 5, 0, 'noAIChosen');

    new Button(560, GameConst.height + 63, 138, 23, "aggressive", 6, 0,'aggressive');
    new Button(560, GameConst.height + 86, 138, 23, "defence", 7, 0,'defence');
    new Button(740, GameConst.height + 38, 74, 78, "全部应用", 8, 0,'applyToAll');

    new Button(875, GameConst.height + 45, 118, 30, "升级", 4, 0, 'levelUp');

    switch (level) {
        case 1:
            new Ball(200, 200, 3, 1, 80, 0);
            new Ball(500, 500, 2, 2, 40, 1);
            resize();
            break;
        case 2:
            new Ball(200, 400, 3, 1, 70, 0);
            new Ball(600, 200, 2, 2, 30, 1);
            new Ball(600, 600, 2, 3, 30, 1);
            resize();
            break;
        case 3:
            new Ball(400, 400, 3, 1, 80, 0);
            new Ball(200, 300, 2, 2, 30, 1);
            new Ball(300, 600, 2, 3, 30, 1);
            new Ball(500, 100, 2, 4, 30, 1);
            new Ball(600, 500, 2, 1, 40, 0);
            resize();
            break;
        case 4:
            new Ball(100, 400, 3, 1, 70, 0);
            new Ball(400, 400, 2, 0, 30, 0);
            new Ball(700, 400, 3, 2, 70, 1);
            resize();
            break;
        case 5:
            new Ball(200, 400, 2, 1, 40, 0);
            new Ball(400, 400, 3, 0, 35, 0);
            new Ball(700, 400, 2, 2, 60, 1);
            resize();
            break;
        case 6:
            new Ball(100, 400, 3, 1, 70, 0);
            new Ball(600, 400, 1, 0, 15, 0);
            new Ball(700, 200, 2, 2, 40, 1);
            new Ball(700, 500, 2, 3, 40, 1);
            resize();
            break;
        case 7:
            new Ball(75, 400, 2, 1, 50, 0);
            new Ball(125, 200, 2, 1, 50, 0);
            new Ball(125, 600, 2, 1, 50, 0);
            new Ball(400, 200, 1, 0, 17, 0);
            new Ball(400, 400, 3, 0, 35, 0);
            new Ball(400, 600, 1, 0, 17, 0);
            new Ball(725, 200, 2, 2, 50, 1);
            new Ball(675, 400, 2, 3, 50, 1);
            new Ball(725, 600, 2, 2, 50, 1);
            resize();
            break;
        case 8:
            new Ball(100, 600, 1, 2, 30, 1);
            new Ball(200, 550, 1, 0, 15, 0);
            new Ball(150, 200, 1, 0, 15, 0);
            new Ball(325, 500, 1, 1, 35, 0);
            new Ball(325, 275, 1, 0, 15, 0);
            new Ball(450, 450, 1, 0, 15, 0);
            new Ball(550, 300, 2, 1, 50, 0);
            new Ball(625, 550, 1, 0, 15, 0);
            new Ball(725, 600, 1, 0, 15, 0);
            new Ball(675, 200, 1, 0, 15, 0);
            new Ball(800, 100, 1, 3, 30, 1);
            resize();
            break;
        case 9:
            new Ball(100, 400, 3, 1, 70, 0);
            new Ball(400, 300, 2, 0, 16, 0);
            new Ball(600, 300, 1, 0, 9, 0);
            new Ball(400, 500, 1, 0, 9, 0);
            new Ball(600, 500, 1, 0, 9, 0);
            new Ball(900, 400, 2, 2, 40, 1);
            new Attacker(500, 400, 10, null);
            resize();
            break;
        case 10:
            new Ball(100, 400, 3, 1, 70, 0);
            new Ball(300, 350, 2, 0, 16, 0);
            new Ball(500, 300, 1, 0, 11, 0);
            new Ball(650, 450, 2, 0, 16, 0);
            new Ball(900, 400, 2, 2, 62, 1);
            new Defender(400, 400, 10, null);
            new Defender(600, 300, 10, null);
            resize(450, 350, 10, null);
            break;
        case 11:
            new Ball(100, 400, 3, 1, 70, 0);
            new Ball(300, 400, 1, 0, 11, 0);
            new Ball(600, 350, 1, 0, 11, 0);
            new Ball(800, 400, 3, 2, 60, 1);
            new Ball(400, 650, 1, 0, 11, 0);
            new Ball(500, 550, 2, 3, 50, 1);
            new Ball(400, 200, 1, 0, 11, 0);
            new Ball(500, 150, 1, 0, 11, 0);
            new Ball(600, 100, 2, 4, 50, 1);
            new Attacker(400, 400, 10, null);
            new Defender(400, 550, 10, null);
            new Defender(700, 300, 10, null);
            resize();
            break;
        case 12:
            new Ball(100, 100, 3, 1, 60, 0);
            new Ball(900, 100, 3, 2, 50, 1);
            new Ball(100, 600, 3, 3, 50, 1);
            new Ball(900, 600, 3, 4, 50, 1);

            new Ball(500, 170, 3, 0, 50, 0);
            new Ball(500, 350, 3, 0, 50, 0);
            new Ball(500, 530, 3, 0, 50, 0);

            new Ball(250, 100, 1, 0, 10, 0);
            new Ball(100, 250, 1, 0, 10, 0);
            new Ball(200, 200, 1, 0, 10, 0);

            new Ball(750, 100, 1, 0, 10, 0);
            new Ball(900, 250, 1, 0, 10, 0);
            new Ball(800, 200, 1, 0, 10, 0);

            new Ball(250, 600, 1, 0, 10, 0);
            new Ball(100, 450, 1, 0, 10, 0);
            new Ball(200, 500, 1, 0, 10, 0);

            new Ball(750, 600, 1, 0, 10, 0);
            new Ball(900, 450, 1, 0, 10, 0);
            new Ball(800, 500, 1, 0, 10, 0);
            resize();
            break;
        case 13:
            new Ball(500, 100, 2, 2, 30, 1);
            new Ball(500, 250, 1, 0, 10, 0);
            new Ball(500, 400, 3, 1, 55, 0);
            new Ball(500, 550, 1, 0, 10, 0);
            new Ball(400, 200, 1, 0, 10, 0);
            new Ball(600, 200, 1, 0, 10, 0);
            new Ball(300, 500, 1, 0, 10, 0);
            new Ball(700, 500, 1, 0, 10, 0);
            new Ball(100, 600, 2, 3, 30, 1);
            new Ball(900, 600, 2, 3, 30, 1);
            new Attacker(200, 450, 10, null);
            new Defender(800, 450, 10, null);
            resize();
            break;
        case 14:
            new Ball(100, 100, 2, 2, 40, 1);
            new Ball(200, 150, 1, 0, 10, 0);
            new Ball(300, 250, 1, 0, 10, 0);

            new Ball(500, 350, 3, 1, 50, 0);

            new Ball(700, 450, 1, 0, 10, 0);
            new Ball(800, 550, 1, 0, 10, 0);
            new Ball(900, 650, 2, 2, 40, 1);

            new Ball(200, 600, 2, 3, 30, 1);
            new Ball(150, 450, 1, 0, 10, 0);
            new Ball(400, 550, 1, 0, 10, 0);

            new Ball(800, 200, 2, 3, 30, 1);
            new Ball(750, 300, 1, 0, 10, 0);
            new Ball(650, 150, 1, 0, 10, 0);
            resize();
            break;
        case 15:
            new Ball(100, 100, 2, 2, 15, 1);
            new Ball(50, 250, 1, 0, 10, 0);
            new Attacker(200, 350, 10, null)
            new Ball(300, 350, 1, 0, 10, 0);
            new Ball(150, 450, 1, 0, 10, 0);
            new Ball(100, 600, 3, 1, 30, 0);

            new Ball(500, 200, 3, 0, 10, 0);
            new Ball(500, 400, 3, 0, 10, 0);
            new Ball(500, 600, 3, 0, 10, 0);

            new Ball(900, 100, 2, 2, 15, 1);
            new Ball(750, 250, 1, 0, 10, 0);
            new Defender(800,350,10,null);
            new Ball(650, 350, 1, 0, 10, 0);
            new Ball(750, 450, 1, 0, 10, 0);
            new Ball(900, 600, 3, 1, 30, 0);
            resize();
            break;
        case 16:
            new Ball(100, 100, 2, 1, 40, 0);
            new Ball(100, 600, 2, 1, 40, 0);
            new Ball(900, 100, 2, 2, 30, 1);
            new Ball(900, 600, 2, 3, 30, 1);

            new Ball(500, 100, 2, 0, 25, 0);
            new Ball(600, 325, 2, 4, 30, 1);
            new Ball(500, 600, 2, 5, 30, 1);

            new Defender(800, 350, 10, null);

            new Ball(250, 100, 1, 0, 10, 0);
            new Ball(350, 200, 1, 0, 10, 0);
            new Ball(400, 300, 1, 0, 10, 0);
            new Ball(400, 400, 1, 0, 10, 0);
            new Ball(350, 500, 1, 0, 10, 0);
            new Ball(250, 600, 1, 0, 10, 0);

            new Ball(750, 100, 1, 0, 10, 0);
            new Ball(650, 200, 1, 0, 10, 0);
            new Ball(650, 500, 1, 0, 10, 0);
            new Ball(700, 600, 1, 0, 10, 0);
            new Ball(850, 200, 1, 0, 10, 0);
            new Ball(850, 500, 1, 0, 10, 0);

            resize();
            break;
        case 17:
            new Ball(100, 100, 2, 2, 35, 1);
            new Ball(900, 150, 2, 2, 30, 1);
            new Ball(100, 600, 2, 2, 30, 1);
            new Ball(900, 600, 2, 3, 50, 1);
            new Ball(500, 350, 3, 1, 60, 0);

            new Ball(200, 150, 1, 0, 10, 0);
            new Ball(300, 250, 1, 0, 10, 0);
            new Ball(800, 150, 1, 0, 10, 0);
            new Attacker(625, 200, 10, null);

            new Attacker(375, 500, 10, null);
            new Ball(200, 550, 1, 0, 10, 0);
            new Ball(700, 450, 1, 0, 10, 0);
            new Ball(800, 550, 1, 0, 10, 0);
            resize();
            break;
        case 18:
            new Ball(100, 200, 2, 2, 30, 1);
            new Ball(200, 300, 1, 0, 10, 0);
            new Ball(300, 150, 1, 0, 10, 0);
            new Ball(350, 500, 1, 0, 10, 0);

            new Ball(500, 100, 3, 1, 40, 0);
            new Ball(500, 300, 2, 0, 20, 0);
            new Attacker(500, 450, 10, null);
            new Ball(500, 600, 2, 3, 30, 1);

            new Ball(900, 200, 2, 2, 30, 1);
            new Ball(800, 300, 1, 0, 10, 0);
            new Ball(700, 150, 1, 0, 10, 0);
            new Ball(650, 500, 1, 0, 10, 0);
            resize();
            break;
        default:
            break;
    }
}

function drawBegin() {
    let can = document.getElementById('begin');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
    ctx.drawImage(GameConst.buttonImg.title, GameConst.width * 0.3 * GameConst.scale, GameConst.height / 12 * 2 * GameConst.scale, 334 * GameConst.scale, 90 * GameConst.scale);

    ctx.fillStyle = "#ffd956";
    ctx.font = parseInt(GameConst.width * GameConst.scale * 0.03).toString() +"px sans-serif";
    ctx.fillText("Choose Level :  "+game.level, GameConst.scale * GameConst.width / 3, GameConst.scale * GameConst.height / 3 * 2);
    new Button(GameConst.width * 0.52, GameConst.height * 0.56, GameConst.width / 12, GameConst.height / 24, "level up", -1, 1, 'up');
    new Button(GameConst.width * 0.52, GameConst.height * 0.7, GameConst.width / 12, GameConst.height / 24, "level down", -1, 2, 'down');
    new Button(GameConst.width / 12 * 5, GameConst.height / 12 * 9, GameConst.width / 6, GameConst.height / 18, "start", -1, 3, 'play');
    drawButtons();
}
function clearBegin() {
    let can = document.getElementById('begin');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
}
function drawBackground() {
    let can = document.getElementById('background');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';

    ctx.drawImage(GameConst.backgroundImg, 0, 0, GameConst.width *GameConst.scale, GameConst.height * GameConst.scale);

}
function clearBackground() {
    let can = document.getElementById('background');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
}
function drawEnd() {
    game.balls = [];
    game.bullets = [];
    game.attackers = [];
    game.defenders = [];
    game.levelSpeed = 1;
    game.clickPicker = 0;
    game.clickBall = null;
    game.beginFlag = 2;
    game.buttons = [];
    game.levelCount = 0;
    drawButtons();
    clearArrow();
    drawAttackers();
    drawBalls();
    drawBullets();
    drawDefenders();
    clearThunders();
    let can = document.getElementById('end');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;


    can.style.left = GameConst.moveX.toString() + 'px';
    can.style.top = GameConst.moveY.toString() + 'px';
    if(game.status.isBoundUpdate === false) {
        new Button(327, GameConst.height / 12 * 7, 47, 47, "BoundUpdate(200)", 0, 1, 'boundUpdate');
    }
    if(game.status.isIncomeUpdate === false)
        new Button(477, GameConst.height / 12 * 7, 47, 47, "IncomeUpdate(200)", 0, 2, 'incomeUpdate');
    if(game.status.isResumeUpdate === false)
        new Button(627,GameConst.height / 12 * 7,47, 47, "ResumeUpdate(200)", 0, 3, 'resumeUpdate');
    ctx.fillStyle = "#ffd956";
    ctx.font = (GameConst.width * GameConst.scale * 0.01).toString() +"px sans-serif";
    ctx.fillText("血上限升级(200)", 302 * GameConst.scale, GameConst.height / 24 * 13 * GameConst.scale);
    ctx.fillText("收入升级(200)", 452 * GameConst.scale, GameConst.height / 24 * 13 * GameConst.scale);
    ctx.fillText("回复升级(200)", 602 * GameConst.scale, GameConst.height / 24 * 13 * GameConst.scale);
    ctx.fillStyle = "#ffd956";
    ctx.font = parseInt(GameConst.width * GameConst.scale * 0.04).toString() +"px sans-serif";
    ctx.fillText("Your Income : " + game.income, GameConst.width * 0.3 * GameConst.scale, GameConst.height / 12 * 2 * GameConst.scale);
    new Button(GameConst.width / 12 * 5, GameConst.height / 12 * 10, 180, 80, "continue", 0, 4, 'continue');
    drawButtons();

}
function clearEnd() {
    let can = document.getElementById('end');
    let ctx = can.getContext('2d');

    can.width = GameConst.width * GameConst.scale;
    can.height = GameConst.height * GameConst.scale;
}