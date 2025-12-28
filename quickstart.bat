@echo off
REM Quick Start Script for AI Workflow Automation Platform (Windows)

echo ========================================================
echo AI Workflow Automation Platform - Quick Start
echo ========================================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is required but not installed. Please install Node.js 20+
    exit /b 1
)

REM Check for Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker is required but not installed. Please install Docker
    exit /b 1
)

echo All prerequisites found
echo.

REM Setup environment file
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo WARNING: Please edit .env and add your ANTHROPIC_API_KEY and other credentials
    echo.
    pause
)

REM Install dependencies
echo Installing dependencies...
call npm install
echo.

REM Start services with Docker
echo Starting services with Docker Compose...
docker-compose up -d

echo.
echo All services started successfully!
echo.
echo Access the application:
echo    Frontend: http://localhost
echo    Backend API: http://localhost:3001
echo    API Health: http://localhost:3001/health
echo.
echo Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo.
echo Ready to build workflows!
pause
