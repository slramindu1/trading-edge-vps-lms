"use client";

import { useEffect, useRef, useState } from "react";

interface LeafletMapProps {
  latitude: number;
  longitude: number;
}

// Convert lat/lon/zoom to OSM tile x,y
function latLonToTile(lat: number, lon: number, zoom: number) {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { x, y };
}

export function LeafletMap({ latitude, longitude }: LeafletMapProps) {
  const [tiles, setTiles] = useState<{ src: string; offsetX: number; offsetY: number }[]>([]);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const zoom = 12;
    const TILE_SIZE = 256;

    // Container dimensions (matches CSS w-72 h-44 = 288x176)
    const containerW = containerRef.current?.offsetWidth || 288;
    const containerH = containerRef.current?.offsetHeight || 176;

    const center = latLonToTile(latitude, longitude, zoom);

    // Fractional tile position of the exact lat/lon
    const fracX = ((longitude + 180) / 360) * Math.pow(2, zoom);
    const fracY =
      ((1 - Math.log(Math.tan((latitude * Math.PI) / 180) + 1 / Math.cos((latitude * Math.PI) / 180)) / Math.PI) /
        2) *
      Math.pow(2, zoom);

    // Pixel offset of center point within the center tile
    const pixelOffsetX = (fracX - center.x) * TILE_SIZE;
    const pixelOffsetY = (fracY - center.y) * TILE_SIZE;

    // How many tiles to render in each direction
    const tilesX = Math.ceil(containerW / TILE_SIZE) + 2;
    const tilesY = Math.ceil(containerH / TILE_SIZE) + 2;
    const halfX = Math.floor(tilesX / 2);
    const halfY = Math.floor(tilesY / 2);

    const subdomains = ["a", "b", "c"];
    const newTiles: { src: string; offsetX: number; offsetY: number }[] = [];

    for (let dy = -halfY; dy <= halfY; dy++) {
      for (let dx = -halfX; dx <= halfX; dx++) {
        const tileX = center.x + dx;
        const tileY = center.y + dy;
        const sub = subdomains[Math.abs(tileX + tileY) % 3];
        const src = `https://${sub}.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

        // Pixel position relative to container center
        const offsetX = containerW / 2 + dx * TILE_SIZE - pixelOffsetX;
        const offsetY = containerH / 2 + dy * TILE_SIZE - pixelOffsetY;

        newTiles.push({ src, offsetX, offsetY });
      }
    }

    setTiles(newTiles);

    // Marker at exact center
    setMarkerPos({ x: containerW / 2, y: containerH / 2 });
  }, [latitude, longitude]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-neutral-800">
      {/* OSM Tiles */}
      {tiles.map((tile, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={tile.src}
          alt=""
          width={256}
          height={256}
          className="absolute"
          style={{
            left: tile.offsetX,
            top: tile.offsetY,
            imageRendering: "pixelated",
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ))}

      {/* Location pin */}
      {tiles.length > 0 && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{ left: markerPos.x - 12, top: markerPos.y - 32 }}
        >
          <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22S24 21 24 12C24 5.373 18.627 0 12 0z"
              fill="#EF4444"
              stroke="white"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="4" fill="white" />
          </svg>
        </div>
      )}
    </div>
  );
}
