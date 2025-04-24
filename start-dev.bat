@echo off
echo Installing dependencies...

call npm install

cd frontend
call npm install
cd ..

cd backend
call npm install
cd ..

echo Starting development environment...
call npm run dev 