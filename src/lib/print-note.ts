import { FormatNote } from "@/types";
import { toast } from "sonner";

function generateA4Html(note: FormatNote): string {
  const date = new Date(note.updatedAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const keywordsBadges = (keywords: string[], color: string) =>
    keywords.map((kw) => `<span style="display:inline-block;background:${color};color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px 4px 2px 0;">${kw}</span>`).join("");

  const machinesSections = (note.machines || []).map((m) => `
    <div style="border:2px solid #1a2744;border-radius:8px;margin-bottom:14px;overflow:hidden;">
      <div style="background:#1a2744;color:#fff;padding:10px 16px;font-size:14px;font-weight:700;letter-spacing:0.5px;display:flex;align-items:center;gap:8px;">
        <span style="display:inline-block;width:20px;height:20px;background:#3b82f6;border-radius:50%;text-align:center;line-height:20px;font-size:11px;">⚙</span>
        ${m.machine}
      </div>
      <div style="padding:14px 16px;">
        ${m.content ? `<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${m.content}</p>` : ""}
        ${m.keywords.length > 0 ? `<div style="margin-top:6px;">${keywordsBadges(m.keywords, "#3b82f6")}</div>` : ""}
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${note.title} - COVINOR Régleur</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
    color: #1e293b;
    background: #fff;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    position: relative;
  }
  @media print {
    body { width: 210mm; min-height: 297mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:24px 30px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:48px;height:48px;background:#3b82f6;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;">C</div>
      <div>
        <div style="font-size:22px;font-weight:800;letter-spacing:1px;">COVINOR</div>
        <div style="font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Fiche de format · Régleur</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;opacity:0.7;">Date de mise à jour</div>
      <div style="font-size:14px;font-weight:600;">${date}</div>
    </div>
  </div>

  <!-- Title bar -->
  <div style="background:#f1f5f9;border-bottom:3px solid #3b82f6;padding:16px 30px;">
    <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin:0;">${note.title}</h1>
  </div>

  <div style="padding:24px 30px 60px;">
    ${note.content ? `
    <!-- General notes -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Notes générales</div>
      <div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:14px 16px;border-radius:0 6px 6px 0;">
        <p style="font-size:13px;line-height:1.7;color:#334155;white-space:pre-wrap;margin:0;">${note.content}</p>
      </div>
    </div>
    ` : ""}

    ${note.keywords.length > 0 ? `
    <!-- Keywords -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Mots-clés</div>
      <div style="padding:4px 0;">${keywordsBadges(note.keywords, "#0f172a")}</div>
    </div>
    ` : ""}

    ${(note.machines || []).length > 0 ? `
    <!-- Machines -->
    <div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;font-weight:700;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Réglages par machine</div>
      ${machinesSections}
    </div>
    ` : ""}
  </div>

  <!-- Footer -->
  <div style="position:fixed;bottom:0;left:0;right:0;background:#f1f5f9;border-top:1px solid #e2e8f0;padding:10px 30px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
    <span>COVINOR Régleur · Document interne</span>
    <span>${date}</span>
  </div>
</body>
</html>`;
}

export function generateAndPrintNote(note: FormatNote) {
  try {
    const html = generateA4Html(note);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup bloquée — autorisez les popups pour imprimer.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
    toast.success("Fiche A4 prête !");
  } catch (err) {
    console.error("Print error:", err);
    toast.error("Erreur lors de la génération.");
  }
}
