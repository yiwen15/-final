$html = Get-Content index_backup.html -Encoding UTF8 -Raw
$data = Get-Content data.js -Encoding UTF8 -Raw
$app = Get-Content app.js -Encoding UTF8 -Raw
$html = $html -replace '<script src="data.js"></script>', "<script>`n$data`n</script>"
$html = $html -replace '<script src="app.js"></script>', "<script>`n$app`n</script>"
[System.IO.File]::WriteAllText("index.html", $html, [System.Text.Encoding]::UTF8)
