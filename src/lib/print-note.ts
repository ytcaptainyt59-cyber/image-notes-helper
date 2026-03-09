import { FormatNote } from "@/types";
import { toast } from "sonner";

function generateA4Html(note: FormatNote): string {
  const date = new Date(note.updatedAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const time = new Date(note.updatedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });

  const machineIcons: Record<string, string> = {
    POSIMAT: "⊞",
    "TIREUSE VINAIGRETTE": "◉",
    "TIREUSE VINAIGRE": "◎",
    BOUCHONNEUSE: "⊛",
    ÉTIQUETEUSE: "◧",
    PRASMATIC: "◈",
  };

  const machineColors: Record<string, [string, string]> = {
    POSIMAT: ["#0d9488", "#ccfbf1"],
    "TIREUSE VINAIGRETTE": ["#b45309", "#fef3c7"],
    "TIREUSE VINAIGRE": ["#9333ea", "#f3e8ff"],
    BOUCHONNEUSE: ["#2563eb", "#dbeafe"],
    ÉTIQUETEUSE: ["#dc2626", "#fee2e2"],
    PRASMATIC: ["#0891b2", "#cffafe"],
  };

  const keywordsBadges = (keywords: string[], bg: string, fg: string) =>
    keywords
      .map(
        (kw) =>
          `<span style="display:inline-block;background:${bg};color:${fg};padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;margin:2px 4px 2px 0;letter-spacing:0.5px;text-transform:uppercase;">${kw}</span>`
      )
      .join("");

  const machinesSections = (note.machines || [])
    .map((m) => {
      const [accent, lightBg] = machineColors[m.machine] || ["#475569", "#f1f5f9"];
      const icon = machineIcons[m.machine] || "⚙";
      return `
      <div style="border:1.5px solid ${accent}33;border-radius:12px;margin-bottom:16px;overflow:hidden;break-inside:avoid;box-shadow:0 2px 8px ${accent}11;">
        <div style="background:linear-gradient(135deg,${accent} 0%,${accent}dd 100%);color:#fff;padding:12px 20px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:8px;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(4px);">${icon}</span>
          ${m.machine}
        </div>
        <div style="padding:16px 20px;background:${lightBg};">
          ${m.content ? `<p style="margin:0 0 10px;font-size:12.5px;line-height:1.75;color:#1e293b;white-space:pre-wrap;">${m.content}</p>` : ""}
          ${m.keywords.length > 0 ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid ${accent}22;">${keywordsBadges(m.keywords, accent, "#fff")}</div>` : ""}
        </div>
      </div>`;
    })
    .join("");

  const totalMachines = (note.machines || []).length;
  const totalKeywords =
    note.keywords.length +
    (note.machines || []).reduce((s, m) => s + m.keywords.length, 0);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${note.title} - COVINOR Régleur</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600&display=swap');
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    color: #1e293b;
    background: #fff;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    body { width: 210mm; min-height: 297mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

  <!-- Decorative top stripe -->
  <div style="height:6px;background:linear-gradient(90deg,#f97316 0%,#fb923c 25%,#0d9488 50%,#14b8a6 75%,#f97316 100%);"></div>

  <!-- Header -->
  <div style="background:linear-gradient(145deg,#0c1220 0%,#1a2744 40%,#1e3a5f 100%);color:#fff;padding:28px 32px 24px;position:relative;overflow:hidden;">
    <!-- Decorative pattern -->
    <div style="position:absolute;top:0;right:0;width:200px;height:100%;opacity:0.05;background:repeating-linear-gradient(45deg,transparent,transparent 10px,#fff 10px,#fff 12px);"></div>
    <div style="position:absolute;top:-20px;right:40px;width:100px;height:100px;border:2px solid rgba(249,115,22,0.15);border-radius:50%;"></div>
    <div style="position:absolute;bottom:-30px;right:100px;width:70px;height:70px;border:2px solid rgba(14,165,233,0.1);border-radius:50%;"></div>
    
    <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;gap:18px;">
        <div style="width:54px;height:54px;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;box-shadow:0 4px 20px rgba(249,115,22,0.4);letter-spacing:-1px;">C</div>
        <div>
          <div style="font-size:26px;font-weight:900;letter-spacing:2px;background:linear-gradient(135deg,#fff 0%,#e2e8f0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">COVINOR</div>
          <div style="font-size:10px;opacity:0.6;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Vinaigres & Condiments · Fiche de format</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:10px 16px;">
          <div style="font-size:9px;opacity:0.5;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;">Mise à jour</div>
          <div style="font-size:15px;font-weight:700;">${date}</div>
          <div style="font-size:11px;opacity:0.5;margin-top:1px;">${time}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Title bar with stats -->
  <div style="background:linear-gradient(135deg,#fff7ed 0%,#fffbeb 50%,#f0fdfa 100%);border-bottom:2px solid #f97316;padding:18px 32px;display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#f97316;font-weight:700;margin-bottom:4px;">Format de production</div>
      <h1 style="font-size:22px;font-weight:900;color:#0c1220;margin:0;letter-spacing:-0.3px;">${note.title}</h1>
    </div>
    <div style="display:flex;gap:12px;">
      <div style="text-align:center;background:#fff;border-radius:10px;padding:8px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
        <div style="font-size:20px;font-weight:900;color:#f97316;">${totalMachines}</div>
        <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Machine${totalMachines > 1 ? "s" : ""}</div>
      </div>
      <div style="text-align:center;background:#fff;border-radius:10px;padding:8px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
        <div style="font-size:20px;font-weight:900;color:#0d9488;">${totalKeywords}</div>
        <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Repère${totalKeywords > 1 ? "s" : ""}</div>
      </div>
    </div>
  </div>

  <div style="padding:24px 32px 80px;">

    ${note.content ? `
    <!-- General notes -->
    <div style="margin-bottom:22px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="width:4px;height:18px;background:linear-gradient(180deg,#f97316,#fb923c);border-radius:4px;"></div>
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#64748b;font-weight:800;">Notes générales</span>
      </div>
      <div style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-left:4px solid #f97316;padding:16px 20px;border-radius:0 12px 12px 0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <p style="font-size:12.5px;line-height:1.8;color:#334155;white-space:pre-wrap;margin:0;">${note.content}</p>
      </div>
    </div>
    ` : ""}

    ${note.keywords.length > 0 ? `
    <!-- Keywords -->
    <div style="margin-bottom:22px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="width:4px;height:18px;background:linear-gradient(180deg,#0d9488,#14b8a6);border-radius:4px;"></div>
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#64748b;font-weight:800;">Mots-clés du format</span>
      </div>
      <div style="padding:6px 0;">${keywordsBadges(note.keywords, "#0c1220", "#fff")}</div>
    </div>
    ` : ""}

    ${totalMachines > 0 ? `
    <!-- Machines -->
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <div style="width:4px;height:18px;background:linear-gradient(180deg,#2563eb,#60a5fa);border-radius:4px;"></div>
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#64748b;font-weight:800;">Réglages par machine</span>
        <div style="flex:1;height:1px;background:linear-gradient(90deg,#e2e8f0,transparent);margin-left:8px;"></div>
      </div>
      ${machinesSections}
    </div>
    ` : ""}
  </div>

  <!-- Footer -->
  <div style="position:fixed;bottom:0;left:0;right:0;overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#f97316 0%,#fb923c 25%,#0d9488 50%,#14b8a6 75%,#f97316 100%);"></div>
    <div style="background:#0c1220;padding:12px 32px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:20px;height:20px;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">C</div>
        <span style="font-size:9px;color:#64748b;letter-spacing:2px;text-transform:uppercase;font-weight:600;">COVINOR Régleur · Document interne confidentiel</span>
      </div>
      <div style="display:flex;align-items:center;gap:16px;">
        <span style="font-size:9px;color:#475569;font-family:'JetBrains Mono',monospace;">${date}</span>
        <span style="font-size:9px;color:#475569;">·</span>
        <span style="font-size:9px;color:#475569;font-family:'JetBrains Mono',monospace;">v${note.id.slice(0, 6).toUpperCase()}</span>
      </div>
    </div>
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
