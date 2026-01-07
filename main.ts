import { MapNG } from './MapNG';
import { MapEntity } from './types';

const WIDTH = 800;
const HEIGHT = 600;

const mapCore = new MapNG(WIDTH, HEIGHT);
const canvas = document.getElementById('visualCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const infoBox = document.getElementById('info') as HTMLDivElement;
const form = document.getElementById('editorForm') as HTMLFormElement;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let isDrawing = false;
let currentPoints: { x: number, y: number }[] = [];
let drawnEntities: { points: {x:number, y:number}[], color: string }[] = [];


canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDrawing = true;
  currentPoints = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener('mousemove', (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  if (isDrawing) {
    currentPoints.push({ x, y });
    renderVisuals();
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let p of currentPoints) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    return;
  }

  const entity = mapCore.getEntityAt(x, y);
  if (entity) {
    infoBox.innerText = `検出: [${entity.type}] ${entity.name.ja}\nID: ${entity.id}`;
    canvas.style.cursor = 'pointer';
  } else {
    infoBox.innerText = "マウスを動かしてエリアを探索...";
    canvas.style.cursor = 'default';
  }
});

canvas.addEventListener('mouseup', () => {
  if (!isDrawing) return;
  isDrawing = false;

  console.log("領域選択完了。右のフォームから登録してください。");
});

function renderVisuals() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  
  for (const item of drawnEntities) {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(item.points[0].x, item.points[0].y);
    for (let p of item.points) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

document.getElementById('registerBtn')?.addEventListener('click', () => {
  if (currentPoints.length < 3) {
    alert("領域を選択してください（線を引いてください）");
    return;
  }

  const nameInput = (document.getElementById('nameJa') as HTMLInputElement).value;
  const typeInput = (document.getElementById('typeSelect') as HTMLSelectElement).value;

  const newEntity: MapEntity = {
    name: { ja: nameInput, en: "Unknown" },
    type: typeInput as any,
    metadata: { worksOffline: true, score: 0 }
  };

  mapCore.register(newEntity, (hitCtx) => {
    hitCtx.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let p of currentPoints) hitCtx.lineTo(p.x, p.y);
    hitCtx.closePath();
  });

  drawnEntities.push({
    points: [...currentPoints],
    color: typeInput === 'Country' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)'
  });

  renderVisuals();
  currentPoints = [];
  alert(`「${nameInput}」をMAPNGに埋め込みました！`);
});

document.getElementById('exportBtn')?.addEventListener('click', () => {
  console.log(mapCore.exportJSON());
  alert("コンソールにJSONを出力しました");
});
