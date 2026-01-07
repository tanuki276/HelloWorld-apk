import { MapEntity, GeoCoordinates } from './types';

export class MapNG {
  private width: number;
  private height: number;

  private hitCanvas: OffscreenCanvas; 
  private hitCtx: OffscreenCanvasRenderingContext2D;
  private backgroundImage: HTMLImageElement | null = null;

  private registry: Map<number, MapEntity> = new Map();
  private drawnShapes: Map<number, {points: {x: number, y: number}[], closePath: boolean}> = new Map();
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

  private idToColor(id: number): string {
    const r = (id >> 16) & 0xFF;
    const g = (id >> 8) & 0xFF;
    const b = id & 0xFF;
    return `rgb(${r},${g},${b})`;
  }

  private colorToId(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }

  public async loadBackgroundImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.backgroundImage = img;
          resolve(img);
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  public getBackgroundImage(): HTMLImageElement | null {
    return this.backgroundImage;
  }

  public register(
    entity: MapEntity, 
    drawFn: (ctx: OffscreenCanvasRenderingContext2D) => void,
    points: {x: number, y: number}[],
    closePath: boolean = true
  ): number {
    const id = this.nextId++;
    const storedEntity = { ...entity, id };
    this.registry.set(id, storedEntity);
    this.drawnShapes.set(id, { points, closePath });

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

  public getEntityById(id: number): MapEntity | null {
    return this.registry.get(id) || null;
  }

  public getShapeById(id: number): {points: {x: number, y: number}[], closePath: boolean} | null {
    return this.drawnShapes.get(id) || null;
  }

  public getAllEntities(): MapEntity[] {
    return Array.from(this.registry.values());
  }

  public updateEntity(id: number, entity: Partial<MapEntity>): boolean {
    const existing = this.registry.get(id);
    if (!existing) return false;
    this.registry.set(id, { ...existing, ...entity });
    return true;
  }

  public deleteEntity(id: number): boolean {
    this.registry.delete(id);
    this.drawnShapes.delete(id);
    return true;
  }

  public exportJSON(): string {
    return JSON.stringify(Array.from(this.registry.values()), null, 2);
  }

  public exportGeoJSON(): GeoJSONFeatureCollection {
    const features: GeoJSONFeature[] = Array.from(this.registry.values()).map(entity => ({
      type: "Feature",
      properties: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        url: entity.url,
        address: entity.address,
        aggregateRating: entity.aggregateRating,
        additionalProperty: entity.additionalProperty,
        metadata: entity.metadata
      },
      geometry: entity.geo ? {
        type: "Point",
        coordinates: [entity.geo.longitude, entity.geo.latitude]
      } : null
    })).filter(f => f.geometry !== null);

    return {
      type: "FeatureCollection",
      features: features as GeoJSONFeature[]
    };
  }

  public exportAsBlob(canvasElement: HTMLCanvasElement): Blob {
    return new Promise((resolve) => {
      canvasElement.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    }) as Promise<Blob>;
  }
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}