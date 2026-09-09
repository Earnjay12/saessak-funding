# 🌱 대구군위초등학교 새싹 펀딩

학생들이 가상 화폐 **새싹**으로 크라우드펀딩을 체험하는 사이트입니다. 데이터 수업에서 학생들이 만든 상품(사진과 설명)을 쇼핑몰처럼 올리고, 다른 학생들이 새싹을 심어 순위를 매깁니다.

- 선생님(관리자)이 사진 여러 장, 홍보 문구, 상품명, 제작자, 상품 정보를 넣어 상품을 올립니다.
- 학년·반·인원만 입력하면 학생 계정이 한꺼번에 만들어지고, 인쇄용 로그인 카드가 나옵니다.
- 학생은 카드의 학년·반·번호와 비밀번호로 들어와 새싹 100개를 받고, 원하는 상품에 나눠 심습니다.
- 현황판에서 상품 순위와 반별 참여율을 보고, **펀딩 마감하기** 버튼으로 결과를 확정합니다.

## 로고 파일 넣기

`public` 폴더에 아래 이름으로 학교 로고 파일을 넣으면 사이트가 자동으로 그 파일을 씁니다. 없으면 SVG로 그린 비슷한 모양이 대신 보입니다.

| 파일 이름 | 쓰이는 곳 |
| --- | --- |
| `public/logo-mark.png` | 상단 바의 동그란 G 마크 |
| `public/logo-full.png` | 첫 화면(로그인)의 가로형 "GrowUp 군위초" 로고 |

## 실행 방법 두 가지

| 방식 | 언제 | 준비물 |
| --- | --- | --- |
| **A. 인터넷 배포** | 다른 학년 학생도 집에서 참여할 때 | Supabase 계정, Vercel 계정 |
| **B. 선생님 PC에서 실행** | 수업 시간에 같은 와이파이로만 접속할 때 | Node.js 20 이상 |

두 방식 모두 코드는 같고, 환경 변수만 다릅니다.

---

## A. 인터넷 배포 (Supabase + Vercel)

### 1. Supabase 준비 (데이터베이스와 사진 저장소)

1. <https://supabase.com> 에서 가입하고 **New project** 를 만듭니다. (Region 은 Northeast Asia (Seoul) 추천)
2. 왼쪽 메뉴 **SQL Editor** → **New query** 를 열고, 이 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 전부 붙여 넣은 뒤 **Run** 을 누릅니다.
   테이블, 함수, 사진 버킷이 한 번에 만들어집니다.
3. **Project Settings → API** 에서 두 값을 복사해 둡니다.
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 키 (secret) → `SUPABASE_SERVICE_ROLE_KEY`

> `service_role` 키는 서버에서만 쓰이며 브라우저로 나가지 않습니다. 절대 다른 곳에 올리지 마세요.

### 2. Vercel 에 올리기

이 폴더에서 터미널을 열고:

```bash
npm install
npx vercel login
npx vercel
```

질문에는 모두 기본값(Enter)으로 답하면 됩니다. 그 다음 환경 변수를 넣습니다. (Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables** 에서 넣어도 됩니다.)

```bash
npx vercel env add ADMIN_PASSWORD
npx vercel env add SESSION_SECRET
npx vercel env add SUPABASE_URL
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

- `ADMIN_PASSWORD`: 선생님 로그인 비밀번호 (아이디는 `admin`)
- `SESSION_SECRET`: 아무 긴 문자열. 아래 명령으로 만들 수 있습니다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

환경 변수를 넣은 뒤 실제 배포:

```bash
npx vercel --prod
```

끝나면 `https://……vercel.app` 주소가 나옵니다. 이 주소가 학생들이 접속할 주소입니다.
로그인 카드에 이 주소가 인쇄되도록 `NEXT_PUBLIC_SITE_URL` 환경 변수에도 넣어 두면 좋습니다.

---

## B. 선생님 PC에서 실행

1. Node.js 20 이상을 설치합니다. <https://nodejs.org>
2. `.env.example` 을 복사해 `.env.local` 을 만들고 `ADMIN_PASSWORD` 만 정합니다. (Supabase 값은 비워 둡니다.)
3. 이 폴더의 **`start.cmd`** 를 더블클릭합니다. 처음에는 설치와 빌드 때문에 몇 분 걸리고, 그 뒤로는 바로 켜집니다.
   검은 창이 열려 있는 동안 사이트가 켜져 있고, 창을 닫으면 꺼집니다.
