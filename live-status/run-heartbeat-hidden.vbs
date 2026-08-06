' run-heartbeat-hidden.vbs
' Launches heartbeat-windows.ps1 with a fully hidden window (no flash).
' Task Scheduler should call THIS file via wscript.exe instead of calling
' powershell.exe directly.

Set objShell = CreateObject("WScript.Shell")

scriptPath = "D:\Darshan\@DAU\Web Design\Chitra Chaalak Website\live-status\heartbeat-windows.ps1"

objShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptPath & """", 0, False