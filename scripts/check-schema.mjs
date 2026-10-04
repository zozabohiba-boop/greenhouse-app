// يتأكد إن تعريف الأعمدة في schema.ts مطابق تمامًا لقاعدة البيانات الفعلية
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const src = readFileSync('src/lib/database.types.ts', 'utf8');
const sf = ts.createSourceFile('t.ts', src, ts.ScriptTarget.Latest, true);
const rows = {};
function visit(n, path) {
  if (ts.isPropertySignature(n) && n.name) {
    const name = n.name.getText(sf);
    const p = [...path, name];
    if (p.length >= 4 && p[p.length - 4] === 'public' && p[p.length - 3] === 'Tables' && name === 'Row' && n.type && ts.isTypeLiteralNode(n.type)) {
      rows[p[p.length - 2]] = n.type.members.map((m) => m.name.getText(sf));
      return;
    }
    if (n.type) ts.forEachChild(n.type, (c) => visit(c, p));
    return;
  }
  ts.forEachChild(n, (c) => visit(c, path));
}
visit(sf, []);
const mod = await import('../src/lib/schema.ts');
let bad = 0;
for (const [t, spec] of Object.entries(mod.WRITABLE)) {
  const db = new Set(rows[t] || []);
  const mine = new Set([...Object.keys(spec.columns), ...(spec.generated || []), 'server_updated_at', 'updated_by']);
  const missing = [...db].filter((c) => !mine.has(c));
  const extra = [...mine].filter((c) => !db.has(c));
  if (missing.length || extra.length) { bad++; console.log(t, { missing, extra }); }
}
console.log(bad ? `${bad} mismatched tables` : `schema OK — ${Object.keys(mod.WRITABLE).length} writable tables match the database`);
process.exit(bad ? 1 : 0);
