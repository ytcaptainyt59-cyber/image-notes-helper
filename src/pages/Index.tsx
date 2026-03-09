import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, StickyNote, Sparkles, Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FichesSection from "@/components/FichesSection";
import NotesSection from "@/components/NotesSection";

const AI_ENABLED_KEY = "covinor_ai_enabled";

interface IndexProps {
  user: { id: string; username: string };
  onLogout: () => void;
}

const Index = ({ user, onLogout }: IndexProps) => {
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
      {/* Header */}
      <header className="border-b border-border/50 px-4 py-4 glass-card">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <span className="font-display text-base font-bold text-white">C</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight text-foreground">
                COVINOR <span className="gradient-text">Régleur</span>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-accent" />
                Gestion des formats & réglages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 glass-card rounded-full px-3 py-1.5">
            <Sparkles className={`h-3.5 w-3.5 transition-colors ${aiEnabled ? "text-accent" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground hidden sm:inline">IA</span>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl p-4 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-secondary/50 mb-6 p-1 rounded-xl">
            <TabsTrigger
              value="fiches"
              className="flex-1 gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-primary transition-all"
            >
              <FileText className="h-4 w-4" />
              Fiches
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-1 gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-primary transition-all"
            >
              <StickyNote className="h-4 w-4" />
              Formats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fiches" className="animate-fade-in">
            <FichesSection aiEnabled={aiEnabled} />
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in">
            <NotesSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
