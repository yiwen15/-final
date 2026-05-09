$text = Get-Content app.js -Raw
$count = @{ '{'=0; '}'=0; '('=0; ')'=0; '['=0; ']'=0 }
foreach ($c in $text.ToCharArray()) {
    $str = $c.ToString()
    if ($count.ContainsKey($str)) { $count[$str]++ }
}
Write-Output $count
