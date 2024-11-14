interface Line {
    odd: boolean,
    bricks: number[],
    position: number,
    color: Color
}

interface Color {
    r: number, g: number, b: number
}

interface Point {
    x: number, y: number
}

const line_height = 30;
const brick_width = 100;
const bg_color: Color = {r: 18, g: 18, b: 18};
const brick_color: Color = {r: 180, g: 25, b: 25};
const brick_color2: Color = {r: 25, g: 25, b: 180};
const ball_color: Color = {r: 200, g: 200, b: 200};
const ball_radius = 10;
const player_color: Color = {r: 25, g: 180, b: 25};
const line_add_interval = 6;

var line_oddity = false;
var next_line_color = brick_color;
var paused = false;
var game_over = false;
let lines: Line[] = [];
let game_time: DOMHighResTimeStamp = 0;
let previous_time: DOMHighResTimeStamp = 0;
let previous_line_add: DOMHighResTimeStamp = 0;

let ctx: CanvasRenderingContext2D;

let ball_position: Point;
let ball_velocity: Point;
let ball_magnitude: number;
let ball_direction: number;
let player_position: Point;
let player_velocity = 0;

let score = 0;
let score_element: HTMLElement;

function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, color: Color) {
    ctx.fillStyle = `rgb(${color.r} ${color.g} ${color.b}`;
    ctx.fillRect(x+1, y+1, brick_width-2, line_height-2);
}

function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
    let y = line.position * line_height;
    let x = 0;
    for (let i = 0; i < line.bricks.length; i++) {
	x = line.bricks[i] * brick_width;
	if (line.odd) { x -= brick_width/2; }
	drawBrick(ctx, x, y, line.color);
    }
}

function fillCircle(ctx: CanvasRenderingContext2D, c: Point, r: number, color: Color) {
    ctx.fillStyle = `rgb(${color.r} ${color.g} ${color.b}`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Point) {
    fillCircle(ctx, ball, ball_radius, ball_color);
}

function newLine(width: number) {
    let res: Line = {
	odd: line_oddity,
	position: 0,
	color: next_line_color,
	bricks: []
    }
    for (let i = 0; i < Math.floor(width/brick_width); ++i) {
	res.bricks.push(i);
    }
    if (res.odd) {res.bricks.push(Math.floor(width/brick_width))} 

    line_oddity = !line_oddity;
    if (next_line_color === brick_color) { next_line_color = brick_color2; }
    else { next_line_color = brick_color; }

    return res;
}

