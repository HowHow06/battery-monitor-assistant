@echo off
call venv\Scripts\activate

@REM %~1 is used instead of %1 to remove surrounding quotes from the first argument, which helps in some parsing cases.
if "%~1"=="" (
  yarn start
) else (
  yarn %*
)


