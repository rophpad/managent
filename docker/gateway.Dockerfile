FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY config ./config
COPY database ./database
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/managent-gateway ./cmd/gateway

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /out/managent-gateway /app/bin/managent-gateway
COPY config /app/config
COPY database/schema.sql /app/database/schema.sql

EXPOSE 8080

CMD ["/app/bin/managent-gateway"]
