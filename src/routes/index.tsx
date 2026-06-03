import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Upload, X, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { adStore } from "@/lib/adStore";
import type { AdInput, AdConcept } from "@/lib/adTypes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdCraft AI — Create stunning ads in seconds" },
      {
        name: "description",
        content:
          "AI-powered advertisement generator with smart layouts, multiple creative variations, and a live editor.",
      },
      { property: "og:title", content: "AdCraft AI" },
      {
        property: "og:description",
        content: "AI-powered advertisement generator with smart layouts and a live editor.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [form, setForm] = useState<AdInput>({
    businessName: "",
    productName: "",
    category: "",
    audience: "",
    tone: "modern, confident",
    offer: "",
    extra: "",
    imageUrls: [],
  });
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const set = <K extends keyof AdInput>(k: K, v: AdInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      set("imageUrls", [...form.imageUrls, ...uploaded]);
      if (uploaded.length) toast.success(`${uploaded.length} image(s) uploaded`);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    set(
      "imageUrls",
      form.imageUrls.filter((u) => u !== url),
    );
  }

  async function generate() {
    if (!form.businessName.trim() || !form.productName.trim()) {
      toast.error("Add a business name and a product or service");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-content", {
        body: form,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const concepts: AdConcept[] = data?.concepts ?? [];
      if (concepts.length === 0) throw new Error("No concepts returned");
      adStore.saveInput(form);
      adStore.saveConcepts(concepts);
      navigate({ to: "/results" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <Toaster richColors />
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="size-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">AdCraft AI</span>
        </div>
        <nav className="hidden sm:flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#create" className="hover:text-foreground">
            Create
          </a>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-8 pb-12 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
          Stunning ads, generated in seconds
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your product photos, describe your business, and let AdCraft AI craft
          poster-quality advertisements with creative headlines and a live editor for full control.
        </p>
      </section>

      <section id="create" className="max-w-4xl mx-auto px-6 pb-24">
        <Card className="p-6 sm:p-8 shadow-xl shadow-indigo-500/10 border-indigo-100 dark:border-indigo-900/40">
          <h2 className="text-2xl font-bold mb-1">Tell us about your ad</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We'll generate 4 distinct creative directions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business name *">
              <Input
                value={form.businessName}
               onChange={(e) => set("businessName", e.target.value)}
                placeholder="Acme Coffee"  />
            </Field>
            <Field label="Product or service *">
              <Input
                value={form.productName}
                onChange={(e) => set("productName", e.target.value)}
                placeholder="Cold brew starter pack"
               />
            </Field>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Food & Beverage"
              />
            </Field>
            <Field label="Target audience">
              <Input
                value={form.audience}
                onChange={(e) => set("audience", e.target.value)}
                placeholder="Young professionals 25–40"
              />
            </Field>
            <Field label="Tone">
              <Input
                value={form.tone}
                onChange={(e) => set("tone", e.target.value)}
                placeholder="modern, playful, premium…"
               />
            </Field>
            <Field label="Offer / promotion">
              <Input
                value={form.offer}
                onChange={(e) => set("offer", e.target.value)}
                placeholder="20% off launch week"
              />
            </Field>
            <Field label="Anything else?" className="sm:col-span-2">
              <Textarea
                value={form.extra}
                onChange={(e) => set("extra", e.target.value)}
                placeholder="Key benefits, must-mention keywords, brand voice notes…"
                rows={3}
              />
            </Field>
          </div>

          <div className="mt-6">
            <Label className="text-sm font-medium mb-2 block">Product images</Label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition">
              <Upload className="size-6 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                {uploading ? "Uploading…" : "Click to upload (or drop) multiple product photos"}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
                {form.imageUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {form.imageUrls.map((u) => (
                  <div
                    key={u}
                    className="relative group aspect-square rounded-lg overflow-hidden border"
                  >
                    <img src={u} alt="product" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(u)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remove">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={generate}
            disabled={generating}
            size="lg"
            className="w-full mt-8 h-12 text-base bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-95"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> Generating creative concepts…
              </>
            ) : (
              <>
                <Wand2 className="size-4 mr-2" /> Generate 4 ad variations
              </>
            )}
          </Button>
        </Card>

        <div id="features" className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              t: "Smart layouts",
              d: "Automatically arranges product photos into poster-quality compositions.",
            },
            {
              t: "Creative copy",
              d: "Multiple headlines & angles tuned to your category and audience.",
            },
            {
              t: "Live editor",
              d: "Fine-tune fonts, colors, shadows and layout with instant preview.",
            },
          ].map((f) => (
            <Card key={f.t} className="p-5">
              <div className="font-semibold">{f.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{f.d}</div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
