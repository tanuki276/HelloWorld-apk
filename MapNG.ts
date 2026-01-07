import { MapEntity } from './types';

export class MapNG {
  private width: number;
  private height: number;
  
  private hitCanvas: OffscreenCanvas; 
  private hitCtx: OffscreenCanvasRenderingContext2D;
  
  private registry: Map<number, MapEntity> = new Map();
  private nextId: number = 1;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.hitCanvas = new OffscreenCanvas(width, height);
    const ctx = this.hitCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas Context Error");
    
    this.hitCtx = ctx;
    this.hitCtx.imageSmoothingEnabled = false;
  }
  (Bit Shifting)
  private idToColor(id: number): string {
    const r = (id >> 16) & 0xFF;
    const g = (id >> 8) & 0xFF;
    const b = id & 0xFF;
    return `rgb(${r},${g},${b})`;
  }

  private colorToId(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }

  public register(
    entity: MapEntity, 
    drawFn: (ctx: OffscreenCanvasRenderingContext2D) => void
  ): number {
    const id = this.nextId++;
    const storedEntity = { ...entity, id };
    this.registry.set(id, storedEntity);

    this.hitCtx.fillStyle = this.idToColor(id);
    this.hitCtx.beginPath();
    drawFn(this.hitCtx);
    this.hitCtx.fill();

    return id;
  }

  public getEntityAt(x: number, y: number): MapEntity | null {
    const pixel = this.hitCtx.getImageData(x, y, 1, 1).data;
    if (pixel[3] === 0) return null;

    const id = this.colorToId(pixel[0], pixel[1], pixel[2]);
    return this.registry.get(id) || null;
  }

  public exportJSON(): string {
    return JSON.stringify(Array.from(this.registry.values()), null, 2);
  }
}
