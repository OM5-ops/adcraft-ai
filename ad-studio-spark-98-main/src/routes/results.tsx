import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Wand2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adStore } from "@/lib/adStore";
import { defaultStyle, type AdConcept, type AdInput } from "@/lib/adTypes";
import { AdPreview } from "@/components/AdPreview";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Your ad variations — AdCraft AI" }] }),
  component: Results,
});

function Results() {
  const navigate = useNavigate();
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [input, setInput] = useState<AdInput | null>(null);

  useEffect(() => {
    setConcepts(adStore.getConcepts());
    setInput(adStore.getInput());
  }, []);

  function customize(c: AdConcept) {
    adStore.saveSelected(c);
    adStore.saveStyle(defaultStyle(c));
    navigate({ to: "/customize" });
  }

  if (concepts.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <p className="text-muted-foreground mb-4">No ad variations yet.</p>
          <Link to="/">
            <Button>Create one</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = input?.imageUrls ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <Link to="/">
          <Button variant="outline" size="sm">
            <Wand2 className="size-4 mr-2" /> Regenerate
          </Button>
        </Link>
      </header>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          Pick a direction
        </h1>
        <p className="text-muted-foreground mb-8">
          4 distinct concepts — open any one in the live editor to fine-tune.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {concepts.map((c, i) => (
            <Card key={i} className="overflow-hidden p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">
                  {c.angle}
                </Badge>
                <Button onClick={() => customize(c)} size="sm">
                  <Pencil className="size-3.5 mr-1.5" /> Open Visual Editor
                </Button>
              </div>
              <AdPreview concept={c} style={defaultStyle(c)} images={images} height={380} compact />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
