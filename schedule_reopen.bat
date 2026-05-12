@echo off
REM Batch script to schedule reopening the portal
REM This script schedules a task to execute the SQL query to disable maintenance mode

REM Define variables
set SUPABASE_URL=https://xkcfpfbjezpwgdcestbi.supabase.co
set DATABASE_NAME=JbaysData_server
set SQL_FILE_PATH=d:\iec-election-portal\reopen_portal.sql

REM Check if sqlcmd is installed
where sqlcmd >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: sqlcmd is not installed. Please install it and try again.
    exit /b 1
)

REM Schedule the task to run at 8:30 AM
schtasks /create /tn "ReopenPortal" ^
    /tr "sqlcmd -S %SUPABASE_URL% -d %DATABASE_NAME% -i %SQL_FILE_PATH%" ^
    /sc once /st 08:30 /f

if %errorlevel% equ 0 (
    echo Task successfully scheduled to reopen the portal at 8:30 AM.
) else (
    echo ERROR: Failed to schedule the task. Please check your inputs.
    exit /b 1
)