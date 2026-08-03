@echo off
setlocal
set "MAVEN_VERSION=3.9.9"
set "BASE_DIR=%~dp0"
set "MAVEN_HOME=%BASE_DIR%.mvn\apache-maven-%MAVEN_VERSION%"
set "ARCHIVE=%BASE_DIR%.mvn\apache-maven-%MAVEN_VERSION%-bin.zip"
set "URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo Downloading Maven %MAVEN_VERSION%...
  if not exist "%BASE_DIR%.mvn" mkdir "%BASE_DIR%.mvn"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri '%URL%' -OutFile '%ARCHIVE%'; Expand-Archive -Path '%ARCHIVE%' -DestinationPath '%BASE_DIR%.mvn' -Force; Remove-Item '%ARCHIVE%'"
  if errorlevel 1 exit /b 1
)

call "%MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
