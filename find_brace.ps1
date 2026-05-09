$text = Get-Content app.js -Raw
$inString = $false
$inStringChar = ''
$inLineComment = $false
$inBlockComment = $false
$braceCount = 0
$lines = $text -split "`n"
$lineNumber = 1

for ($i = 0; $i -lt $text.Length; $i++) {
    $c = $text[$i]
    $nextC = if ($i + 1 -lt $text.Length) { $text[$i+1] } else { '' }
    $prevC = if ($i - 1 -ge 0) { $text[$i-1] } else { '' }

    if ($c -eq "`n") {
        $lineNumber++
        $inLineComment = $false
        continue
    }

    if ($inLineComment) { continue }
    if ($inBlockComment) {
        if ($c -eq '*' -and $nextC -eq '/') {
            $inBlockComment = $false
            $i++
        }
        continue
    }

    if ($inString) {
        if ($c -eq $inStringChar -and $prevC -ne '\') {
            $inString = $false
        }
        continue
    }

    if ($c -eq "'" -or $c -eq '"' -or $c -eq '`') {
        $inString = $true
        $inStringChar = $c
        continue
    }

    if ($c -eq '/' -and $nextC -eq '/') {
        $inLineComment = $true
        $i++
        continue
    }
    if ($c -eq '/' -and $nextC -eq '*') {
        $inBlockComment = $true
        $i++
        continue
    }

    if ($c -eq '{') { $braceCount++ }
    if ($c -eq '}') {
        $braceCount--
        if ($braceCount -lt 0) {
            Write-Output "Unbalanced } found at line $lineNumber"
            $braceCount = 0 # reset to find more
        }
    }
}

Write-Output "Final brace count: $braceCount"
