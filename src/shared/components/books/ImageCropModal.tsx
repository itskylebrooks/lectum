import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  source: string | null;
  mimeType?: string;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

const VIEWPORT_WIDTH = 280;
const VIEWPORT_HEIGHT = 392;
const OUTPUT_WIDTH = 500;
const OUTPUT_HEIGHT = 700;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBaseScale(imageSize: Size) {
  return Math.max(VIEWPORT_WIDTH / imageSize.width, VIEWPORT_HEIGHT / imageSize.height);
}

function clampPan(pan: Point, imageSize: Size, zoom: number) {
  const baseScale = getBaseScale(imageSize);
  const displayWidth = imageSize.width * baseScale * zoom;
  const displayHeight = imageSize.height * baseScale * zoom;
  const maxX = Math.max(0, (displayWidth - VIEWPORT_WIDTH) / 2);
  const maxY = Math.max(0, (displayHeight - VIEWPORT_HEIGHT) / 2);

  return {
    x: clamp(pan.x, -maxX, maxX),
    y: clamp(pan.y, -maxY, maxY),
  };
}

async function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = source;
  });
}

export default function ImageCropModal({
  open,
  source,
  mimeType = 'image/jpeg',
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const enterRaf = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originPan: Point;
  } | null>(null);

  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      setClosing(false);
      setEntering(true);
      setError(null);
      enterRaf.current = requestAnimationFrame(() => {
        enterRaf.current = requestAnimationFrame(() => setEntering(false));
      });
      return;
    }

    if (visible) {
      setClosing(true);
      timeoutRef.current = window.setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 220);
    }
  }, [open, visible]);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
    },
    [],
  );

  useEffect(() => {
    if (!visible || !source) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setImageSize(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    void loadImage(source)
      .then((image) => {
        if (cancelled) return;
        imageRef.current = image;
        setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      })
      .catch(() => {
        if (cancelled) return;
        setError('Image preview failed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, visible]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const beginClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    timeoutRef.current = window.setTimeout(() => {
      onClose();
      setVisible(false);
      setClosing(false);
    }, 220);
  }, [closing, onClose]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') beginClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginClose, visible]);

  const imageStyle = useMemo(() => {
    if (!imageSize) return undefined;
    const scale = getBaseScale(imageSize) * zoom;
    return {
      width: imageSize.width,
      height: imageSize.height,
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      transformOrigin: 'center center',
    };
  }, [imageSize, pan.x, pan.y, zoom]);

  function handleZoomChange(nextZoom: number) {
    if (!imageSize) {
      setZoom(nextZoom);
      return;
    }
    setZoom(nextZoom);
    setPan((current) => clampPan(current, imageSize, nextZoom));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageSize) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originPan: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageSize || !dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    setPan(
      clampPan(
        {
          x: dragRef.current.originPan.x + deltaX,
          y: dragRef.current.originPan.y + deltaY,
        },
        imageSize,
        zoom,
      ),
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleConfirm() {
    if (!imageSize || !imageRef.current) return;

    const image = imageRef.current;
    const scale = getBaseScale(imageSize) * zoom;
    const displayWidth = imageSize.width * scale;
    const displayHeight = imageSize.height * scale;
    const left = (VIEWPORT_WIDTH - displayWidth) / 2 + pan.x;
    const top = (VIEWPORT_HEIGHT - displayHeight) / 2 + pan.y;

    const sourceX = clamp((0 - left) / scale, 0, imageSize.width);
    const sourceY = clamp((0 - top) / scale, 0, imageSize.height);
    const sourceWidth = clamp(VIEWPORT_WIDTH / scale, 1, imageSize.width - sourceX);
    const sourceHeight = clamp(VIEWPORT_HEIGHT / scale, 1, imageSize.height - sourceY);

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Image preview failed.');
      return;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT,
    );

    const outputType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    onConfirm(canvas.toDataURL(outputType, 0.92));
  }

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-200 ${closing || entering ? 'bg-transparent' : 'bg-overlay backdrop-blur-sm'}`}
      onClick={beginClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border border-subtle bg-surface-elevated p-5 shadow-elevated transition-all duration-200 ${closing || entering ? 'opacity-0 scale-[0.95] translate-y-1' : 'opacity-100 scale-100 translate-y-0'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-subtle pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-soft">Thumbnail</p>
            <h2 id="image-crop-title" className="mt-2 text-xl font-semibold text-strong">
              Adjust visible area
            </h2>
            <p className="mt-1 text-sm text-muted">Drag the image and zoom in to choose the cover crop.</p>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-subtle text-muted hover-nonaccent"
            onClick={beginClose}
            aria-label="Close image crop"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-[1.5rem] border border-subtle bg-surface shadow-sm"
              style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {source && imageStyle ? (
                <img
                  src={source}
                  alt="Thumbnail crop preview"
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    ...imageStyle,
                    marginLeft: imageStyle.width ? -imageStyle.width / 2 : undefined,
                    marginTop: imageStyle.height ? -imageStyle.height / 2 : undefined,
                  }}
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  {loading ? 'Loading image…' : 'Choose an image to continue.'}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-black/10" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="thumbnail-zoom" className="flex items-center gap-2 text-sm text-muted">
              <Search className="h-4 w-4" />
              Zoom
            </label>
            <input
              id="thumbnail-zoom"
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => handleZoomChange(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-subtle pt-3">
            <button
              type="button"
              className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
              onClick={beginClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-inverse hover-accent-fade"
              onClick={handleConfirm}
              disabled={!source || !imageSize}
            >
              Use image
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
