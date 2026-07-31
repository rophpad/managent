create table if not exists users (
    id bigserial primary key,
    email text not null unique,
    password_hash text not null,
    created_at timestamptz not null default now()
);

create table if not exists user_sessions (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    token_hash text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    last_used_at timestamptz not null default now()
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

create table if not exists mcps (
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

create table if not exists mcp_secrets (
    id bigserial primary key,
    mcp_id bigint not null references mcps(id) on delete cascade,
    scope text not null,
    name text not null,
    value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (mcp_id, scope, name)
);

create table if not exists tools (
    id bigserial primary key,
    mcp_id bigint not null references mcps(id) on delete cascade,
    name text not null,
    schema jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- Migrate the legacy connector-backed tool cache. Tool rows are disposable
-- snapshots and are repopulated from connected MCPs during gateway startup.
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'tools' and column_name = 'connector_id'
    ) and not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'tools' and column_name = 'mcp_id'
    ) then
        truncate table tools;
        alter table tools drop constraint if exists tools_connector_id_fkey;
        alter table tools rename column connector_id to mcp_id;
        alter table tools add constraint tools_mcp_id_fkey
            foreign key (mcp_id) references mcps(id) on delete cascade;
    end if;
end $$;

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

create table if not exists agents (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    name text not null,
    owner text not null default '',
    tags jsonb not null default '[]'::jsonb,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    last_seen_at timestamptz
);

update agents set tags = '[]'::jsonb where tags = 'null'::jsonb;

create table if not exists agent_keys (
    id bigserial primary key,
    agent_id bigint not null references agents(id) on delete cascade,
    hash text not null unique,
    last4 text not null,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    revoked_at timestamptz
);

create table if not exists approval_integrations (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    provider text not null,
    status text not null default 'disconnected',
    default_channel text,
    credential_ref text,
    signing_secret_ref text,
    config jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (workspace_id, provider)
);

create table if not exists approval_integration_secrets (
    id bigserial primary key,
    integration_id bigint not null references approval_integrations(id) on delete cascade,
    name text not null,
    value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (integration_id, name)
);

create table if not exists pending_approvals (
    id bigserial primary key,
    workspace_id bigint not null references workspaces(id) on delete cascade,
    agent_id bigint not null references agents(id) on delete cascade,
    tool_id text not null,
    tool_name text not null,
    action text not null,
    payload_summary jsonb not null default '{}'::jsonb,
    policy_id bigint,
    policy_name text,
    channel text,
    provider text,
    status text not null default 'pending',
    decided_by text,
    decision_reason text,
    message_id text,
    requested_at timestamptz not null default now(),
    decided_at timestamptz
);

alter table mcps add column if not exists endpoint text;
alter table mcps add column if not exists credential_ref text;
alter table mcps add column if not exists agent_id bigint references agents(id) on delete set null;
alter table mcps add column if not exists updated_at timestamptz not null default now();

alter table policies add column if not exists name text not null default '';
alter table policies add column if not exists subject_type text not null default 'tag';
alter table policies add column if not exists subject_value text not null default '*';
alter table policies add column if not exists tool_tag text;
alter table policies add column if not exists action_name text not null default 'call';
alter table policies add column if not exists effect text not null default 'deny';
alter table policies add column if not exists condition jsonb not null default '{}'::jsonb;
alter table policies add column if not exists rate_limit text;
alter table policies add column if not exists channel_override text;
alter table policies add column if not exists precedence integer not null default 1000;

alter table audit_logs add column if not exists agent_id bigint references agents(id) on delete set null;
alter table audit_logs add column if not exists tool_id text;
alter table audit_logs add column if not exists action text;
alter table audit_logs add column if not exists payload_summary jsonb;
alter table audit_logs add column if not exists decided_by text;
alter table audit_logs add column if not exists latency_ms bigint;
