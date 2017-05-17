$IK_css = (cat "S:\Dropbox\Gauss\Learn\UFC\TCC\klog\kLog-idea\src\app\IK\ik.css" -Raw -Encoding utf8);

$classes_declaradas = [System.Collections.ArrayList]@();

#https://regex101.com/
#Pegando o arquivo, procurando pelas classes ._ik._b64._nome ou ._ik._svg._nome. Esse nome pode ser 0-9, Aa-zZ, _ e -.
#Todos esses matchs vão caminhando no pipe. O segundo grupo é sempre _b64._nome ou _svg._nome. Pego entao esses grupos e guardo, para fazer um novo loop, procurando pela utilizaçao...
$IK_css  | sls -pattern '[.]_ik[.](_b64|_svg)[.](_[\w-]*)' -AllMatches | %{ $_.Matches } | % { $classes_declaradas.Add(@($_.Groups[1].Value,$_.Groups[2].Value)) | Out-Null }

Write-Host 'Gerando HTML do ShowRoom...';

$linhasHTML = [System.Collections.ArrayList]@();

$linhasHTML.Add('
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>IK ShowRoom</title>
    <link rel="stylesheet" href="ik.css">
    <style>
        body { display: flex; flex-direction: column; font-family: tahoma; }
        th { font-family: tahoma; font-size: 12px; font-weight: normal; color: #787878 }
        th,td { text-align: center; }
        ._ik._b64 { margin: 5px; }
    </style>
</head>
<!--Use o Open in Browser do IntelliJ IDEA ou abra diretamente-->
<body>
') | Out-Null;

Write-Host 'Gerando SVGs';

$classes_declaradas | ? { $_[0] -eq '_svg' } | %{
    Write-Host ('Criando HTML de _ik '+$_[0]+' '+$_[1]);

    $linhasHTML.Add('<div>');

    $linhasHTML.Add('

        <table>
    <thead>
    <tr>
        <th>class</th><th>_f10</th><th>_f11</th><th>_f12</th><th>_f13</th><th>_f14</th><th>_f15</th><th>_f16</th><th>_f17</th><th>_f18</th><th>_f19</th><th>_f20</th><th>_f22</th><th>_f24</th><th>_f26</th><th>_f28</th><th>_f30</th><th>_f32</th><th>_f34</th><th>_f36</th><th>_f38</th><th>_f40</th>
    </tr>
    </thead>
    <tbody>
    <tr>

    ');
    $linhasHTML.Add('<td>_ik '+$_[0]+' '+$_[1]+'</td>');

    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f10" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f11" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f12" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f13" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f14" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f15" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f16" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f17" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f18" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f19" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f20" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f22" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f24" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f26" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f28" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f30" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f32" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f34" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f36" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f38" style="height: 1em; width: 1em;"></i></td>');
    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+' _f40" style="height: 1em; width: 1em;"></i></td>');

    $linhasHTML.Add('
    </tr>
    </tbody>
    </table>
    ');
    $linhasHTML.Add('</div>');
} | Out-Null;

Write-Host 'Gerando B64';

$classes_declaradas | ? { $_[0] -eq '_b64' } | %{


$linhasHTML.Add('<div>');

    $linhasHTML.Add('

        <table>
    <thead>
    <tr>
       <th>img</th> <th>class</th>
    </tr>
    </thead>
    <tbody>
    <tr>

    ');

    $linhasHTML.Add('<td><i class="_ik '+$_[0]+' '+$_[1]+'"></i></td>');

    $linhasHTML.Add('<td>_ik '+$_[0]+' '+$_[1]+'</td>');

    $linhasHTML.Add('
    </tr>
    </tbody>
    </table>
    ');
    $linhasHTML.Add('</div>');

} | Out-Null;


$linhasHTML.Add('</body></html>') | Out-Null;

#http://stackoverflow.com/questions/37767067/how-to-cat-a-utf-8-no-bom-file-properly-globally-in-powershell
$linhasHTML | Out-File "S:\Dropbox\Gauss\Learn\UFC\TCC\klog\kLog-idea\src\app\IK\IK_ShowRoom.html" -encoding utf8

Write-Host '---------------------------------------'
Write-Host 'ShowRoom gerado em ShowRoom.html!'
Write-Host '---------------------------------------'

#Abrindo
Invoke-Item "S:\Dropbox\Gauss\Learn\UFC\TCC\klog\kLog-idea\src\app\IK\IK_ShowRoom.html"
