import csv, sys, math, collections
# analisa por cenário e janela: python3 analisa2.py arquivo.csv
f=sys.argv[1]
rows=collections.defaultdict(list); t0=None
with open(f) as fh:
    for r in csv.DictReader(fh):
        if r['metric_name']!='http_req_duration': continue
        t=int(r['timestamp']); t0=t if t0 is None else min(t0,t)
        rows[r['scenario']].append((t, float(r['metric_value']), r['status']))
def pct(v,p):
    v=sorted(v); return v[min(len(v)-1, math.ceil(p/100*len(v))-1)]
for sc,v in rows.items():
    print("cenário", sc)
    for a,b,nome in ((5,20,"antes"),(25,50,"durante"),(55,80,"depois")):
        w=[x for x in v if a<=x[0]-t0<b]
        if not w: continue
        ok=[x for x in w if x[2] in ('200','201')]
        c503=sum(1 for x in w if x[2]=='503'); c504=sum(1 for x in w if x[2]=='504')
        print("  %-8s n=%4d ok=%5.1f%% 503=%4d 504=%3d p95(ok)=%5.0f ms"%(nome,len(w),100*len(ok)/len(w),c503,c504,pct([x[1] for x in ok],95) if ok else float('nan')))
