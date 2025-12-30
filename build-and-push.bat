@echo off
REM Build and push Docker images (Windows batch version)
REM Usage: build-and-push.bat [registry-url] [tag]

set REGISTRY=%1
set TAG=%2

if "%REGISTRY%"=="" set REGISTRY=your-registry.com
if "%TAG%"=="" set TAG=latest

echo Building and pushing Docker images...
echo Registry: %REGISTRY%
echo Tag: %TAG%

REM Build bed-icu image
echo Building bed-icu image...
docker build -t %REGISTRY%/bed-icu:%TAG% ./bed-icu
if %errorlevel% neq 0 (
    echo Failed to build bed-icu image
    exit /b 1
)

echo Pushing bed-icu image...
docker push %REGISTRY%/bed-icu:%TAG%
if %errorlevel% neq 0 (
    echo Failed to push bed-icu image
    exit /b 1
)

REM Build nano image
echo Building nano image...
docker build -t %REGISTRY%/nano:%TAG% ./nano
if %errorlevel% neq 0 (
    echo Failed to build nano image
    exit /b 1
)

echo Pushing nano image...
docker push %REGISTRY%/nano:%TAG%
if %errorlevel% neq 0 (
    echo Failed to push nano image
    exit /b 1
)

echo All images built and pushed successfully!
echo.
echo Images:
echo   - %REGISTRY%/bed-icu:%TAG%
echo   - %REGISTRY%/nano:%TAG%