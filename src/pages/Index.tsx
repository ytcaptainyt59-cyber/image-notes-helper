import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, StickyNote, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import FichesSection from "@/components/FichesSection";
import NotesSection from "@/components/NotesSection";

const AI_ENABLED_KEY = "covinor_ai_enabled";

const Index = () => {
  const [activeTab, setActiveTab] = useState("fiches");
  const [aiEnabled, setAiEnabled] = useState(() => {
    const stored = localStorage.getItem(AI_ENABLED_KEY);
    return stored === null ? false : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(AI_ENABLED_KEY, String(aiEnabled));
  }, [aiEnabled]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="font-display text-sm font-bold text-primary-foreground">C</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight text-foreground">
                COVINOR Régleur
              </h1>
              <p className="text-xs text-muted-foreground">Assistant de conditionnement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${aiEnabled ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground hidden sm:inline">IA</span>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-secondary mb-6">
            <TabsTrigger value="fiches" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Fiches Conditionnement
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <StickyNote className="h-4 w-4" />
              Notes Format
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fiches">
            <FichesSection aiEnabled={aiEnabled} />
          </TabsContent>

          <TabsContent value="notes">
            <NotesSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
