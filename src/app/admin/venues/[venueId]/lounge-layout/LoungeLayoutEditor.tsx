'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { Square, Circle, MousePointer, Trash2, Save, Plus, Loader2 } from 'lucide-react';
import { createLayout, saveLayout, LoungeBoxInput } from './actions';

const CANVAS_W = 1200;
const CANVAS_H = 800;
const DEFAULT_RECT_W = 120;
const DEFAULT_RECT_H = 80;
const DEFAULT_CIRCLE_W = 100;
const DEFAULT_CIRCLE_H = 100;
const HANDLE_SIZE = 12;

type Box = {
  clientId: string;
  dbId?: string;
  label: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'circle';
  color: string | null;
  capacity: number | null;
  minConsumation: number | null;
};

type Tool = 'select' | 'rect' | 'circle';

type DragState =
  | { type: 'none' }
  | { type: 'move'; clientId: string; startX: number; startY: number; origX: number; origY: number }
  | { type: 'resize'; clientId: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }
  | { type: 'draw'; startX: number; startY: number };

let clientIdSeq = 0;
function nextClientId() {
  return `box-${++clientIdSeq}`;
}

function svgPoint(svg: SVGSVGElement, e: React.MouseEvent): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const transformed = pt.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

type Props = {
  venueId: string;
  venueName: string;
  layoutId: string | null;
  initialBoxes: Box[];
};

