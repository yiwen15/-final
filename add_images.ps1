# add_images.ps1
# Scans images/ folder and updates data.js image fields
# Run: powershell -ExecutionPolicy Bypass -File add_images.ps1

$dataFile = "data.js"
$imgFolder = "images"
$extensions = @("png","jpg","jpeg","gif","webp","svg")

if (-not (Test-Path $imgFolder)) {
    New-Item -ItemType Directory -Path $imgFolder | Out-Null
    Write-Host "[INFO] Created images/ folder. Add images named after characters (e.g. good.png -> not applicable, use Chinese: hao.png is wrong, use the actual character as filename)." -ForegroundColor Yellow
    exit
}

$content = Get-Content $dataFile -Encoding UTF8 -Raw
$updated = 0
$skipped = 0

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path $imgFolder -Filter "*.$ext" -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $char = $file.BaseName
        $imgPath = "images/" + $file.Name

        # Check if char exists in data.js (look for "CHAR": { pattern)
        if ($content.Contains("`"$char`": {")) {
            # Replace empty image: '' or image: ""
            if ($content.Contains("image: ''")) {
                # Find the entry for this char and replace its image field
                $searchBlock = "`"$char`": {"
                $idx = $content.IndexOf($searchBlock)
                if ($idx -ge 0) {
                    # Find closing brace for this entry
                    $endIdx = $content.IndexOf("}", $idx)
                    $block = $content.Substring($idx, $endIdx - $idx)
                    if ($block.Contains("image: ''")) {
                        $newBlock = $block.Replace("image: ''", "image: '$imgPath'")
                        $content = $content.Substring(0, $idx) + $newBlock + $content.Substring($endIdx)
                        Write-Host "[OK] Updated: $char => $imgPath" -ForegroundColor Green
                        $updated++
                    } else {
                        Write-Host "[SKIP] $char already has an image or uses different format" -ForegroundColor Gray
                        $skipped++
                    }
                }
            } else {
                Write-Host "[SKIP] $char - image field format not matched" -ForegroundColor Gray
                $skipped++
            }
        } else {
            Write-Host "[WARN] Character not found in data.js: $char" -ForegroundColor Yellow
            $skipped++
        }
    }
}

if ($updated -gt 0) {
    [System.IO.File]::WriteAllText($dataFile, $content, [System.Text.Encoding]::UTF8)
    Write-Host ""
    Write-Host "[DONE] Updated $updated character(s). Run build2.ps1 to rebuild." -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "[INFO] No updates made. images/ folder may be empty, or filenames don't match characters in data.js" -ForegroundColor Cyan
    Write-Host "[INFO] Skipped: $skipped" -ForegroundColor Gray
}
