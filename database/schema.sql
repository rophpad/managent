create table if not exists users (
    id bigserial primary key,
    email text not null unique,
    password_hash text not null,
    created_at timestamptz not null default now()
);

create table if not exists workspaces (
    id bigserial primary key,
    name text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists api_keys (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    hash text not null,
    created_at timestamptz not null default now()
);

create table if not exists connectors (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    name text not null,
    transport text not null,
    configuration jsonb not null default '{}'::jsonb,
    status text not null default 'disconnected',
    last_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists connector_secrets (
    id bigserial primary key,
    connector_id bigint not null references connectors(id) on delete cascade,
    scope text not null,
    name text not null,
    value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (connector_id, scope, name)
);

create table if not exists tools (
    id bigserial primary key,
    connector_id bigint not null references connectors(id) on delete cascade,
    name text not null,
    schema jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists policies (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    rule jsonb not null,
    action text not null,
    created_at timestamptz not null default now()
);

create table if not exists audit_logs (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    tool text not null,
    request jsonb not null,
    response jsonb,
    decision text not null,
    created_at timestamptz not null default now()
);
