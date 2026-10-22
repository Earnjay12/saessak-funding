-- 2026-10 업데이트: 심은 이유 칸 추가 + 시작 새싹 5개
-- 이미 쓰고 있는 Supabase 프로젝트에 한 번만 실행하면 됩니다. (여러 번 실행해도 안전)
-- 기존 학생 계정·상품·펀딩 기록은 그대로 남습니다.

alter table pledges add column if not exists reason text not null default '';
alter table students alter column balance set default 5;

drop function if exists make_pledge(text, uuid, int);
create or replace function make_pledge(p_student_id text, p_project_id uuid, p_amount int, p_reason text default '')
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
  insert into pledges (student_id, project_id, amount, reason)
  values (p_student_id, p_project_id, p_amount, coalesce(left(trim(p_reason), 300), ''));
  return json_build_object('ok', true, 'balance', v_balance - p_amount);
end
$$;

revoke execute on function make_pledge(text, uuid, int, text) from anon, authenticated;
