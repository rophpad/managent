FROM golang:1.25-alpine AS builder

WORKDIR /app

ARG GITHUB_MCP_SERVER_VERSION=v1.5.0

COPY go.mod go.sum ./
RUN go mod download
RUN GOBIN=/out go install github.com/github/github-mcp-server/cmd/github-mcp-server@${GITHUB_MCP_SERVER_VERSION}

COPY cmd ./cmd
COPY config ./config
COPY database ./database
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/managent-gateway ./cmd/gateway
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/hello-mcp ./cmd/hello-mcp

FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache nodejs npm

COPY --from=builder /out/managent-gateway /app/bin/managent-gateway
COPY --from=builder /out/hello-mcp /app/bin/hello-mcp
COPY --from=builder /out/github-mcp-server /app/bin/github-mcp-server
COPY config/managent.docker.json /app/config/managent.docker.json
COPY database/schema.sql /app/database/schema.sql

EXPOSE 8080

CMD ["/app/bin/managent-gateway"]
