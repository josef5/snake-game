import init, { Direction, World, GameStatus } from "snake_game";
import { rnd } from "./utils/rnd";

init().then((wasm: { memory: { buffer: ArrayBufferLike } }) => {
  const CELL_SIZE = 10;
  const WORLD_WIDTH = 8;

  // Random spawn index
  const snakeSpawnIdx = rnd(WORLD_WIDTH * WORLD_WIDTH);

  const world = World.new(WORLD_WIDTH, snakeSpawnIdx);
  const worldWidth = world.width();

  const points = document.getElementById("points");
  const gameStatus = document.getElementById("game-status");
  const gameControlBtn = document.getElementById("game-control-btn");
  const canvas = <HTMLCanvasElement>document.getElementById("snake-canvas");
  const ctx = canvas.getContext("2d");

  canvas.height = worldWidth * CELL_SIZE;
  canvas.width = worldWidth * CELL_SIZE;

  const snakeCellPtr = world.snake_cells();
  const snakeLen = world.snake_length();

  const snakeCells = new Uint32Array(
    wasm.memory.buffer,
    snakeCellPtr,
    snakeLen
  );

  document.addEventListener("click", () => {
    const gameStatus = world.game_status();

    if (gameStatus === undefined) {
      gameControlBtn.textContent = "Playing...";
      world.start_game();
      play();
    } else {
      location.reload();
    }
  });

  document.addEventListener("keydown", (event) => {
    console.log("key:", event.code);

    switch (event.code) {
      case "ArrowUp":
        world.change_snake_dir(Direction.Up);
        break;
      case "ArrowRight":
        world.change_snake_dir(Direction.Right);
        break;
      case "ArrowDown":
        world.change_snake_dir(Direction.Down);
        break;
      case "ArrowLeft":
        world.change_snake_dir(Direction.Left);
        break;
      default:
    }
  });

  // Draw world (grid)
  function drawWorld() {
    ctx.beginPath();

    // Draw vertical lines
    for (let x = 0; x < worldWidth + 1; x++) {
      ctx.moveTo(CELL_SIZE * x, 0);
      ctx.lineTo(CELL_SIZE * x, worldWidth * CELL_SIZE);
    }

    // Draw horizontal lines
    for (let y = 0; y < worldWidth + 1; y++) {
      ctx.moveTo(0, CELL_SIZE * y);
      ctx.lineTo(worldWidth * CELL_SIZE, CELL_SIZE * y);
    }

    ctx.stroke();
  }

  function drawReward() {
    const idx = world.reward_cell();
    const col = idx % worldWidth;
    const row = Math.floor(idx / worldWidth);

    ctx.beginPath();
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.stroke();
  }

  function drawSnake() {
    const snakeCells = new Uint32Array(
      wasm.memory.buffer,
      world.snake_cells(),
      world.snake_length()
    );

    // Filters and iterates through the snake cells to draw them on the canvas
    snakeCells
      // Exclude the first cell and any cells that match the position of the first cell
      .filter((cellIdx, i) => !(i > 0 && cellIdx === snakeCells[0]))
      .forEach((cellIdx, i) => {
        const col = cellIdx % worldWidth;
        const row = Math.floor(cellIdx / worldWidth);

        ctx.fillStyle = i === 0 ? "#7878db" : "#000000";

        ctx.beginPath();
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });

    ctx.stroke();
  }

  function drawGameStatus() {
    // const status = world.game_status();
    gameStatus.textContent = world.game_status_text();
    points.textContent = world.points().toString();

    /* if (status === GameStatus.Won || status === GameStatus.Lost) {
      gameControlBtn.textContent = "Replay";
    } */
  }

  function paint() {
    drawWorld();
    drawSnake();
    drawReward();
    drawGameStatus();
  }

  function play() {
    const status = world.game_status();

    if (status === GameStatus.Won || status === GameStatus.Lost) {
      gameControlBtn.textContent = "Replay";
      return;
    }

    const fps = 3;

    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      world.step();
      paint();

      // the method takes a callback to be invoked before the next repaint
      requestAnimationFrame(play);
    }, 1000 / fps);
  }

  paint();
});
