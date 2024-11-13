var line_height = 30;
var brick_width = 100;
var bg_color = { r: 18, g: 18, b: 18 };
var brick_color = { r: 180, g: 25, b: 25 };
var brick_color2 = { r: 25, g: 25, b: 180 };
var ball_color = { r: 200, g: 200, b: 200 };
var ball_radius = 10;
var player_color = { r: 25, g: 180, b: 25 };
var line_add_interval = 6;
var line_oddity = false;
var next_line_color = brick_color;
var paused = false;
var game_over = false;
var lines = [];
var game_time = 0;
var previous_time = 0;
var previous_line_add = 0;
var ctx;
var ball_position;
var ball_velocity;
var player_position;
var player_velocity = 0;
var score = 0;
var score_element;
function drawBrick(ctx, x, y, color) {
    ctx.fillStyle = "rgb(".concat(color.r, " ").concat(color.g, " ").concat(color.b);
    ctx.fillRect(x + 1, y + 1, brick_width - 2, line_height - 2);
}
function drawLine(ctx, line) {
    var y = line.position * line_height;
    var x = 0;
    for (var i = 0; i < line.bricks.length; i++) {
        x = line.bricks[i] * brick_width;
        if (line.odd) {
            x -= brick_width / 2;
        }
        drawBrick(ctx, x, y, line.color);
    }
}
function fillCircle(ctx, c, r, color) {
    ctx.fillStyle = "rgb(".concat(color.r, " ").concat(color.g, " ").concat(color.b);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
}
function drawBall(ctx, ball) {
    fillCircle(ctx, ball, ball_radius, ball_color);
}
function newLine(width) {
    var res = {
        odd: line_oddity,
        position: 0,
        color: next_line_color,
        bricks: []
    };
    for (var i = 0; i < Math.floor(width / brick_width); ++i) {
        res.bricks.push(i);
    }
    if (res.odd) {
        res.bricks.push(Math.floor(width / brick_width));
    }
    line_oddity = !line_oddity;
    if (next_line_color === brick_color) {
        next_line_color = brick_color2;
    }
    else {
        next_line_color = brick_color;
    }
    return res;
}
function clearBackground(ctx, bg) {
    ctx.fillStyle = "rgb(".concat(bg.r, " ").concat(bg.g, " ").concat(bg.b);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
function init() {
    paused = false;
    game_over = false;
    lines = [];
    score = 0;
    lines.push(newLine(ctx.canvas.width));
    ball_position = { x: Math.floor(ctx.canvas.width / 2), y: ctx.canvas.height / 2 - ball_radius };
    ball_velocity = { x: 200, y: -200 };
    player_position = { x: (ctx.canvas.width - brick_width) / 2, y: ctx.canvas.height - line_height };
    player_velocity = 0;
    onkeydown = function (e) {
        if (e.code === "KeyL") {
            player_velocity = 350;
        }
        if (e.code === "KeyK") {
            player_velocity = -350;
        }
    };
    onkeyup = function (e) {
        if (e.code === "KeyL") {
            player_velocity = 0;
        }
        if (e.code === "KeyK") {
            player_velocity = 0;
        }
    };
    score_element = document.getElementById("score");
    score_element.innerHTML = "Score: 0";
}
window.onload = function () {
    var pauseButton = document.getElementById("pause-button");
    pauseButton.innerHTML = paused ? "Start" : "Pause";
    pauseButton.addEventListener("click", function (_e) {
        paused = !paused;
        pauseButton.innerHTML = paused ? "Start" : "Pause";
    });
    var restart_button = document.getElementById("restart-button");
    restart_button.addEventListener("click", init);
    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    init();
    window.requestAnimationFrame(gameLoop);
};
function getPossiblyCollidingLines(lines, ball) {
    if (ball_position.y + ball_radius >= (lines[0].position + 1) * line_height) {
        return lines.filter(function (line) {
            return Math.abs(line.position - Math.floor(ball.y / line_height)) <= 1;
        });
    }
    else {
        return [];
    }
}
var RectCircleCollisionResult;
(function (RectCircleCollisionResult) {
    RectCircleCollisionResult[RectCircleCollisionResult["None"] = 0] = "None";
    RectCircleCollisionResult[RectCircleCollisionResult["HorizontalFace"] = 1] = "HorizontalFace";
    RectCircleCollisionResult[RectCircleCollisionResult["VerticalFace"] = 2] = "VerticalFace";
    RectCircleCollisionResult[RectCircleCollisionResult["Corner"] = 3] = "Corner";
})(RectCircleCollisionResult || (RectCircleCollisionResult = {}));
;
function rectCircleCollision(pos, dim, c, r) {
    var distance = {
        x: Math.abs(c.x - pos.x - dim.x / 2),
        y: Math.abs(c.y - pos.y - dim.y / 2)
    };
    if (distance.x > (dim.x / 2 + r))
        return RectCircleCollisionResult.None;
    if (distance.y > (dim.y / 2 + r))
        return RectCircleCollisionResult.None;
    if (distance.x <= dim.x / 2)
        return RectCircleCollisionResult.HorizontalFace;
    if (distance.y <= dim.y / 2)
        return RectCircleCollisionResult.VerticalFace;
    var cornerDistance = Math.pow(distance.x - dim.x / 2, 2) + Math.pow(distance.y - dim.y / 2, 2);
    if (cornerDistance <= r * r)
        return RectCircleCollisionResult.Corner;
    return RectCircleCollisionResult.None;
}
function gameLoop(time) {
    var dt = (time - previous_time) / 1000;
    previous_time = time;
    if (!paused && !game_over) {
        game_time += dt;
    }
    else {
        dt = 0;
    }
    if (game_over) {
        ctx.font = "100px Serif";
        ctx.fillStyle = "white";
        ctx.fillText("GAME OVER!", (ctx.canvas.width - 600) / 2, ctx.canvas.height / 2, 600);
    }
    else {
        ball_position.x += dt * ball_velocity.x;
        ball_position.y += dt * ball_velocity.y;
        if (ball_position.x + ball_radius >= ctx.canvas.width) {
            ball_velocity.x = -ball_velocity.x;
            ball_position.x = ctx.canvas.width - ball_radius;
        }
        if (ball_position.x - ball_radius <= 0) {
            ball_velocity.x = -ball_velocity.x;
            ball_position.x = ball_radius;
        }
        if (ball_position.y + ball_radius >= ctx.canvas.height) {
            game_over = true;
        }
        if (ball_position.y - ball_radius <= 0) {
            ball_velocity.y = -ball_velocity.y;
            ball_position.y = ball_radius;
        }
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            for (var i = line.bricks.length - 1; i >= 0; --i) {
                var x = line.bricks[i] * brick_width;
                if (line.odd) {
                    x -= brick_width / 2;
                }
                var y = line.position * line_height;
                var collision_1 = rectCircleCollision({ x: x, y: y }, { x: brick_width, y: line_height }, ball_position, ball_radius);
                if (collision_1 != RectCircleCollisionResult.None) {
                    line.bricks.splice(i, 1);
                    score += 1;
                    score_element.innerHTML = "Score: ".concat(score);
                    if (collision_1 === RectCircleCollisionResult.HorizontalFace) {
                        ball_velocity.y = -ball_velocity.y;
                        if (ball_position.y < y) {
                            ball_position.y = y - ball_radius;
                        }
                        else {
                            ball_position.y = y + line_height + ball_radius;
                        }
                    }
                    if (collision_1 === RectCircleCollisionResult.VerticalFace) {
                        ball_velocity.x = -ball_velocity.x;
                        if (ball_position.x < x) {
                            ball_position.x = x - ball_radius;
                        }
                        else {
                            ball_position.x = x + brick_width + ball_radius;
                        }
                    }
                    if (collision_1 === RectCircleCollisionResult.Corner) {
                        ball_velocity.y = -ball_velocity.y;
                        ball_velocity.x = -ball_velocity.x;
                    }
                }
            }
        }
        var collision = rectCircleCollision(player_position, { x: brick_width, y: line_height }, ball_position, ball_radius);
        if (collision != RectCircleCollisionResult.None) {
            if (collision === RectCircleCollisionResult.HorizontalFace) {
                ball_velocity.y = -ball_velocity.y;
                ball_position.y = player_position.y - ball_radius;
            }
            if (collision === RectCircleCollisionResult.VerticalFace) {
                ball_velocity.x = -ball_velocity.x;
            }
            if (collision === RectCircleCollisionResult.Corner) {
                ball_velocity.y = -ball_velocity.y;
                ball_velocity.x = -ball_velocity.x;
            }
        }
        player_position.x += dt * player_velocity;
        if (player_position.x <= 0) {
            player_position.x = 0;
        }
        if (player_position.x + brick_width >= ctx.canvas.width) {
            player_position.x = ctx.canvas.width - brick_width;
        }
        if ((game_time - previous_line_add) > line_add_interval) {
            for (var i = 0; i < lines.length; ++i) {
                lines[i].position++;
            }
            lines.unshift(newLine(ctx.canvas.width));
            previous_line_add = game_time;
        }
    }
    if (!game_over) {
        clearBackground(ctx, bg_color);
    }
    for (var _a = 0, lines_2 = lines; _a < lines_2.length; _a++) {
        var line = lines_2[_a];
        drawLine(ctx, line);
    }
    drawBall(ctx, ball_position);
    drawBrick(ctx, player_position.x, player_position.y, player_color);
    window.requestAnimationFrame(gameLoop);
}
