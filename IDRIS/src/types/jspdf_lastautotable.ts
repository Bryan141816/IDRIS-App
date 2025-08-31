// src/global.d.ts
export {}; // make this file a module (required with isolatedModules)

import "jspdf";

declare module "jspdf" {
  interface jsPDF {
    // set by jspdf-autotable v3+
    lastAutoTable?: { finalY: number };
  }
}
