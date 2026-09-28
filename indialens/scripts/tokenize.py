import re, sys
from pathlib import Path

RULES = [
 (r"\bbg-white/70\b","bg-elevated/70"),(r"\bbg-white/80\b","bg-elevated/80"),
 (r"\bbg-white/95\b","bg-elevated/95"),(r"\bbg-white/98\b","bg-elevated/98"),
 (r"\bbg-rose-100/50\b","bg-accent-dim"),(r"\bbg-rose-50/80\b","bg-accent-dim"),
 (r"\bfrom-rose-100/50\b","from-accent/10"),(r"\bvia-purple-100/30\b","via-accent/5"),
 (r"\bto-blue-100/40\b","to-sys-blue/10"),
 (r"\bbg-\[#F8FAFC\]","bg-surface"),(r"\bbg-\[#FFFFFF\]","bg-elevated"),
 (r"\bbg-\[#F5F5F7\]","bg-surface"),(r"\bbg-\[#FAFAFA\]","bg-surface"),
 (r"\bbg-\[#F4F4F5\]","bg-surface"),
 (r"\bbg-slate-50\b","bg-surface"),(r"\bbg-slate-100\b","bg-chip"),
 (r"\bbg-slate-200\b","bg-chip"),(r"\bbg-zinc-100\b","bg-chip"),
 (r"\bbg-zinc-50\b","bg-surface"),(r"\bbg-white\b","bg-elevated"),
 (r"\bbg-black\b","bg-ink"),(r"\bbg-zinc-900\b","bg-ink"),
 (r"\bbg-zinc-950\b","bg-ink"),(r"\bbg-slate-900\b","bg-ink"),
 (r"\bbg-gray-50\b","bg-surface"),(r"\bbg-gray-100\b","bg-chip"),
 (r"\btext-zinc-950\b","text-ink"),(r"\btext-zinc-900\b","text-ink"),
 (r"\btext-zinc-800\b","text-ink"),(r"\btext-zinc-700\b","text-ink"),
 (r"\btext-slate-900\b","text-ink"),(r"\btext-slate-800\b","text-ink"),
 (r"\btext-slate-700\b","text-ink"),
 (r"\btext-zinc-600\b","text-ink-2"),(r"\btext-zinc-500\b","text-ink-2"),
 (r"\btext-slate-600\b","text-ink-2"),(r"\btext-slate-500\b","text-ink-2"),
 (r"\btext-gray-600\b","text-ink-2"),(r"\btext-gray-500\b","text-ink-2"),
 (r"\btext-zinc-400\b","text-ink-3"),(r"\btext-zinc-300\b","text-ink-3"),
 (r"\btext-slate-400\b","text-ink-3"),(r"\btext-slate-300\b","text-ink-3"),
 (r"\btext-gray-400\b","text-ink-3"),(r"\btext-gray-300\b","text-ink-3"),
 (r"\btext-white\b","text-elevated"),(r"\btext-black\b","text-ink"),
 (r"\bborder-slate-200/90\b","border-line/10"),(r"\bborder-slate-200/80\b","border-line/10"),
 (r"\bborder-slate-200/70\b","border-line/10"),(r"\bborder-slate-200/50\b","border-line/10"),
 (r"\bborder-slate-200\b","border-line/10"),(r"\bborder-slate-100\b","border-line/5"),
 (r"\bborder-slate-300\b","border-line/20"),(r"\bborder-slate-400\b","border-line/30"),
 (r"\bborder-zinc-200\b","border-line/10"),(r"\bborder-zinc-100\b","border-line/5"),
 (r"\bborder-gray-200\b","border-line/10"),(r"\bborder-gray-100\b","border-line/5"),
 (r"\bdivide-slate-200\b","divide-line/10"),(r"\bdivide-slate-100\b","divide-line/5"),
 (r"\btext-rose-600\b","text-accent"),(r"\btext-rose-700\b","text-accent"),
 (r"\btext-rose-500\b","text-accent"),(r"\bbg-rose-600\b","bg-accent"),
 (r"\bbg-rose-500\b","bg-accent"),(r"\bbg-rose-50\b","bg-accent-dim"),
 (r"\bbg-rose-100\b","bg-accent-dim"),(r"\bborder-rose-200/80\b","border-accent/25"),
 (r"\bborder-rose-200\b","border-accent/25"),(r"\bborder-rose-300\b","border-accent/30"),
 (r"\bbg-emerald-500\b","bg-sys-green"),(r"\bbg-emerald-600\b","bg-sys-green"),
 (r"\bbg-emerald-50/70\b","bg-sys-green/10"),(r"\bbg-emerald-50\b","bg-sys-green/10"),
 (r"\bborder-emerald-200\b","border-sys-green/30"),(r"\btext-emerald-600\b","text-sys-green"),
 (r"\btext-emerald-700\b","text-sys-green"),(r"\btext-emerald-500\b","text-sys-green"),
 (r"\btext-amber-500\b","text-sys-amber"),(r"\btext-amber-600\b","text-sys-amber"),
 (r"\bbg-amber-500\b","bg-sys-amber"),(r"\btext-blue-600\b","text-sys-blue"),
 (r"\btext-blue-500\b","text-sys-blue"),(r"\bbg-blue-600\b","bg-sys-blue"),
 (r"\bbg-blue-50\b","bg-sys-blue/10"),(r"\bborder-blue-200\b","border-sys-blue/30"),
]
COMPILED=[(re.compile(p),r) for p,r in RULES]
RESIDUAL=re.compile(r"\bbg-\[#[0-9a-fA-F]{3,8}\]|\btext-\[#[0-9a-fA-F]{3,8}\]|\bborder-\[#[0-9a-fA-F]{3,8}\]|\bbg-white\b|\bbg-zinc-\d+\b|\btext-zinc-\d+\b|\bborder-slate-\d+\b|\bbg-slate-\d+\b|\btext-slate-\d+\b|\bbg-black\b")
grand=0;resid=0
for arg in sys.argv[1:]:
    p=Path(arg)
    if not p.exists():
        print(f"MISSING  {p}"); continue
    src=p.read_text();out=src;n_tot=0
    for pat,rep in COMPILED:
        out,n=pat.subn(rep,out);n_tot+=n
    if out!=src: p.write_text(out)
    r=len(RESIDUAL.findall(out));grand+=n_tot;resid+=r
    print(f"{n_tot:4d}  {p}" + ("" if r==0 else f"   ({r} residual)"))
print(f"{grand:4d}  TOTAL substituted")
print(f"{resid:4d}  TOTAL residual (unconverted, left visible)")
