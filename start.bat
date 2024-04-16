@echo off
call venv\Scripts\activate

@REM %~1 is used instead of %1 to remove surrounding quotes from the first argument, which helps in some parsing cases.
if "%~1"=="" (
  yarn start
) else (
  @REM setlocal enabledelayedexpansion and endlocal are used to safely use and modify environment variables within the batch file. 
  @REM This is useful for handling dynamic values or values that change within a block of code.
  setlocal enabledelayedexpansion

  
  @REM "params=%*" captures all arguments as they are, preserving spaces and special characters.
  set "params=%*"
  @REM !params! is used to expand the variable at execution time, which ensures that any modifications 
  @REM (or lack thereof) to the parameters are handled correctly when passing to yarn.
  yarn !params!
  endlocal
)


