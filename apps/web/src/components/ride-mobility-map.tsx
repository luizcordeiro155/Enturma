"use client";

import { Car, GraduationCap, LocateFixed, MapPin } from "lucide-react";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type MapPoint = { lat: number; lng: number };
export type MapMarker = {
  id: string;
  point: MapPoint;
  kind: "me" | "driver" | "passenger" | "campus" | "pickup" | "destination";
  label?: string;
  heading?: number | null;
};

type Props = {
  center: MapPoint;
  zoom?: number;
  markers?: MapMarker[];
  route?: MapPoint[];
  selecting?: boolean;
  follow?: boolean;
  onCenterChange?: (point: MapPoint) => void;
  onInteraction?: () => void;
  className?: string;
};

const TILE = 256;
const MAX_LAT = 85.05112878;

function clampLat(lat: number) {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

function world(point: MapPoint, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const lat = clampLat(point.lat);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) *
      scale,
  };
}

function geographic(x: number, y: number, zoom: number): MapPoint {
  const scale = TILE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat: clampLat(lat), lng };
}

function MarkerGlyph({ marker }: { marker: MapMarker }) {
  if (marker.kind === "driver")
    return (
      <Car
        size={22}
        strokeWidth={2.3}
        style={{
          transform: `rotate(${Number(marker.heading ?? 0)}deg)`,
        }}
      />
    );
  if (marker.kind === "campus") return <GraduationCap size={22} strokeWidth={2.3} />;
  if (marker.kind === "me") return <LocateFixed size={20} strokeWidth={2.5} />;
  return <MapPin size={21} strokeWidth={2.4} />;
}

function SmoothMarker({
  marker,
  center,
  zoom,
  width,
  height,
}: {
  marker: MapMarker;
  center: MapPoint;
  zoom: number;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const targetWorld = world(marker.point, zoom);
  const centerWorld = world(center, zoom);
  const target = {
    x: width / 2 + targetWorld.x - centerWorld.x,
    y: height / 2 + targetWorld.y - centerWorld.y,
  };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = previous.current ?? target;
    previous.current = target;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      node.style.transform = `translate3d(${target.x}px,${target.y}px,0) translate(-50%,-50%)`;
      return;
    }
    const started = performance.now();
    const duration = marker.kind === "driver" ? 650 : 260;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const x = from.x + (target.x - from.x) * eased;
      const y = from.y + (target.y - from.y) * eased;
      node.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target.x, target.y, marker.kind]);

  return (
    <div
      ref={ref}
      className={`ride-map-marker marker-${marker.kind}`}
      title={marker.label}
      aria-label={marker.label ?? marker.kind}
    >
      <span>
        <MarkerGlyph marker={marker} />
      </span>
      {marker.label ? <small>{marker.label}</small> : null}
    </div>
  );
}

