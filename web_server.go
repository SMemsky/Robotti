// A simple http file server
package main

import (
    "flag"
    "log"
    "net/http"
    "time"
)

var fileHandler = http.FileServer(http.Dir("./"))

func handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
    time.Sleep(1 * time.Millisecond)
    fileHandler.ServeHTTP(w, r)
}

func main() {
    port := flag.String("p", "8080", "server port")
    flag.Parse()

    http.HandleFunc("/", handler)

    log.Printf("Serving on HTTP port: %s\n", *port)
    log.Fatal(http.ListenAndServe(":"+*port, nil))
}
