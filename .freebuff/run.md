# Run Doc — house-rental preview

## How to reproduce artifacts
1. Copy `.env.local` from the main checkout (this thread's workspace IS the main checkout)
2. Run `npm install` if `node_modules` is missing

## How to run the server
- Port: 3000
- Command: `PORT=3000 npm run dev`
- Detach (Windows PowerShell):
  ```powershell
  powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','set PORT=3000 && npm run dev' -WorkingDirectory 'C:\Users\haizard\Desktop\house-rental' -RedirectStandardOutput 'C:\Users\haizard\Desktop\house-rental\.freebuff\preview-ebf6d844-1278-45f8-8f3e-17a69605465c.log' -RedirectStandardError 'C:\Users\haizard\Desktop\house-rental\.freebuff\preview-ebf6d844-1278-45f8-8f3e-17a69605465c.log.err' -WindowStyle Hidden -PassThru | ForEach-Object { $_.Id }"
  ```
- PID: 3344
- Status: Running, verified 200 on http://localhost:3000
