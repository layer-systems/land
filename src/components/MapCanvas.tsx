import { useRef, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Home, Search } from 'lucide-react';
import type { LandBase } from '@/hooks/useUserBase';
import type { MapUser } from '@/hooks/useAllUsers';
import { MAP_WIDTH, MAP_HEIGHT } from '@/lib/npubToCoords';

// Constants
const HIT_DETECTION_RADIUS = 500;

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
  
  // Camera state
  const [zoom, setZoom] = useState(0.5);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredBase, setHoveredBase] = useState<string | null>(null);

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
        const canvas = canvasRef.current;
        if (canvas) {
          setOffsetX(-marker.x * zoom + canvas.width / 2);
          setOffsetY(-marker.y * zoom + canvas.height / 2);
        }
      }
    }
  }, [currentUserPubkey, allMarkers, zoom]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - offsetX) / zoom,
        y: (screenY - offsetY) / zoom,
      };
    },
    [offsetX, offsetY, zoom]
  );

  // Handle zoom
  const handleZoomIn = () => {
    setZoom((z) => Math.min(z * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z / 1.5, 0.05));
  };

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    } else {
      // Check if hovering over a marker
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hoveredMarker = allMarkers.find((marker) => {
          const dx = marker.x - worldPos.x;
          const dy = marker.y - worldPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < HIT_DETECTION_RADIUS / zoom;
        });
        setHoveredBase(hoveredMarker?.pubkey || null);
      }
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
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const clickedMarker = allMarkers.find((marker) => {
          const dx = marker.x - worldPos.x;
          const dy = marker.y - worldPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < HIT_DETECTION_RADIUS / zoom;
        });
        if (clickedMarker) {
          onBaseClick(clickedMarker);
        }
      }
    }
  };

  // Render the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSize = 10000;
    const startX = Math.floor(-offsetX / zoom / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / zoom / gridSize) * gridSize;
    const endX = startX + canvas.width / zoom + gridSize;
    const endY = startY + canvas.height / zoom + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      const screenX = x * zoom + offsetX;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      const screenY = y * zoom + offsetY;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();
    }

    // Draw markers
    allMarkers.forEach((marker) => {
      const screenX = marker.x * zoom + offsetX;
      const screenY = marker.y * zoom + offsetY;

      // Skip if off-screen
      if (
        screenX < -50 ||
        screenX > canvas.width + 50 ||
        screenY < -50 ||
        screenY > canvas.height + 50
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`} ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
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
      <Card className="absolute top-4 left-4 p-2">
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
