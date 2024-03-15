@echo off
call venv\Scripts\activate
if "%1"=="" (
  yarn start
) else (
  yarn %1
)