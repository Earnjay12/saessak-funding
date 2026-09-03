-- 새싹 펀딩: Supabase 초기 설정
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전합니다.

create table if not exists students (
  id text primary key,
  grade int not null,
  class int not null,
  number int not null,
  password text not null,
  balance int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,                       -- 상품명
  summary text not null default '',          -- 홍보 문구
  creator text not null default '',          -- 제작자
  specs text not null default '',            -- 상품 정보 (한 줄에 하나)
  images text[] not null default '{}',       -- 사진 URL 목록
  created_at timestamptz not null default now()
);

-- 예전 버전으로 만든 테이블을 정리합니다. (없으면 건너뜀)
alter table projects add column if not exists creator text not null default '';
alter table projects add column if not exists specs text not null default '';
alter table projects add column if not exists images text[] not null default '{}';
alter table projects drop column if exists description;
alter table projects drop column if exists image_url;
alter table projects drop column if exists category;
alter table projects drop column if exists price;
alter table projects drop column if exists original_price;
alter table projects drop column if exists price_note;
alter table projects drop column if exists goal;
alter table projects drop column if exists deadline;
alter table projects drop column if exists status;

create table if not exists pledges (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references students(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  amount int not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists pledges_project_idx on pledges(project_id);
create index if not exists pledges_student_idx on pledges(student_id);

-- 사이트 설정 (펀딩 열림/마감)
create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);
insert into settings (key, value) values ('funding', '{"funding_open": true}'::jsonb)
on conflict (key) do nothing;

-- 상품별 모금 합계와 후원자 수
create or replace view project_stats with (security_invoker = true) as
select
  p.id as project_id,
  coalesce(sum(pl.amount), 0)::int as raised,
  count(distinct pl.student_id)::int as backers
from projects p
left join pledges pl on pl.project_id = p.id
group by p.id;

-- 펀딩이 열려 있는지
create or replace function funding_is_open()
returns boolean
language sql
stable
as $$
  select coalesce((select (value->>'funding_open')::boolean from settings where key = 'funding'), true);
$$;

-- 펀딩하기: 잔액 확인과 차감, 기록 추가를 한 번에 처리합니다.
create or replace function make_pledge(p_student_id text, p_project_id uuid, p_amount int)
returns json
language plpgsql
as $$
declare
  v_balance int;
begin
  if p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'error', 'invalid_amount');
  end if;
  if not funding_is_open() then
    return json_build_object('ok', false, 'error', 'closed');
  end if;
  if not exists (select 1 from projects where id = p_project_id) then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select balance into v_balance from students where id = p_student_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'no_student');
  end if;
  if v_balance < p_amount then
    return json_build_object('ok', false, 'error', 'insufficient');
  end if;

  update students set balance = balance - p_amount where id = p_student_id;
  insert into pledges (student_id, project_id, amount) values (p_student_id, p_project_id, p_amount);
  return json_build_object('ok', true, 'balance', v_balance - p_amount);
end
$$;

-- 펀딩 취소: 펀딩이 열려 있을 때만 가능하며 새싹을 돌려줍니다.
create or replace function cancel_pledge(p_student_id text, p_pledge_id uuid)
returns json
language plpgsql
as $$
declare
  v_pledge pledges%rowtype;
  v_balance int;
begin
  if not funding_is_open() then
    return json_build_object('ok', false, 'error', 'closed');
  end if;

  select * into v_pledge from pledges where id = p_pledge_id and student_id = p_student_id;
  if not found then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select balance into v_balance from students where id = p_student_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'no_student');
  end if;

  delete from pledges where id = p_pledge_id;
  update students set balance = balance + v_pledge.amount where id = p_student_id;
  return json_build_object('ok', true, 'balance', v_balance + v_pledge.amount);
end
$$;

-- 상품 삭제: 들어간 새싹을 학생들에게 돌려준 뒤 지웁니다.
create or replace function delete_project_with_refund(p_project_id uuid)
returns void
language plpgsql
as $$
begin
  update students s
     set balance = s.balance + r.total
    from (select student_id, sum(amount) as total from pledges where project_id = p_project_id group by student_id) r
   where s.id = r.student_id;
  delete from projects where id = p_project_id;
end
$$;

-- 초기화: 모든 펀딩 기록을 지우고 잔액을 시작 자금으로 되돌립니다.
create or replace function reset_pledges(p_balance int)
returns void
language plpgsql
as $$
begin
  delete from pledges;
  update students set balance = p_balance;
end
$$;

-- 보안: 앱 서버(서비스 키)만 접근하도록 다른 역할의 권한을 막습니다.
alter table students enable row level security;
alter table projects enable row level security;
alter table pledges enable row level security;
alter table settings enable row level security;
revoke execute on function make_pledge(text, uuid, int) from anon, authenticated;
revoke execute on function cancel_pledge(text, uuid) from anon, authenticated;
revoke execute on function delete_project_with_refund(uuid) from anon, authenticated;
revoke execute on function reset_pledges(int) from anon, authenticated;
revoke execute on function funding_is_open() from anon, authenticated;

-- 사진 저장소 (공개 버킷)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;