export default function LoungeLayoutEditor({
  venueId,
  venueName,
  layoutId: initialLayoutId,
  initialBoxes,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>({ type: 'none' });
  const [layoutId, setLayoutId] = useState<string | null>(initialLayoutId);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = boxes.find((b) => b.clientId === selectedId) ?? null;

  // ── Pointer events ──────────────────────────────────────────────────────────

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const { x, y } = svgPoint(svgRef.current, e);

      if (tool === 'rect' || tool === 'circle') {
        e.preventDefault();
        // Start drawing
        setDrag({ type: 'draw', startX: x, startY: y });
      }
    },
    [tool],
  );

  const handleBoxMouseDown = useCallback(
    (e: React.MouseEvent, clientId: string) => {
      if (tool !== 'select') return;
      e.stopPropagation();
      if (!svgRef.current) return;
      const { x, y } = svgPoint(svgRef.current, e);
      const box = boxes.find((b) => b.clientId === clientId);
      if (!box) return;
      setSelectedId(clientId);
      setDrag({ type: 'move', clientId, startX: x, startY: y, origX: box.x, origY: box.y });
    },
    [tool, boxes],
  );

  const handleResizeHandleMouseDown = useCallback(
    (e: React.MouseEvent, clientId: string) => {
      e.stopPropagation();
      if (!svgRef.current) return;
      const { x, y } = svgPoint(svgRef.current, e);
      const box = boxes.find((b) => b.clientId === clientId);
      if (!box) return;
      setDrag({
        type: 'resize',
        clientId,
        startX: x,
        startY: y,
        origX: box.x,
        origY: box.y,
        origW: box.width,
        origH: box.height,
      });
    },
    [boxes],
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (drag.type === 'none' || !svgRef.current) return;
      e.preventDefault();
      const { x, y } = svgPoint(svgRef.current, e);

      if (drag.type === 'move') {
        const dx = x - drag.startX;
        const dy = y - drag.startY;
        setBoxes((prev) =>
          prev.map((b) =>
            b.clientId === drag.clientId
              ? {
                  ...b,
                  x: clamp(drag.origX + dx, 0, CANVAS_W - b.width),
                  y: clamp(drag.origY + dy, 0, CANVAS_H - b.height),
                }
              : b,
          ),
        );
      } else if (drag.type === 'resize') {
        const dw = x - drag.startX;
        const dh = y - drag.startY;
        setBoxes((prev) =>
          prev.map((b) =>
            b.clientId === drag.clientId
              ? {
                  ...b,
                  width: Math.max(40, drag.origW + dw),
                  height: Math.max(30, drag.origH + dh),
                }
              : b,
          ),
        );
      }
    },
    [drag],
  );

  const handleSvgMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const { x, y } = svgPoint(svgRef.current, e);

      if (drag.type === 'draw') {
        const shape = tool === 'circle' ? 'circle' : 'rect';
        const defW = shape === 'circle' ? DEFAULT_CIRCLE_W : DEFAULT_RECT_W;
        const defH = shape === 'circle' ? DEFAULT_CIRCLE_H : DEFAULT_RECT_H;
        const w = Math.abs(x - drag.startX) > 20 ? Math.abs(x - drag.startX) : defW;
        const h = Math.abs(y - drag.startY) > 20 ? Math.abs(y - drag.startY) : defH;
        const bx = clamp(Math.min(drag.startX, x), 0, CANVAS_W - w);
        const by = clamp(Math.min(drag.startY, y), 0, CANVAS_H - h);

        const usedNumbers = new Set(boxes.map((b) => b.number));
        let nextNum = 1;
        while (usedNumbers.has(nextNum)) nextNum++;

        const newBox: Box = {
          clientId: nextClientId(),
          label: `VIP ${nextNum}`,
          number: nextNum,
          x: bx,
          y: by,
          width: w,
          height: h,
          shape,
          color: null,
          capacity: null,
          minConsumation: null,
        };
        setBoxes((prev) => [...prev, newBox]);
        setSelectedId(newBox.clientId);
        setTool('select');
      }

      setDrag({ type: 'none' });
    },
    [drag, tool, boxes],
  );

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tool === 'select') {
        // Deselect when clicking empty canvas
        setSelectedId(null);
      }
    },
    [tool],
  );

  // ── Delete ───────────────────────────────────────────────────────────────────

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setBoxes((prev) => prev.filter((b) => b.clientId !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ── Update property ──────────────────────────────────────────────────────────

  const updateBox = useCallback((clientId: string, patch: Partial<Box>) => {
    setBoxes((prev) => prev.map((b) => (b.clientId === clientId ? { ...b, ...patch } : b)));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    setSaveMsg(null);
    startTransition(async () => {
      try {
        let lid = layoutId;
        if (!lid) {
          lid = await createLayout(venueId, 'Main Floor');
          setLayoutId(lid);
        }
        const payload: LoungeBoxInput[] = boxes.map((b) => ({
          label: b.label,
          number: b.number,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          shape: b.shape,
          color: b.color,
          capacity: b.capacity,
          minConsumation: b.minConsumation,
        }));
        await saveLayout(lid, payload);
        setSaveMsg('Saved!');
        setTimeout(() => setSaveMsg(null), 2000);
      } catch {
        setSaveMsg('Save failed — check console');
      }
    });
  }, [layoutId, venueId, boxes]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton active={tool === 'select'} onClick={() => setTool('select')} title="Select / Move">
          <MousePointer className="h-4 w-4" />
        </ToolButton>
        <ToolButton active={tool === 'rect'} onClick={() => setTool('rect')} title="Add Rectangle">
          <Square className="h-4 w-4" />
        </ToolButton>
        <ToolButton active={tool === 'circle'} onClick={() => setTool('circle')} title="Add Ellipse">
          <Circle className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={false}
          onClick={deleteSelected}
          title="Delete Selected"
          disabled={!selectedId}
          variant="danger"
        >
          <Trash2 className="h-4 w-4" />
        </ToolButton>

        <div className="ml-auto flex items-center gap-2">
          {saveMsg && (
            <span className="text-sm text-emerald-400">{saveMsg}</span>
          )}
          {!layoutId && (
            <span className="text-xs text-gray-400">No layout yet — save to create</span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Tool hint */}
      <p className="text-xs text-gray-500">
        {tool === 'select' && 'Click to select • Drag to move • Drag corner handle to resize'}
        {tool === 'rect' && 'Click or drag on the canvas to place a rectangle'}
        {tool === 'circle' && 'Click or drag on the canvas to place an ellipse'}
      </p>

      <div className="flex gap-4">
        {/* Canvas */}
        <div
          className="min-w-0 flex-1 overflow-hidden rounded-lg border border-gray-700 bg-gray-950"
          style={{ userSelect: 'none' }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full"
            style={{ cursor: tool !== 'select' ? 'crosshair' : 'default', maxHeight: '560px' }}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onClick={handleSvgClick}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1f2937" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={CANVAS_W} height={CANVAS_H} fill="#111827" />
            <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

            {/* Boxes */}
            {boxes.map((box) => {
              const isSelected = box.clientId === selectedId;
              const fill = box.color ?? '#1e3a5f';
              const stroke = isSelected ? '#818cf8' : '#374151';
              const strokeW = isSelected ? 2.5 : 1.5;

              return (
                <g key={box.clientId}>
                  {box.shape === 'rect' ? (
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      rx={6}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeW}
                      onMouseDown={(e) => handleBoxMouseDown(e, box.clientId)}
                      style={{ cursor: tool === 'select' ? 'grab' : 'default' }}
                    />
                  ) : (
                    <ellipse
                      cx={box.x + box.width / 2}
                      cy={box.y + box.height / 2}
                      rx={box.width / 2}
                      ry={box.height / 2}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeW}
                      onMouseDown={(e) => handleBoxMouseDown(e, box.clientId)}
                      style={{ cursor: tool === 'select' ? 'grab' : 'default' }}
                    />
                  )}
                  <text
                    x={box.x + box.width / 2}
                    y={box.y + box.height / 2 - 6}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.min(box.width, box.height) * 0.22}
                    fill="#f9fafb"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {box.label}
                  </text>
                  <text
                    x={box.x + box.width / 2}
                    y={box.y + box.height / 2 + Math.min(box.width, box.height) * 0.18}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.min(box.width, box.height) * 0.16}
                    fill="#94a3b8"
                    pointerEvents="none"
                  >
                    #{box.number}
                  </text>

                  {/* Resize handle (bottom-right corner) */}
                  {isSelected && (
                    <rect
                      x={box.x + box.width - HANDLE_SIZE / 2}
                      y={box.y + box.height - HANDLE_SIZE / 2}
                      width={HANDLE_SIZE}
                      height={HANDLE_SIZE}
                      rx={2}
                      fill="#818cf8"
                      stroke="#312e81"
                      strokeWidth={1}
                      style={{ cursor: 'se-resize' }}
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, box.clientId)}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Properties Panel */}
        {selected && (
          <div className="w-64 shrink-0 space-y-3 rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm">
            <h3 className="font-semibold text-white">Properties</h3>

            <div>
              <label className="text-xs font-medium text-gray-400">Label</label>
              <input
                type="text"
                value={selected.label}
                onChange={(e) => updateBox(selected.clientId, { label: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400">Lounge Number</label>
              <input
                type="number"
                min={1}
                value={selected.number}
                onChange={(e) => updateBox(selected.clientId, { number: Number.parseInt(e.target.value) || 1 })}
                className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400">Capacity</label>
              <input
                type="number"
                min={1}
                placeholder="—"
                value={selected.capacity ?? ''}
                onChange={(e) =>
                  updateBox(selected.clientId, {
                    capacity: e.target.value ? Number.parseInt(e.target.value) : null,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400">Min. Consumation (CHF)</label>
              <input
                type="number"
                min={0}
                step={50}
                placeholder="—"
                value={selected.minConsumation ?? ''}
                onChange={(e) =>
                  updateBox(selected.clientId, {
                    minConsumation: e.target.value ? Number.parseFloat(e.target.value) : null,
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400">Colour</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={selected.color ?? '#1e3a5f'}
                  onChange={(e) => updateBox(selected.clientId, { color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-gray-700 bg-gray-800 p-0.5"
                />
                {selected.color && (
                  <button
                    onClick={() => updateBox(selected.clientId, { color: null })}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400">Shape</label>
              <div className="mt-1 flex gap-2">
                <ShapeButton
                  active={selected.shape === 'rect'}
                  onClick={() => updateBox(selected.clientId, { shape: 'rect' })}
                >
                  <Square className="h-3.5 w-3.5" /> Rect
                </ShapeButton>
                <ShapeButton
                  active={selected.shape === 'circle'}
                  onClick={() => updateBox(selected.clientId, { shape: 'circle' })}
                >
                  <Circle className="h-3.5 w-3.5" /> Ellipse
                </ShapeButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-700 pt-3 text-xs text-gray-500">
              <span>X: {Math.round(selected.x)}</span>
              <span>Y: {Math.round(selected.y)}</span>
              <span>W: {Math.round(selected.width)}</span>
              <span>H: {Math.round(selected.height)}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">{boxes.length} box{boxes.length !== 1 ? 'es' : ''} · Venue: {venueName}</p>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  disabled,
  variant,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  variant?: 'danger';
  children: React.ReactNode;
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40';
  const activeClass =
    variant === 'danger'
      ? 'bg-rose-700 text-white'
      : 'bg-indigo-600 text-white';
  const inactiveClass =
    variant === 'danger'
      ? 'border border-gray-700 text-rose-400 hover:bg-rose-950'
      : 'border border-gray-700 text-gray-300 hover:bg-gray-800';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${active ? activeClass : inactiveClass}`}
    >
      {children}
    </button>
  );
}

function ShapeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'border border-gray-700 text-gray-400 hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  );
}
