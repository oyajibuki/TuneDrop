-- TuneDrop スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください

-- uuid extension
create extension if not exists "uuid-ossp";

-- ① users テーブル
create table public.users (
  id          uuid references auth.users on delete cascade primary key,
  name        varchar(50)  not null,
  birth_date  date         not null,
  gender      varchar(20)  not null,
  avatar_url  text,
  is_online   boolean      default true,
  created_at  timestamptz  default now()
);

-- ② drops テーブル
create table public.drops (
  id          uuid         default uuid_generate_v4() primary key,
  user_id     uuid         references public.users on delete cascade not null,
  text        varchar(30)  not null,
  color       varchar(40)  not null,
  pos_x       float        not null,
  pos_y       float        not null,
  anim_type   integer      not null,
  created_at  timestamptz  default now()
);

-- ③ rooms テーブル
create table public.rooms (
  id               uuid        default uuid_generate_v4() primary key,
  user1_id         uuid        references public.users on delete cascade not null,
  user2_id         uuid        references public.users on delete cascade not null,
  expires_at       timestamptz not null,
  status           varchar(20) default 'active',
  user1_extended   boolean     default false,
  user2_extended   boolean     default false,
  created_at       timestamptz default now()
);

-- ④ messages テーブル
create table public.messages (
  id          uuid        default uuid_generate_v4() primary key,
  room_id     uuid        references public.rooms on delete cascade not null,
  user_id     uuid        references public.users on delete set null,
  text        text        not null,
  is_system   boolean     default false,
  created_at  timestamptz default now()
);

-- Realtime 有効化
alter publication supabase_realtime add table public.drops;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.messages;

-- RLS 有効化
alter table public.users    enable row level security;
alter table public.drops    enable row level security;
alter table public.rooms    enable row level security;
alter table public.messages enable row level security;

-- users ポリシー
create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (auth.uid() = id);
create policy "users_update" on public.users for update using (auth.uid() = id);
create policy "users_delete" on public.users for delete using (auth.uid() = id);

-- drops ポリシー
create policy "drops_select" on public.drops for select using (true);
create policy "drops_insert" on public.drops for insert with check (auth.uid() = user_id);
create policy "drops_delete" on public.drops for delete using (auth.uid() = user_id);

-- rooms ポリシー
create policy "rooms_select" on public.rooms for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "rooms_insert" on public.rooms for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "rooms_update" on public.rooms for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- messages ポリシー
create policy "messages_select" on public.messages for select
  using (
    exists (
      select 1 from public.rooms
      where rooms.id = messages.room_id
        and (rooms.user1_id = auth.uid() or rooms.user2_id = auth.uid())
    )
  );
create policy "messages_insert" on public.messages for insert
  with check (
    auth.uid() = user_id
    or (
      user_id is null
      and exists (
        select 1 from public.rooms
        where rooms.id = messages.room_id
          and (rooms.user1_id = auth.uid() or rooms.user2_id = auth.uid())
      )
    )
  );
