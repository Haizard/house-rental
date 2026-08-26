$logFile = "C:\Users\haizard\Desktop\house-rental\.freebuff\preview-ebf6d844-1278-45f8-8f3e-17a69605465c.log"
$errFile = "C:\Users\haizard\Desktop\house-rental\.freebuff\preview-ebf6d844-1278-45f8-8f3e-17a69605465c.log.err"
$workingDir = "C:\Users\haizard\Desktop\house-rental"

$p = Start-Process -FilePath "npx.cmd" -ArgumentList "next","dev","-p","3000" -WorkingDirectory $workingDir -RedirectStandardOutput $logFile -RedirectStandardError $errFile -WindowStyle Hidden -PassThru
Write-Output $p.Id
