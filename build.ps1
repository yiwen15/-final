$html = Get-Content index_backup.html -Raw
$data = Get-Content data.js -Raw
$app = Get-Content app.js -Raw
$html = $html.Replace("<script src=`"data.js`"></script>", "<script>`n$data`n</script>")
$html = $html.Replace("<script src=`"app.js`"></script>", "<script>`n$app`n</script>")
Set-Content index.html $html