4. 브라우저에서 `http://localhost:3000` 을 엽니다.
5. 선생님 PC 의 IP 주소(예: `192.168.0.12`)를 확인해 학생들에게 `http://192.168.0.12:3000` 으로 접속하게 합니다.
   데이터는 `data/db.json`, 사진은 `public/uploads/` 에 저장됩니다.

터미널로 직접 실행하려면 이 폴더로 이동한 뒤 한 줄씩 입력합니다. (Windows PowerShell 에서는 `&&` 로 두 명령을 잇는 문법이 안 됩니다.)

```bash
cd "C:\Users\jaeen\Documents\Claude Code\saessak-funding"
```

```bash
npm run build
```

```bash
npm start
```

> 학교 네트워크가 기기 간 접속을 막아 두었다면 이 방식은 동작하지 않습니다. 그럴 때는 A 방식을 쓰세요.

---

## 관리자 사용 순서

1. 첫 화면 → **선생님이신가요?** → 아이디 `admin`, 정해 둔 비밀번호로 로그인
2. **상품** → **새 상품**: 사진(여러 장, 첫 장이 대표), 홍보 문구, 상품명, 제작자, 상품 정보(품종·무게 같은 항목) 입력. 상세 화면에서는 사진을 옆으로 넘겨 볼 수 있습니다.
   - 상품 목록은 쇼핑몰처럼 사진 왼쪽·설명 오른쪽으로 보이고, 크롬북 가로 화면에서는 한 줄에 2개씩 나옵니다.
3. **학생 계정** → 학년·반·인원 입력 → **계정 만들기**
4. 반 목록에서 **카드 인쇄** → 인쇄해서 잘라 나눠 줍니다. (**CSV 내려받기**로 엑셀 명단도 가능)
5. **현황** 에서 프로젝트 순위와 반별 참여율 확인
6. 결과를 발표할 때 **현황** 맨 위 **펀딩 마감하기** → 학생 화면은 최종 순위만 보이고 심기·취소가 막힙니다. (**펀딩 다시 열기**로 되돌릴 수 있음)
7. 다른 반에서 다시 쓰려면 **현황** 맨 아래 **펀딩 기록 초기화**

## 규칙 (기본값)

- 학생 1인당 새싹 **100개**
- 한 상품에 여러 번, 여러 상품에 나눠 심기 가능
- 펀딩이 열려 있는 동안에는 자기가 심은 새싹을 취소하고 다른 곳에 심을 수 있음
- 목표 금액은 없고, 새싹을 가장 많이 받은 상품이 1위 (총 펀딩 새싹과 순위 표시)
- 관리자가 **펀딩 마감하기**를 누르면 결과(최종 순위)만 보임

바꾸고 싶으면 `.env` 에 다음을 넣습니다.

```
NEXT_PUBLIC_SCHOOL_NAME=대구군위초등학교
NEXT_PUBLIC_SITE_NAME=새싹 펀딩
NEXT_PUBLIC_UNIT=씨앗
NEXT_PUBLIC_UNIT_EMOJI=🌰
STARTING_BALANCE=200
```

## 코드 구조

```
app/
  page.tsx                  로그인 (학생 / 선생님)
  (student)/projects        프로젝트 목록·상세 (펀딩)
  (student)/me              내 새싹 기록
  admin/                    현황(펀딩 마감 스위치) · 상품 관리 · 학생 계정 · 카드 인쇄 · CSV
  actions/                  서버 액션 (로그인, 펀딩, 관리자 기능)
lib/
  db/                       저장소: Supabase (배포) 또는 로컬 JSON 파일 (PC 실행)
  session.ts                로그인 쿠키
  config.ts                 단위 이름·시작 새싹 수
supabase/schema.sql         Supabase 초기 설정 SQL
```

## 알아 둘 점

- 학생 비밀번호는 무작위 6자리이고, 관리자가 다시 인쇄할 수 있도록 그대로 저장됩니다. 이 사이트 전용 비밀번호이므로 다른 곳에서 쓰는 비밀번호를 넣게 하지 마세요.
- Supabase 무료 프로젝트는 일주일 동안 아무 접속이 없으면 일시 정지됩니다. 대시보드에서 **Restore** 를 누르면 다시 켜집니다.
