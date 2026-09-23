const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'lib/store.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/TRACIA_PROD_CASES_V2/g, 'TRACIA_PROD_CASES_V3');
c = c.replace(/TRACIA_PROD_FIRS_V2/g, 'TRACIA_PROD_FIRS_V3');
c = c.replace(/TRACIA_PROD_EVIDENCE_V2/g, 'TRACIA_PROD_EVIDENCE_V3');
c = c.replace(/TRACIA_PROD_AUDIT_V2/g, 'TRACIA_PROD_AUDIT_V3');
c = c.replace(/TRACIA_PROD_SELECTED_CASE_V2/g, 'TRACIA_PROD_SELECTED_CASE_V3');

const purgeOld = `      localStorage.removeItem("TRACIA_CASES_V1");
      localStorage.removeItem("TRACIA_FIRS_V1");
      localStorage.removeItem("TRACIA_EVIDENCE_V1");
      localStorage.removeItem("TRACIA_AUDIT_V1");
      localStorage.removeItem("TRACIA_SELECTED_CASE_V1");`;

const purgeWithV2 = `      localStorage.removeItem("TRACIA_CASES_V1");
      localStorage.removeItem("TRACIA_FIRS_V1");
      localStorage.removeItem("TRACIA_EVIDENCE_V1");
      localStorage.removeItem("TRACIA_AUDIT_V1");
      localStorage.removeItem("TRACIA_SELECTED_CASE_V1");
      localStorage.removeItem("TRACIA_PROD_CASES_V2");
      localStorage.removeItem("TRACIA_PROD_FIRS_V2");
      localStorage.removeItem("TRACIA_PROD_EVIDENCE_V2");
      localStorage.removeItem("TRACIA_PROD_AUDIT_V2");
      localStorage.removeItem("TRACIA_PROD_SELECTED_CASE_V2");`;

const isCRLF = c.includes('\r\n');
const target = isCRLF ? purgeOld.replace(/\n/g, '\r\n') : purgeOld;
const replacement = isCRLF ? purgeWithV2.replace(/\n/g, '\r\n') : purgeWithV2;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Successfully updated lib/store.tsx to V3 storage and purged V2');
} else {
  console.log('Purge block not matched directly, updating keys only');
  fs.writeFileSync(p, c, 'utf8');
}
