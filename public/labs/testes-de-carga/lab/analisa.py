import csv, sys, math, collections
f = sys.argv[1]; w = int(sys.argv[2]) if len(sys.argv) > 2 else 10
t0 = None; B = collections.defaultdict(list); E = collections.defaultdict(int)
with open(f) as fh:
    for r in csv.DictReader(fh):
        if r['metric_name'] != 'http_req_duration': continue
        t = int(r['timestamp']); t0 = t if t0 is None else min(t0, t)
        B[t].append((float(r['metric_value']), r['status']))
t0 = min(B)
win = collections.defaultdict(list)
for t, v in B.items(): win[(t - t0) // w].extend(v)
def pct(v, p):
    v = sorted(v); return v[min(len(v)-1, math.ceil(p/100*len(v))-1)]
print("janela(s) | req/s | ok/s | p50 | p95 | p99 | erro%")
for k in sorted(win):
    v = win[k]; d = [x[0] for x in v]; err = sum(1 for x in v if x[1] != '201')
    print("%3d-%3d | %5.1f | %5.1f | %4.0f | %5.0f | %5.0f | %4.1f" % (k*w, (k+1)*w, len(v)/w, (len(v)-err)/w, pct(d,50), pct(d,95), pct(d,99), 100*err/len(v)))
