Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\haizard\Desktop\house-rental"
WshShell.Run "cmd /c npm run dev > .freebuff\preview.log 2> .freebuff\preview.err.log", 0, False
Set fso = CreateObject("Scripting.FileSystemObject")
Set pidFile = fso.CreateTextFile(".freebuff\preview-pid.txt", True)
pidFile.Write WshShell.ProcessId
pidFile.Close
