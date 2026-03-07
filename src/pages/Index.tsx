import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, StickyNote } from "lucide-react";
import FichesSection from "@/components/FichesSection";
import NotesSection from "@/components/NotesSection";

const Index = () => {
  const [activeTab, setActiveTab] = useState("fiches");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        </div>
      </header>

      {/* Main Content */}
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
            <FichesSection />
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
