import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, StickyNote, Sparkles, LogOut, User, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FichesSection from "@/components/FichesSection";
import NotesSection from "@/components/NotesSection";
import UsersSection from "@/components/UsersSection";

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
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="border-b border-border/30 px-3 sm:px-4 py-0 glass-card-elevated sticky top-0 z-50">
        <div className="mx-auto max-w-5xl flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <span className="font-display text-xs sm:text-sm font-bold text-white">C</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 status-dot bg-success" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-display tracking-tight text-foreground leading-tight">
                COVINOR <span className="gradient-text">Régleur</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.12em] sm:tracking-[0.15em] font-display flex items-center gap-1 hidden sm:flex">
                <Activity className="h-2.5 w-2.5 text-accent" />
                Gestion des formats & réglages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* AI Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 glass-card rounded-full px-2 sm:px-3 py-1 sm:py-1.5 hover-lift cursor-default">
              <Sparkles className={`h-3 sm:h-3.5 w-3 sm:w-3.5 transition-colors duration-300 ${aiEnabled ? "text-primary" : "text-muted-foreground/50"}`} />
              <span className={`text-[9px] sm:text-[10px] font-display uppercase tracking-wider hidden sm:inline transition-colors ${aiEnabled ? "text-primary" : "text-muted-foreground/50"}`}>
                IA
              </span>
              <Switch
                checked={aiEnabled}
                onCheckedChange={setAiEnabled}
                className="scale-75 sm:scale-90"
              />
            </div>

            {/* User chip */}
            <div className="flex items-center gap-1 sm:gap-1.5 glass-card rounded-full pl-1.5 sm:pl-2 pr-1 py-1 hover-lift">
              <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground font-display hidden sm:inline max-w-[80px] truncate">
                {user.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-6 w-6 p-0 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                onClick={onLogout}
                title="Déconnexion"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl p-4 pt-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card/50 mb-6 p-1.5 rounded-2xl border border-border/30 glass-card">
            <TabsTrigger
              value="fiches"
              className="flex-1 gap-2 rounded-xl font-display text-xs uppercase tracking-wider py-3
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80
                data-[state=active]:text-primary-foreground data-[state=active]:glow-primary
                data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              Fiches
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-1 gap-2 rounded-xl font-display text-xs uppercase tracking-wider py-3
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80
                data-[state=active]:text-primary-foreground data-[state=active]:glow-primary
                data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                transition-all duration-200"
            >
              <StickyNote className="h-4 w-4" />
              Formats
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex-1 gap-2 rounded-xl font-display text-xs uppercase tracking-wider py-3
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80
                data-[state=active]:text-primary-foreground data-[state=active]:glow-primary
                data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              Équipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fiches" className="animate-fade-in">
            <FichesSection aiEnabled={aiEnabled} />
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in">
            <NotesSection />
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in">
            <UsersSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom ambient glow */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/[0.03] to-transparent pointer-events-none" />
    </div>
  );
};

export default Index;
