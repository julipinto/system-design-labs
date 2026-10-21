package main

import (
	"context"
	"encoding/hex"
	"fmt"
	"net"
	"os"
	"strconv"
	"sync"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type raw struct{}

func (raw) Marshal(v any) ([]byte, error)   { return *(v.(*[]byte)), nil }
func (raw) Unmarshal(d []byte, v any) error { *(v.(*[]byte)) = append([]byte(nil), d...); return nil }
func (raw) Name() string                    { return "proto" }

func main() {
	req, _ := hex.DecodeString("089a0810ca161a03706978")
	resp, _ := hex.DecodeString("0a06632d37373331120870656e64656e7465")
	if os.Args[1] == "server" {
		l, _ := net.Listen("tcp", "127.0.0.1:50071")
		s := grpc.NewServer(grpc.ForceServerCodec(raw{}), grpc.UnknownServiceHandler(func(srv any, st grpc.ServerStream) error {
			var in []byte
			if err := st.RecvMsg(&in); err != nil {
				return err
			}
			return st.SendMsg(&resp)
		}))
		s.Serve(l)
		return
	}
	cc, err := grpc.Dial("127.0.0.1:50072", grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithDefaultCallOptions(grpc.ForceCodec(raw{})))
	if err != nil {
		panic(err)
	}
	n, _ := strconv.Atoi(os.Args[2])
	pause, _ := time.ParseDuration(os.Args[3])
	var wg sync.WaitGroup
	for w := 0; w < 8; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < n/8; i++ {
				ctx, c := context.WithTimeout(context.Background(), time.Second)
				var out []byte
				err := cc.Invoke(ctx, "/loja.pagamentos.v1.Pagamentos/Cobrar", &req, &out)
				c()
				if i < 2 {
					fmt.Println(i+1, err, hex.EncodeToString(out))
				}
				time.Sleep(pause)
			}
		}()
	}
	wg.Wait()
}