export function RideMobilityMap({
  center,
  zoom = 15,
  markers = [],
  route = [],
  selecting = false,
  follow = true,
  onCenterChange,
  onInteraction,
  className = "",
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const routePath = useRef<SVGPolylineElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [displayCenter, setDisplayCenter] = useState(center);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    origin: ReturnType<typeof world>;
  } | null>(null);

  useEffect(() => {
    if (!follow || drag.current) return;
    setDisplayCenter(center);
  }, [center.lat, center.lng, follow]);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const resize = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      });
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, []);

  const centerWorld = world(displayCenter, currentZoom);
  const tileRange = useMemo(() => {
    const minX = Math.floor((centerWorld.x - size.width / 2) / TILE) - 1;
    const maxX = Math.floor((centerWorld.x + size.width / 2) / TILE) + 1;
    const minY = Math.floor((centerWorld.y - size.height / 2) / TILE) - 1;
    const maxY = Math.floor((centerWorld.y + size.height / 2) / TILE) + 1;
    const limit = 2 ** currentZoom;
    const tiles: { x: number; y: number; key: string; left: number; top: number }[] = [];
    for (let y = minY; y <= maxY; y++) {
      if (y < 0 || y >= limit) continue;
      for (let x = minX; x <= maxX; x++) {
        const wrapped = ((x % limit) + limit) % limit;
        tiles.push({
          x: wrapped,
          y,
          key: `${currentZoom}-${x}-${y}`,
          left: x * TILE - centerWorld.x + size.width / 2,
          top: y * TILE - centerWorld.y + size.height / 2,
        });
      }
    }
    return tiles;
  }, [centerWorld.x, centerWorld.y, currentZoom, size.width, size.height]);

  const routePoints = useMemo(() => {
    return route
      .map((point) => {
        const p = world(point, currentZoom);
        return `${size.width / 2 + p.x - centerWorld.x},${size.height / 2 + p.y - centerWorld.y}`;
      })
      .join(" ");
  }, [route, currentZoom, size.width, size.height, centerWorld.x, centerWorld.y]);

  useEffect(() => {
    const path = routePath.current;
    if (!path || route.length < 2) return;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
      return;
    }
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    const started = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const t = Math.min(1, (now - started) / 720);
      path.style.strokeDashoffset = String(length * (1 - (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [routePoints]);

  function liftPin(lifted: boolean) {
    const node = pin.current;
    if (!node) return;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.animate(
      [
        { transform: node.style.transform || "translate(-50%,-100%)" },
        {
          transform: lifted
            ? "translate(-50%,-125%) scale(1.08)"
            : "translate(-50%,-100%) scale(1)",
        },
      ],
      {
        duration: reduced ? 1 : 180,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "forwards",
      },
    );
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    onInteraction?.();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origin: world(displayCenter, currentZoom),
    };
    if (selecting) liftPin(true);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    const x = active.origin.x - (event.clientX - active.x);
    const y = active.origin.y - (event.clientY - active.y);
    setDisplayCenter(geographic(x, y, currentZoom));
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    drag.current = null;
    if (selecting) liftPin(false);
    onCenterChange?.(displayCenter);
  }

  function zoomBy(delta: number) {
    onInteraction?.();
    setCurrentZoom((value) => Math.max(4, Math.min(19, value + delta)));
  }

  const tileUrl =
    process.env.NEXT_PUBLIC_RIDE_TILE_URL ??
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div
      ref={root}
      className={`ride-real-map ${className}`}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onWheel={(event) => {
        event.preventDefault();
        zoomBy(event.deltaY < 0 ? 1 : -1);
      }}
      role="application"
      aria-label="Mapa interativo da carona"
    >
      <div className="ride-map-tiles" aria-hidden="true">
        {tileRange.map((tile) => (
          <img
            key={tile.key}
            src={tileUrl
              .replace("{z}", String(currentZoom))
              .replace("{x}", String(tile.x))
              .replace("{y}", String(tile.y))}
            alt=""
            draggable={false}
            width={TILE}
            height={TILE}
            style={
              {
                "--tile-left": `${tile.left}px`,
                "--tile-top": `${tile.top}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <svg className="ride-map-route" width={size.width} height={size.height} aria-hidden="true">
        <polyline className="ride-map-route-halo" points={routePoints} />
        <polyline ref={routePath} className="ride-map-route-line" points={routePoints} />
      </svg>

      {markers.map((marker) => (
        <SmoothMarker
          key={marker.id}
          marker={marker}
          center={displayCenter}
          zoom={currentZoom}
          width={size.width}
          height={size.height}
        />
      ))}

      {selecting ? (
        <div ref={pin} className="ride-center-pin" aria-hidden="true">
          <MapPin size={36} />
        </div>
      ) : null}

      <div className="ride-map-controls">
        <button
          type="button"
          aria-label="Aumentar zoom"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomBy(1)}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Diminuir zoom"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomBy(-1)}
        >
          −
        </button>
      </div>

      <a
        className="ride-map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        onPointerDown={(event) => event.stopPropagation()}
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
