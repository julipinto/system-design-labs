import socket, threading, sys, time
sys.path.insert(0,"/caminho/com/hpack")
from hpack import Decoder
log=[]
def pump(a,b,d,dec):
    buf=b""; pre=(d=="c2s")
    while True:
        x=a.recv(65536)
        if not x: break
        b.sendall(x); buf+=x
        if pre and buf.startswith(b"PRI"): log.append((d,"PREFACE",0,24,0,"")); buf=buf[24:]; pre=False
        while len(buf)>=9:
            n=int.from_bytes(buf[:3],"big")
            if len(buf)<9+n: break
            t=buf[3]; p=buf[9:9+n]; extra=""
            if t==1: extra=str(dec.decode(p))
            log.append((d,{0:"DATA",1:"HEADERS",4:"SETTINGS",6:"PING",8:"WINDOW_UPDATE"}.get(t,t),buf[4],n,int.from_bytes(buf[5:9],"big")&0x7fffffff,extra)); buf=buf[9+n:]
ls=socket.socket(); ls.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1); ls.bind(("127.0.0.1",50072)); ls.listen()
c,_=ls.accept(); u=socket.create_connection(("127.0.0.1",50071))
d1,d2=Decoder(),Decoder()
a=threading.Thread(target=pump,args=(c,u,"c2s",d1),daemon=True); b=threading.Thread(target=pump,args=(u,c,"s2c",d2),daemon=True); a.start(); b.start(); a.join(); time.sleep(.5)
for d,t,f,n,s,e in log: print(d,t,f"flags={f}",f"payload={n}",f"total={n+9 if t!='PREFACE' else n}",f"stream={s}",e)
tot={}
for d,t,f,n,s,e in log: tot[d]=tot.get(d,0)+n+(9 if t!='PREFACE' else 0)
print("TOTAL",tot)
