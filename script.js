// script.js
const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");
const preview = document.getElementById("preview");
const upload = document.getElementById("upload");
const difficultySelect = document.getElementById("difficulty");
const message = document.getElementById("message");

let rows = 4;
let cols = 4;
let tiles = [];
let emptyTile = { x: 0, y: 0 };
let tileSize;
let img = new Image();
let imgLoaded = false;

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      preview.src = reader.result;
      imgLoaded = true;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function loadRandomImage() {
  const random = Math.floor(Math.random() * 1000);
  const url = `https://picsum.photos/600?random=${random}`;
  img.onload = () => {
    preview.src = url;
    imgLoaded = true;
  };
  img.src = url;
}

function startPuzzle() {
  if (!imgLoaded) {
    alert("Please upload or load an image first.");
    return;
  }

  rows = cols = parseInt(difficultySelect.value);
  tileSize = canvas.width / cols;

  tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      tiles.push({ x, y });
    }
  }

  tiles.pop(); // last one is empty
  shuffleTiles();
  emptyTile = { x: cols - 1, y: rows - 1 };

  drawTiles();
  message.textContent = "";
}

function shuffleTiles() {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
}

function drawTiles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let i = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x === emptyTile.x && y === emptyTile.y) continue;
      const tile = tiles[i];
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x * tileSize, y * tileSize, tileSize, tileSize, 10);
      ctx.clip();
      ctx.drawImage(
        img,
        tile.x * tileSize,
        tile.y * tileSize,
        tileSize,
        tileSize,
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      );
      ctx.restore();
      i++;
    }
  }
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - rect.left) / canvas.width) * cols);
  const y = Math.floor(((e.clientY - rect.top) / canvas.height) * rows);

  const dx = Math.abs(x - emptyTile.x);
  const dy = Math.abs(y - emptyTile.y);

  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    const tileIndex = y * cols + x;
    const tileToMove = getTileAtCanvas(x, y);

    if (tileToMove) {
      animateMove(tileToMove, x, y, emptyTile.x, emptyTile.y, () => {
        tiles.splice(tileToIndex(x, y), 1);
        tiles.splice(tileToIndex(emptyTile.x, emptyTile.y), 0, tileToMove);
        emptyTile = { x, y };
        drawTiles();
        checkWin();
      });
    }
  }
});

function getTileAtCanvas(x, y) {
  const i = tileToIndex(x, y);
  return tiles[i];
}

function tileToIndex(x, y) {
  let i = 0;
  for (let j = 0; j < y * cols + x; j++) {
    if (j === emptyTile.y * cols + emptyTile.x) continue;
    i++;
  }
  return i;
}

function animateMove(tile, fromX, fromY, toX, toY, callback) {
  const frames = 10;
  let frame = 0;

  const dx = (toX - fromX) * tileSize / frames;
  const dy = (toY - fromY) * tileSize / frames;
  let currentX = fromX * tileSize;
  let currentY = fromY * tileSize;

  function animate() {
    ctx.clearRect(fromX * tileSize, fromY * tileSize, tileSize, tileSize);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(currentX, currentY, tileSize, tileSize, 10);
    ctx.clip();
    ctx.drawImage(
      img,
      tile.x * tileSize,
      tile.y * tileSize,
      tileSize,
      tileSize,
      currentX,
      currentY,
      tileSize,
      tileSize
    );
    ctx.restore();

    frame++;
    currentX += dx;
    currentY += dy;

    if (frame < frames) {
      requestAnimationFrame(animate);
    } else {
      callback();
    }
  }
  animate();
}

function checkWin() {
  for (let i = 0; i < tiles.length; i++) {
    const correctX = i % cols;
    const correctY = Math.floor(i / cols);
    if (tiles[i].x !== correctX || tiles[i].y !== correctY) {
      return;
    }
  }
  message.textContent = "🎉 You solved it!";
}

// Patch for ctx.roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}
