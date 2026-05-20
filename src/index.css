@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply bg-slate-100 text-slate-900;
    font-family: var(--font-sans);
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0mm;
  }

  html, body {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    width: 100%;
  }

  #root, #root > div, main, .overflow-y-auto, .overflow-auto {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
    position: static !important;
  }

  header, footer, .no-print, button, .tabs, .no-print-section, aside, .sidebar {
    display: none !important;
  }

  body.custom-print-mode {
    visibility: hidden;
  }
  body.custom-print-mode #print-area, 
  body.custom-print-mode #print-area * {
    visibility: visible;
  }
  body.custom-print-mode #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: 210mm;
    margin: 0;
    padding: 0;
  }

  .page-break-always, .break-after-page { 
    page-break-after: always !important; 
    break-after: page !important; 
    display: block !important;
    height: 1px;
    margin-bottom: -1px;
  }
  
  .page-break-inside-avoid { 
    page-break-inside: avoid !important; 
    break-inside: avoid !important; 
  }

  table { page-break-inside: auto !important; }
  tr { page-break-inside: avoid !important; page-break-after: auto !important; }
  thead { display: table-header-group !important; }
  tfoot { display: table-footer-group !important; }

  body.custom-print-mode.hide-cutlist .print-section-cutlist { display: none !important; }
  body.custom-print-mode.hide-plan .print-section-plan { display: none !important; }
  body.custom-print-mode.hide-labels .print-section-labels { display: none !important; }

  body.printing-layout .page-landscape {
    page-break-after: always !important;
    width: 100% !important;
    height: auto !important;
    min-height: 90vh !important;
  }
  body.printing-report .print-section-report { display: block !important; }
}

@media screen {
  .page-container {
    @apply bg-white w-full max-w-[1100px] mx-auto mb-8 p-8 shadow-xl border border-slate-200 rounded-lg;
  }
}
