import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Loader2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { adStore } from "@/lib/adStore";
import { defaultStyle, type AdConcept, type AdStyle } from "@/lib/adTypes";
import { PosterPreviewPanel, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "@/components/PosterPreviewPanel";
import { AdCanvasStudio } from "@/features/ad-editor/components/AdCanvasStudio";
import { downloadPosterAsPng } from "@/lib/downloadPoster";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/customize")({
  head: () => ({ meta: [{ title: "Customize Your Ad — AdCraft AI" }] }),
  component: Customize,
});

const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Bebas Neue",
  "Oswald",
  "Lora",
  "Space Grotesk",
  "DM Serif Display",
  "Archivo Black",
];

function useGoogleFonts(fonts: string[]) {
  const fontsKey = useMemo(() => fonts.join(","), [fonts]);

  useEffect(() => {
    const id = "adcraft-google-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const families = fonts.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;600;800`).join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, [fonts, fontsKey]);
}

function Customize() {
  const navigate = useNavigate();
  const [concept, setConcept] = useState<AdConcept | null>(null);
  const [style, setStyle] = useState<AdStyle | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [downloading, setDownloading] = useState(false);
  const [editorView, setEditorView] = useState<"studio" | "classic">("studio");
  const posterRef = useRef<HTMLDivElement>(null);
  const exportPosterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = adStore.getSelected();
    const input = adStore.getInput();
    if (!c) {
      navigate({ to: "/" });
      return;
    }
    setConcept(c);
    setStyle(adStore.getStyle() ?? defaultStyle(c));
    setImages(input?.imageUrls ?? []);
  }, [navigate]);

  useGoogleFonts(FONT_OPTIONS);

  // Editable copy
  const updateConcept = (patch: Partial<AdConcept>) => {
    setConcept((c) => {
      if (!c) return c;
      const next = { ...c, ...patch };
      adStore.saveSelected(next);
      return next;
    });
  };
  const updateStyle = (patch: Partial<AdStyle>) => {
    setStyle((s) => {
      if (!s) return s;
      const next = { ...s, ...patch };
      adStore.saveStyle(next);
      return next;
    });
  };

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      const next = [...images, ...uploaded];
      setImages(next);
      const input = adStore.getInput();
      if (input) adStore.saveInput({ ...input, imageUrls: next });
    } finally {
      setUploading(false);
    }
  }

  const remove = (u: string) => {
    const next = images.filter((x) => x !== u);
    setImages(next);
    const input = adStore.getInput();
    if (input) adStore.saveInput({ ...input, imageUrls: next });
  };

  const handleDownloadPoster = async () => {
    const target = exportPosterRef.current ?? posterRef.current;
    if (!target || downloading) return;
    setDownloading(true);
    try {
      await downloadPosterAsPng(target, {
        filename: `adcraft-poster-${Date.now()}.png`,
        scale: 2,
      });
      toast.success("Poster downloaded successfully");
    } catch (err) {
      console.error("Poster export failed:", err);
      toast.error(
        err instanceof Error && err.message.includes("CORS")
          ? "Export blocked by image permissions. Try re-uploading product images."
          : "Could not export poster. Try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));

  if (!concept || !style) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster richColors />
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/results"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
          <div className="font-semibold text-center order-last w-full sm:order-none sm:w-auto">
            Customize Your Ad
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end ml-auto">
            <div className="flex rounded-lg border bg-background/80 p-0.5 text-xs">
              <Button
                type="button"
                size="sm"
                variant={editorView === "studio" ? "default" : "ghost"}
                className="h-8 px-3"
                onClick={() => setEditorView("studio")}
              >
                Visual Studio
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editorView === "classic" ? "default" : "ghost"}
                className="h-8 px-3"
                onClick={() => setEditorView("classic")}
              >
                Classic
              </Button>
            </div>
            {editorView === "classic" && (
              <>
                <div className="flex items-center rounded-lg border bg-background/80 p-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={zoomOut}
                    disabled={zoom <= ZOOM_MIN}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <span className="text-xs tabular-nums w-10 text-center text-muted-foreground">
                    {zoom}%
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={zoomIn}
                    disabled={zoom >= ZOOM_MAX}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadPoster}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {downloading ? "Exporting…" : "Download Poster"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {editorView === "studio" ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col lg:h-[calc(100vh-4.5rem)] min-h-[70vh]">
          <AdCanvasStudio
            concept={concept}
            style={style}
            images={images}
            uploading={uploading}
            onUploadFiles={handleFiles}
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(280px,380px)_1fr] gap-6 lg:h-[calc(100vh-4.5rem)] lg:min-h-0">
          {/* Editor panel */}
          <Card className="p-4 lg:sticky lg:top-[72px] self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto poster-preview-scroll">
            <Tabs defaultValue="text">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="bg">Background</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-3 pt-4">
                <LabeledInput
                  label="Headline"
                  value={concept.headline}
                  onChange={(v) => updateConcept({ headline: v })}
                />
                <LabeledInput
                  label="Subheadline"
                  value={concept.subheadline}
                  onChange={(v) => updateConcept({ subheadline: v })}
                />
                <LabeledInput
                  label="Body"
                  value={concept.body}
                  onChange={(v) => updateConcept({ body: v })}
                  textarea
                />
                <LabeledInput
                  label="Call to action"
                  value={concept.cta}
                  onChange={(v) => updateConcept({ cta: v })}
                />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <ToggleRow
                    label="Subheadline"
                    v={style.showSubheadline}
                    onChange={(v) => updateStyle({ showSubheadline: v })}
                  />
                  <ToggleRow
                    label="Body"
                    v={style.showBody}
                    onChange={(v) => updateStyle({ showBody: v })}
                  />
                  <ToggleRow
                    label="CTA"
                    v={style.showCta}
                    onChange={(v) => updateStyle({ showCta: v })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4 pt-4">
                <div>
                  <Label className="text-xs">Font family</Label>
                  <Select
                    value={style.fontFamily}
                    onValueChange={(v) => updateStyle({ fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SliderRow
                  label={`Heading size (${style.headingSize}px)`}
                  value={style.headingSize}
                  min={20}
                  max={96}
                  onChange={(v) => updateStyle({ headingSize: v })}
                />
                <SliderRow
                  label={`Body size (${style.bodySize}px)`}
                  value={style.bodySize}
                  min={10}
                  max={32}
                  onChange={(v) => updateStyle({ bodySize: v })}
                />
                <SliderRow
                  label={`Letter spacing (${style.letterSpacing}px)`}
                  value={style.letterSpacing}
                  min={-4}
                  max={12}
                  onChange={(v) => updateStyle({ letterSpacing: v })}
                />
                <SliderRow
                  label={`Line height (${style.lineHeight.toFixed(2)})`}
                  value={Math.round(style.lineHeight * 100)}
                  min={90}
                  max={200}
                  onChange={(v) => updateStyle({ lineHeight: v / 100 })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <ColorRow
                    label="Text color"
                    value={style.textColor}
                    onChange={(v) => updateStyle({ textColor: v })}
                  />
                  <ColorRow
                    label="Accent color"
                    value={style.accentColor}
                    onChange={(v) => updateStyle({ accentColor: v })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Toggle
                    pressed={style.bold}
                    onPressedChange={(v) => updateStyle({ bold: v })}
                    aria-label="Bold"
                  >
                    <Bold className="size-4" />
                  </Toggle>
                  <Toggle
                    pressed={style.italic}
                    onPressedChange={(v) => updateStyle({ italic: v })}
                    aria-label="Italic"
                  >
                    <Italic className="size-4" />
                  </Toggle>
                  <Toggle
                    pressed={style.underline}
                    onPressedChange={(v) => updateStyle({ underline: v })}
                    aria-label="Underline"
                  >
                    <Underline className="size-4" />
                  </Toggle>
                  <div className="ml-auto flex items-center gap-1">
                    <Toggle
                      pressed={style.align === "left"}
                      onPressedChange={() => updateStyle({ align: "left" })}
                    >
                      <AlignLeft className="size-4" />
                    </Toggle>
                    <Toggle
                      pressed={style.align === "center"}
                      onPressedChange={() => updateStyle({ align: "center" })}
                    >
                      <AlignCenter className="size-4" />
                    </Toggle>
                    <Toggle
                      pressed={style.align === "right"}
                      onPressedChange={() => updateStyle({ align: "right" })}
                    >
                      <AlignRight className="size-4" />
                    </Toggle>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Text shadow</Label>
                  <Select
                    value={style.shadow}
                    onValueChange={(v) => updateStyle({ shadow: v as AdStyle["shadow"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="soft">Soft</SelectItem>
                      <SelectItem value="hard">Hard offset</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="bg" className="space-y-4 pt-4">
                <div>
                  <Label className="text-xs">Background type</Label>
                  <Select
                    value={style.bgType}
                    onValueChange={(v) => updateStyle({ bgType: v as AdStyle["bgType"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {style.bgType === "solid" ? (
                  <ColorRow
                    label="Background color"
                    value={style.bgColor}
                    onChange={(v) => updateStyle({ bgColor: v })}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <ColorRow
                      label="Gradient start"
                      value={style.bgGradientFrom}
                      onChange={(v) => updateStyle({ bgGradientFrom: v })}
                    />
                    <ColorRow
                      label="Gradient end"
                      value={style.bgGradientTo}
                      onChange={(v) => updateStyle({ bgGradientTo: v })}
                    />
                  </div>
                )}
                <SliderRow
                  label={`Padding (${style.padding}px)`}
                  value={style.padding}
                  min={8}
                  max={96}
                  onChange={(v) => updateStyle({ padding: v })}
                />
                <SliderRow
                  label={`Corner radius (${style.radius}px)`}
                  value={style.radius}
                  min={0}
                  max={48}
                  onChange={(v) => updateStyle({ radius: v })}
                />
              </TabsContent>

              <TabsContent value="layout" className="space-y-4 pt-4">
                <div>
                  <Label className="text-xs">Layout</Label>
                  <Select
                    value={style.layout}
                    onValueChange={(v) => updateStyle({ layout: v as AdStyle["layout"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stack">Stack (image top, text below)</SelectItem>
                      <SelectItem value="split">Split (text left, image right)</SelectItem>
                      <SelectItem value="overlay">Overlay (text on image)</SelectItem>
                      <SelectItem value="banner">Banner (text top, image below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Product images</Label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-3 text-sm cursor-pointer hover:border-indigo-400">
                    <Upload className="size-4" /> {uploading ? "Uploading…" : "Add more images"}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {images.map((u) => (
                        <div
                          key={u}
                          className="relative aspect-square rounded overflow-hidden border group"
                        >
                          <img src={u} className="w-full h-full object-cover" alt="" />
                          <button
                            onClick={() => remove(u)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <PosterPreviewPanel
            concept={concept}
            style={style}
            images={images}
            zoom={zoom}
            posterRef={posterRef}
            exportRef={exportPosterRef}
          />
        </div>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {textarea ? (
        <textarea
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => onChange(v[0])}
        className="mt-2"
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 rounded border cursor-pointer bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  v,
  onChange,
}: {
  label: string;
  v: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
      <span>{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </label>
  );
}

function toHex(c: string): string {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))
    return c.length === 4
      ? "#" +
          c
            .slice(1)
            .split("")
            .map((x) => x + x)
            .join("")
      : c;
  return "#000000";
}
