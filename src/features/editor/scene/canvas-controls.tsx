import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { ChevronDown, Maximize2, Minimize2, Check } from "lucide-react";
import { ZoomPreset } from "../hooks/use-zoom";

interface CanvasControlsProps {
  zoomPercent: number;
  zoomMode: "fit" | "custom";
  onSelectZoom: (preset: ZoomPreset | number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ZOOM_PRESETS: { label: string; value: ZoomPreset }[] = [
  { label: "Fit to screen", value: "fit" },
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2 }
];

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoomPercent,
  zoomMode,
  onSelectZoom,
  containerRef
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const displayText =
    zoomMode === "fit" ? `Fit (${zoomPercent}%)` : `${zoomPercent}%`;

  return (
    <div
      className="absolute bottom-3 right-3 z-40 flex items-center gap-1 rounded-lg border border-border/80 bg-background/85 px-1 py-1 shadow-lg backdrop-blur-md pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Zoom Presets Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground hover:bg-zinc-800/60 cursor-pointer"
            title="Canvas Zoom"
          >
            <span>{displayText}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="w-36 z-[120] bg-popover/95 backdrop-blur-md border border-border"
        >
          <DropdownMenuItem
            onClick={() => onSelectZoom("fit")}
            className="text-xs flex items-center justify-between cursor-pointer"
          >
            <span>Fit to screen</span>
            {zoomMode === "fit" && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {ZOOM_PRESETS.filter((p) => p.value !== "fit").map((p) => {
            const isSelected =
              zoomMode === "custom" &&
              typeof p.value === "number" &&
              Math.abs(p.value * 100 - zoomPercent) < 2;

            return (
              <DropdownMenuItem
                key={p.label}
                onClick={() => onSelectZoom(p.value)}
                className="text-xs flex items-center justify-between cursor-pointer"
              >
                <span>{p.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-3.5 w-px bg-border/80 my-auto" />

      {/* Square Fullscreen Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800/60 cursor-pointer"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-3.5 w-3.5" />
        ) : (
          <Maximize2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
};

export default CanvasControls;
