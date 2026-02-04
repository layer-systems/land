import { useRef, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Home, Search } from 'lucide-react';
import type { LandBase } from '@/hooks/useUserBase';
import type { MapUser } from '@/hooks/useAllUsers';

// Hit detection radius in screen pixels (should be slightly larger than visual marker radius)
const HIT_DETECTION_RADIUS_PX = 15;

interface MapCanvasProps {
  bases: LandBase[];
  users: MapUser[];
  currentUserPubkey?: string;
  onBaseClick?: (base: LandBase | MapUser) => void;
  onSearchClick?: () => void;
  className?: string;
}

export function MapCanvas({
  bases,
  users,
  currentUserPubkey,
  onBaseClick,
  onSearchClick,
  className = '',
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track actual canvas dimensions for coordinate calculations
  const canvasSizeRef = useRef({ width: 0, height: 0, cssWidth: 0, cssHeight: 0 });
  
  // Camera state
  const [zoom, setZoom] = useState(0.15);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredBase, setHoveredBase] = useState<string | null>(null);

  const hasAutoCenteredRef = useRef(false);

  // Create a map of pubkey -> base for quick lookup
  const baseMap = new Map(bases.map((base) => [base.pubkey, base]));

  // Combine bases and users
  const allMarkers = users.map((user) => {
    const base = baseMap.get(user.pubkey);
    if (base) {
      return { ...base, hasClaimed: true, metadata: user.metadata };
    }
    return { ...user, hasClaimed: false };
  });

  // Center on current user's base
  const centerOnUser = useCallback(() => {
    if (currentUserPubkey) {
      const marker = allMarkers.find((m) => m.pubkey === currentUserPubkey);
      if (marker) {
        const { cssWidth, cssHeight } = canvasSizeRef.current;
        if (cssWidth > 0 && cssHeight > 0) {
          setOffsetX(-marker.x * zoom + cssWidth / 2);
          setOffsetY(-marker.y * zoom + cssHeight / 2);
        }
      }
    }
  }, [currentUserPubkey, allMarkers, zoom]);

  // Auto-center once on initial load when logged in
  useEffect(() => {
    if (!currentUserPubkey) {
      hasAutoCenteredRef.current = false;
      return;
    }

    if (hasAutoCenteredRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    if (container.clientWidth === 0 || container.clientHeight === 0) return;
    if (!allMarkers.some((m) => m.pubkey === currentUserPubkey)) return;

    centerOnUser();
    hasAutoCenteredRef.current = true;
  }, [allMarkers, centerOnUser, currentUserPubkey]);

  const zoomTo = useCallback(
    (getNextZoom: (prevZoom: number) => number, anchor?: { x: number; y: number }) => {
      const { cssWidth, cssHeight } = canvasSizeRef.current;
      const fallbackAnchor = { x: cssWidth / 2, y: cssHeight / 2 };
      const a = anchor ?? fallbackAnchor;

      setZoom((prevZoom) => {
        const nextZoom = getNextZoom(prevZoom);
        if (nextZoom === prevZoom) return prevZoom;

        // Keep the world position under the anchor fixed while zooming.
        setOffsetX((prevOffsetX) => {
          const worldX = (a.x - prevOffsetX) / prevZoom;
          return a.x - worldX * nextZoom;
        });
        setOffsetY((prevOffsetY) => {
          const worldY = (a.y - prevOffsetY) / prevZoom;
          return a.y - worldY * nextZoom;
        });

        return nextZoom;
      });
    },
    []
  );

  // Handle zoom
  const handleZoomIn = () => {
    zoomTo((z) => Math.min(z * 1.5, 5));
  };

  const handleZoomOut = () => {
    zoomTo((z) => Math.max(z / 1.5, 0.05));
  };

  // Convert client mouse coordinates to CSS canvas coordinates
  // This accounts for browser zoom - returns coordinates in CSS pixel space
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      
      // Return coordinates in CSS pixel space (not actual canvas pixels)
      // This matches the coordinate system used for drawing (after ctx.setTransform)
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setIsDragging(true);
    setDragStart({ x: coords.x - offsetX, y: coords.y - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    if (isDragging) {
      setOffsetX(coords.x - dragStart.x);
      setOffsetY(coords.y - dragStart.y);
    } else {
      // Check if hovering over a marker - use screen coordinates for hit detection
      const hoveredMarker = allMarkers.find((marker) => {
        // Convert marker world position to screen position
        const markerScreenX = marker.x * zoom + offsetX;
        const markerScreenY = marker.y * zoom + offsetY;
        // Calculate distance in screen pixels
        const dx = markerScreenX - coords.x;
        const dy = markerScreenY - coords.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < HIT_DETECTION_RADIUS_PX;
      });
      setHoveredBase(hoveredMarker?.pubkey || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredBase(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onBaseClick) {
      const coords = getCanvasCoords(e);
      // Check if clicking on a marker - use screen coordinates for hit detection
      const clickedMarker = allMarkers.find((marker) => {
        // Convert marker world position to screen position
        const markerScreenX = marker.x * zoom + offsetX;
        const markerScreenY = marker.y * zoom + offsetY;
        // Calculate distance in screen pixels
        const dx = markerScreenX - coords.x;
        const dy = markerScreenY - coords.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < HIT_DETECTION_RADIUS_PX;
      });
      if (clickedMarker) {
        onBaseClick(clickedMarker);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const coords = getCanvasCoords(e);
    const anchor = { x: coords.x, y: coords.y };
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? 1.15 : 1 / 1.15;

    zoomTo((z) => Math.min(5, Math.max(0.05, z * factor)), anchor);
  };

  // Render the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container with device pixel ratio for sharpness
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Store both the actual pixel dimensions and CSS dimensions
      const cssWidth = rect.width;
      const cssHeight = rect.height;
      const pixelWidth = Math.floor(cssWidth * dpr);
      const pixelHeight = Math.floor(cssHeight * dpr);
      
      // Only resize if dimensions changed
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        // Set CSS size explicitly to match the container
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }
      
      // Update the size ref for coordinate calculations
      canvasSizeRef.current = { 
        width: pixelWidth, 
        height: pixelHeight,
        cssWidth,
        cssHeight
      };
      
      // Scale context for high DPI displays
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Use CSS dimensions for drawing calculations
    const drawWidth = canvasSizeRef.current.cssWidth || canvas.width;
    const drawHeight = canvasSizeRef.current.cssHeight || canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, drawWidth, drawHeight);

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSize = 10000;
    const startX = Math.floor(-offsetX / zoom / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / zoom / gridSize) * gridSize;
    const endX = startX + drawWidth / zoom + gridSize;
    const endY = startY + drawHeight / zoom + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      const screenX = x * zoom + offsetX;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, drawHeight);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      const screenY = y * zoom + offsetY;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(drawWidth, screenY);
      ctx.stroke();
    }

    // Draw markers
    allMarkers.forEach((marker) => {
      const screenX = marker.x * zoom + offsetX;
      const screenY = marker.y * zoom + offsetY;

      // Skip if off-screen
      if (
        screenX < -50 ||
        screenX > drawWidth + 50 ||
        screenY < -50 ||
        screenY > drawHeight + 50
      ) {
        return;
      }

      const isCurrentUser = marker.pubkey === currentUserPubkey;
      const isHovered = marker.pubkey === hoveredBase;
      const hasClaimed = marker.hasClaimed;

      // Determine color
      let color = '#666666'; // Unclaimed
      if (hasClaimed) {
        if ('color' in marker && marker.color) {
          color = marker.color;
        } else {
          color = '#3b82f6'; // Default claimed color
        }
      }
      if (isCurrentUser) {
        color = '#22c55e'; // Current user
      }

      // Draw marker
      const radius = isHovered ? 12 : isCurrentUser ? 10 : hasClaimed ? 8 : 5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw border for hovered or current user
      if (isHovered || isCurrentUser) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label for claimed bases (if zoomed in enough)
      if (hasClaimed && zoom > 0.3) {
        const name =
          ('title' in marker && marker.title) ||
          marker.metadata?.display_name ||
          marker.metadata?.name ||
          `${marker.pubkey.slice(0, 8)}...`;

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, screenX, screenY + radius + 15);
      }
    });

    // Draw coordinates in corner
    ctx.fillStyle = '#666666';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Zoom: ${zoom.toFixed(2)}x`, 10, 20);
    ctx.fillText(`Bases: ${bases.length}/${users.length}`, 10, 40);
  }, [
    allMarkers,
    bases.length,
    users.length,
    currentUserPubkey,
    hoveredBase,
    zoom,
    offsetX,
    offsetY,
  ]);

  // Handle window resize - trigger re-render to update canvas dimensions
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        // Update size ref - the render effect will handle actual canvas resizing
        canvasSizeRef.current = {
          ...canvasSizeRef.current,
          cssWidth: rect.width,
          cssHeight: rect.height,
        };
        // Force re-render by updating a state
        setOffsetX((x) => x);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`} ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="cursor-move absolute top-0 left-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        {currentUserPubkey && (
          <Button
            size="icon"
            variant="secondary"
            onClick={centerOnUser}
            title="Center on My Base"
          >
            <Home className="h-4 w-4" />
          </Button>
        )}
        {onSearchClick && (
          <Button
            size="icon"
            variant="secondary"
            onClick={onSearchClick}
            title="Search NIP-05"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Legend */}
      <Card className="absolute top-4 right-4 p-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
            <span className="whitespace-nowrap">Your Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="whitespace-nowrap">Claimed Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-500 flex-shrink-0" />
            <span className="whitespace-nowrap">Unclaimed</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
