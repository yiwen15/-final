$ErrorActionPreference = 'Stop'

try {
    # 讀取 JSON 並正確處理 UTF-8
    $jsonObj = Get-Content -Path "defs.json" -Encoding UTF8 -Raw | ConvertFrom-Json
    
    # 讀取 data.js
    $content = Get-Content -Path "data.js" -Encoding UTF8 -Raw

    $matchCount = 0

    $properties = $jsonObj.PSObject.Properties | Select-Object -ExpandProperty Name
    foreach ($char in $properties) {
        $new_def = $jsonObj.$char
        # regex to match `"char": { ... definition: "old_def"`
        $pattern = "(`"$char`":\s*\{[^}]*definition:\s*)`"[^`"]+`""
        
        if ($content -match $pattern) {
            $content = [regex]::Replace($content, $pattern, "`${1}`"$new_def`"")
            $matchCount++
        }
    }

    [System.IO.File]::WriteAllText("data.js", $content, [System.Text.Encoding]::UTF8)
    Write-Output "SUCCESS: Updated $matchCount definitions."
} catch {
    Write-Error "Error occurred: $_"
    exit 1
}
