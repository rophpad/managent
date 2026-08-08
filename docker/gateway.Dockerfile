FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY config ./config
COPY database ./database
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/managent-gateway ./cmd/gateway
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/hello-mcp ./cmd/hello-mcp

FROM node:22-alpine

WORKDIR /app

RUN mkdir -p /workspace

COPY --from=builder /out/managent-gateway /app/bin/managent-gateway
COPY --from=builder /out/hello-mcp /app/bin/hello-mcp
COPY config /app/config
COPY database/schema.sql /app/database/schema.sql

EXPOSE 8080

CMD ["/app/bin/managent-gateway"]
