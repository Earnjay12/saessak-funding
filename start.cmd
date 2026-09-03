@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  [새싹 펀딩] 서버를 시작합니다. 이 창을 닫으면 사이트도 꺼집니다.
echo.
if not exist node_modules (
  echo  처음 실행이라 패키지를 설치합니다. 잠시 기다려 주세요...
  call npm install
)
echo  사이트를 빌드합니다. 30초쯤 걸립니다...
call npm run build
echo.
echo  브라우저에서 http://localhost:3000 을 여세요.
echo  다른 기기에서는 이 PC의 IP 주소로 접속합니다: http://IP주소:3000
echo.
call npm start
pause
