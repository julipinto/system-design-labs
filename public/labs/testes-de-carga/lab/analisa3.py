import csv, sys, math, collections
# analisa3.py arquivo.csv topo duracao_s [janela]  -> taxa OFERECIDA (rampa) por janela, concluídos/s, p50, p95, p99, erro%
f=sys.argv[1]; top=float(sys.argv[2]); T=float(sys.argv[3]); w=int(sys.argv[4]) if len(sys.argv)>4 else 10
B=collections.defaultdict(list)
rows=[]
with open(f) as fh:
    for r in csv.DictReader(fh):
        if r['metric_name']!='http_req_duration': continue
        rows.append((int(r['timestamp']), float(r['metric_value']), r['status']))
t0=min(r[0] for r in rows)
for t,d,s in rows: B[(t-t0)//w].append((d,s))
def pct(v,p):
    v=sorted(v); return v[min(len(v)-1, math.ceil(p/100*len(v))-1)]
print("janela | oferecida/s | concluidos/s | p50 | p95 | p99 | erro%")
for k in sorted(B):
    mid=k*w+w/2
    if mid>T: continue
    v=B[k]; d=[x[0] for x in v]; err=sum(1 for x in v if x[1]!='201')
    off=1+(top-1)*mid/T
    print("%3d-%3d | %6.1f | %6.1f | %5.0f | %5.0f | %5.0f | %5.1f"%(k*w,(k+1)*w,off,(len(v)-err)/w,pct(d,50),pct(d,95),pct(d,99),100*err/len(v)))