function clearBackground(ctx: CanvasRenderingContext2D, bg: Color) {
    ctx.fillStyle = `rgb(${bg.r} ${bg.g} ${bg.b}`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function init() {
    paused = false;
    game_over = false;
    
    lines = [];
    score = 0;
    lines.push(newLine(ctx.canvas.width))
    ball_position = {x: Math.floor(ctx.canvas.width/2), y: ctx.canvas.height/2 - ball_radius};
    ball_magnitude = 350;
    ball_direction = 45;
    ball_velocity = {x: ball_magnitude*Math.sin(ball_direction), y: -ball_magnitude*Math.cos(ball_direction)}

    player_position = {x: (ctx.canvas.width - brick_width)/2, y: ctx.canvas.height - line_height};
    player_velocity = 0;
    onkeydown = (e) => {
	if (e.code === "KeyL") { player_velocity = 350; }
	if (e.code === "KeyK") { player_velocity = -350; }	
    }
    onkeyup = (e) => {
	if (e.code === "KeyL") { player_velocity = 0; }
	if (e.code === "KeyK") { player_velocity = 0; }	
    }

    score_element = document.getElementById("score")!;
    score_element.innerHTML = "Score: 0";
    const pauseButton = document.getElementById("pause-button")!;
    pauseButton.innerHTML = "Pause";	
}

window.onload = function () {
    const pauseButton = document.getElementById("pause-button")!;
    pauseButton.innerHTML = paused ? "Start" : "Pause";	
    pauseButton.addEventListener("click", (_e) => {
	paused = !paused;
	pauseButton.innerHTML = paused ? "Start" : "Pause";	
    });

    const restart_button = document.getElementById("restart-button")!;
    restart_button.addEventListener("click", init);
    
    const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
    ctx = canvas.getContext("2d")!;

    init();
    window.requestAnimationFrame(gameLoop);
}

function getPossiblyCollidingLines(lines: Line[], ball: Point) {
    if (ball_position.y + ball_radius >= (lines[0].position+1) * line_height) {
	return lines.filter((line) => {
	    return Math.abs(line.position - Math.floor(ball.y / line_height)) <= 1;
	})	
    }
    else {
	return [];
    }
}

enum RectCircleCollisionResult {
    None,
    HorizontalFace,
    VerticalFace,
    Corner
};

function rectCircleCollision(pos: Point, dim: Point, c: Point, r: number) {
    let distance: Point = {
        x: Math.abs(c.x - pos.x - dim.x / 2),
        y: Math.abs(c.y - pos.y - dim.y / 2)
    };
    
    if (distance.x > (dim.x / 2 + r)) return RectCircleCollisionResult.None;
    if (distance.y > (dim.y / 2 + r)) return RectCircleCollisionResult.None;

    if (distance.x <= dim.x / 2) return RectCircleCollisionResult.HorizontalFace;
    if (distance.y <= dim.y / 2) return RectCircleCollisionResult.VerticalFace;

    let cornerDistance = Math.pow(distance.x - dim.x / 2, 2) + Math.pow(distance.y - dim.y / 2, 2);
    if (cornerDistance <= r * r) return RectCircleCollisionResult.Corner;

    return RectCircleCollisionResult.None;
}

function gameLoop(time: DOMHighResTimeStamp) {
    let dt = (time - previous_time) / 1000;
    previous_time = time;
    if (!paused && !game_over) {
	game_time += dt;
    }
    else { dt = 0; }

    if (game_over) {
	ctx.font = "100px Serif";
	ctx.fillStyle = "white";
	ctx.fillText("GAME OVER!", (ctx.canvas.width - 600)/2, ctx.canvas.height/2, 600);
    }
    else {
	ball_velocity = {x: ball_magnitude*Math.sin(ball_direction), y: -ball_magnitude*Math.cos(ball_direction)}	
	ball_position.x += dt * ball_velocity.x;
	ball_position.y += dt * ball_velocity.y;
	if (ball_position.x + ball_radius >= ctx.canvas.width) {
	    ball_direction = -ball_direction;
	    ball_position.x = ctx.canvas.width - ball_radius;
	}
	if (ball_position.x - ball_radius <= 0) {
	    ball_direction = -ball_direction;
	    ball_position.x = ball_radius;
	}
	if (ball_position.y + ball_radius >= ctx.canvas.height) {
	    game_over = true;
	}
	if (ball_position.y - ball_radius <= 0) {
	    ball_direction = Math.PI - ball_direction;
	    ball_position.y = ball_radius;	
	}
	
	for (let line of lines) {
	    for (let i = line.bricks.length - 1; i >= 0; --i) {
		let x = line.bricks[i] * brick_width;
		if (line.odd) { x -= brick_width/2; }
		let y = line.position * line_height;
		let collision = rectCircleCollision({x, y}, {x:brick_width, y:line_height}, ball_position, ball_radius);
		if (collision != RectCircleCollisionResult.None) {
		    line.bricks.splice(i, 1);
		    score += 1;
		    score_element.innerHTML = `Score: ${score}`
		    if (collision === RectCircleCollisionResult.HorizontalFace) {
			ball_direction = Math.PI - ball_direction;
			if (ball_position.y < y) {
			    ball_position.y = y - ball_radius;
			} else {
			    ball_position.y = y + line_height + ball_radius;
			}		    
		    }
		    if (collision === RectCircleCollisionResult.VerticalFace) {
			ball_direction = -ball_direction;
			if (ball_position.x < x) {
			    ball_position.x = x - ball_radius;
			} else {
			    ball_position.x = x + brick_width + ball_radius;
			}		    
		    }
		    if (collision === RectCircleCollisionResult.Corner) {
			ball_direction += Math.PI;
		    }
		}
	    }
	}

	let collision = rectCircleCollision(player_position, {x:brick_width, y:line_height}, ball_position, ball_radius);
	if (collision != RectCircleCollisionResult.None) {
	    if (collision === RectCircleCollisionResult.HorizontalFace) {
		ball_direction = -60 * (ball_position.x - (player_position.x + brick_width/2)) / (brick_width/2);
		ball_position.y = player_position.y - ball_radius;
	    }
	    if (collision === RectCircleCollisionResult.VerticalFace) {
		ball_direction = -ball_direction;
	    }
	    if (collision === RectCircleCollisionResult.Corner) {
		ball_direction += Math.PI;
	    }
	}
	

	player_position.x += dt * player_velocity;
	if (player_position.x <= 0 ) { player_position.x = 0; }
	if (player_position.x + brick_width >= ctx.canvas.width ) { player_position.x = ctx.canvas.width - brick_width; }    
	
	if ((game_time - previous_line_add) > line_add_interval) {
	    for (let i = 0; i < lines.length; ++i) {
		lines[i].position++;
	    }
	    lines.unshift(newLine(ctx.canvas.width));
	    previous_line_add = game_time;
	}
    }

    if (!game_over) {
	clearBackground(ctx, bg_color);
    }
    for (const line of lines) {
	drawLine(ctx, line);
    }
    drawBall(ctx, ball_position);
    drawBrick(ctx, player_position.x, player_position.y, player_color);

    window.requestAnimationFrame(gameLoop);
}
