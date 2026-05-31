import { FabricText } from "fabric";
import {
  Circle,
  ImagePlus,
  Layers,
  LayoutGrid,
  Palette,
  Shapes,
  Sparkles,
  Square,
  Triangle,
  Type,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import type { AdStyle } from "@/lib/adTypes";
import { CANVAS_PRESETS, FONT_OPTIONS, PATTERN_BACKGROUNDS, SHAPE_STICKERS } from "../constants";
import type { ExportFormat } from "../types";
import type { useFabricEditor } from "../hooks/useFabricEditor";

type EditorApi = ReturnType<typeof useFabricEditor>;

type EditorSidebarProps = {
  editor: EditorApi;
  style: AdStyle;
  images: string[];
  uploading: boolean;
  onUploadFiles: (files: FileList | null) => void;
  onExport: (format: ExportFormat) => void;
  exporting: boolean;
};

export function EditorSidebar({
  editor,
  style,
  images,
  uploading,
  onUploadFiles,
  onExport,
  exporting,
}: EditorSidebarProps) {
  const selected = editor.selectedObject;
  const isText = selected instanceof FabricText;
  const isImage = selected?.type === "image";

  return (
    <Card className="p-3 h-full overflow-y-auto poster-preview-scroll">
      <Tabs defaultValue="design" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-auto gap-1">
          <TabsTrigger value="design" className="text-xs px-1">
            <Type className="size-3.5 mr-1" /> Design
          </TabsTrigger>
          <TabsTrigger value="elements" className="text-xs px-1">
            <Shapes className="size-3.5 mr-1" /> Elements
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs px-1">
            <ImagePlus className="size-3.5 mr-1" /> Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-4 pt-3">
          <div>
            <Label className="text-xs">Canvas size</Label>
            <Select value={editor.presetId} onValueChange={(v) => void editor.resizePreset(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANVAS_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isText && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium">Selected text</p>
              <div>
                <Label className="text-xs">Font</Label>
                <Select
                  value={(selected.fontFamily as string)?.split(",")[0] ?? style.fontFamily}
                  onValueChange={(v) => editor.updateSelectedText({ fontFamily: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Size</Label>
                <Slider
                  value={[selected.fontSize as number]}
                  min={10}
                  max={120}
                  step={1}
                  onValueChange={(v) => editor.updateSelectedText({ fontSize: v[0] })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  className="mt-1 h-9"
                  value={(selected.fill as string) ?? style.textColor}
                  onChange={(e) => editor.updateSelectedText({ fill: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Opacity</Label>
                <Slider
                  value={[Math.round(((selected.opacity as number) ?? 1) * 100)]}
                  min={10}
                  max={100}
                  onValueChange={(v) => editor.updateSelectedText({ opacity: v[0] / 100 })}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-1">
                <Toggle
                  size="sm"
                  pressed={selected.fontWeight === "bold"}
                  onPressedChange={(v) =>
                    editor.updateSelectedText({ fontWeight: v ? "bold" : "normal" })
                  }
                >
                  B
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={selected.fontStyle === "italic"}
                  onPressedChange={(v) =>
                    editor.updateSelectedText({ fontStyle: v ? "italic" : "normal" })
                  }
                >
                  I
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={!!selected.underline}
                  onPressedChange={(v) => editor.updateSelectedText({ underline: v })}
                >
                  U
                </Toggle>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Palette className="size-3.5" /> Background
            </Label>
            <Input
              type="color"
              className="h-9"
              defaultValue={style.bgColor}
              onChange={(e) => editor.setBackgroundColor(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="color"
                defaultValue={style.bgGradientFrom}
                onChange={(e) => editor.setBackgroundGradient(e.target.value, style.bgGradientTo)}
              />
              <Input
                type="color"
                defaultValue={style.bgGradientTo}
                onChange={(e) => editor.setBackgroundGradient(style.bgGradientFrom, e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs border rounded-md p-2 cursor-pointer hover:bg-muted/50">
              <Upload className="size-3.5" /> Upload background
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void editor.addImageFromFile(f).then(() => {});
                }}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <ImagePlus className="size-3.5" /> Product images
            </Label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-2 text-xs cursor-pointer">
              <Upload className="size-3.5" />
              {uploading ? "Uploading…" : "Add images"}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onUploadFiles(e.target.files)}
              />
            </label>
            <div className="grid grid-cols-3 gap-1">
              {images.map((url) => (
                <button
                  key={url}
                  type="button"
                  className="aspect-square rounded border overflow-hidden hover:ring-2 ring-indigo-400"
                  onClick={() => void editor.addImageFromUrl(url)}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {isImage && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium">Image adjustments</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => editor.applyImageFilter("brightness", 0.15)}
              >
                Brighten
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => editor.applyImageFilter("contrast", 0.2)}
              >
                More contrast
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => editor.applyImageFilter("saturation", 0.3)}
              >
                Boost saturation
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => editor.removeBackgroundApprox()}
              >
                Remove light background
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="elements" className="space-y-3 pt-3">
          <Button size="sm" className="w-full" onClick={() => editor.addText()}>
            <Type className="size-4 mr-2" /> Add text
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => editor.addShape("rect")}>
              <Square className="size-4 mr-1" /> Rect
            </Button>
            <Button size="sm" variant="outline" onClick={() => editor.addShape("circle")}>
              <Circle className="size-4 mr-1" /> Circle
            </Button>
            <Button size="sm" variant="outline" onClick={() => editor.addShape("triangle")}>
              <Triangle className="size-4 mr-1" /> Triangle
            </Button>
            <Button size="sm" variant="outline" onClick={() => editor.addShape("line")}>
              <LayoutGrid className="size-4 mr-1" /> Line
            </Button>
          </div>
          <div>
            <Label className="text-xs">Stickers</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {SHAPE_STICKERS.map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant="secondary"
                  className="text-lg px-3"
                  onClick={() => editor.addText(s.char)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Patterns (overlay)</Label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {PATTERN_BACKGROUNDS.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="outline"
                  className="text-[10px]"
                  onClick={() => editor.addShape("rect")}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Layers className="size-3.5" /> Layers
            </Label>
            <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto">
              {editor.layers.map((layer, i) => (
                <li key={layer.id}>
                  <button
                    type="button"
                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted truncate"
                    onClick={() => editor.selectLayer(i)}
                  >
                    {layer.name}
                    {layer.locked ? " 🔒" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-3 pt-3">
          <p className="text-xs text-muted-foreground">
            High-resolution export (2×). Social-ready formats from canvas preset.
          </p>
          <Button className="w-full" disabled={exporting} onClick={() => onExport("png")}>
            Download PNG
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            disabled={exporting}
            onClick={() => onExport("jpg")}
          >
            Download JPG
          </Button>
          <Button
            className="w-full"
            variant="outline"
            disabled={exporting}
            onClick={() => onExport("pdf")}
          >
            Download PDF
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            size="sm"
            onClick={() => void editor.resetFromAd()}
          >
            <Sparkles className="size-4 mr-2" /> Reset from AI layout
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
