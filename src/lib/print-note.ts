import { FormatNote } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function generateAndPrintNote(note: FormatNote) {
  toast.info("Génération de la fiche A4 par l'IA...");

  try {
    const { data, error } = await supabase.functions.invoke("generate-fiche-pdf", {
      body: { note },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    const html = data.html;

    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup bloquée — autorisez les popups pour imprimer.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };

    toast.success("Fiche A4 générée !");
  } catch (err) {
    console.error("Print generation error:", err);
    toast.error("Erreur lors de la génération de la fiche.");
  }
}
