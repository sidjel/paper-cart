# Pipeline réutilisable Vidéo → Sprites origami (FFmpeg + vérification anti-doublon)
# Usage :
#   .\tools\video_to_sprites.ps1 -Video "chemin.mp4" -OutDir "public\art\heros-test" -Prefix "heros-s-walk-" -StartFrame 48 -Step 2 -Count 16
param(
  [Parameter(Mandatory=$true)][string]$Video,
  [string]$OutDir = "public\art\heros-test",
  [string]$Prefix = "heros-s-walk-",
  [int]$StartFrame = 1,
  [int]$Step = 2,
  [int]$Count = 16,
  [double]$MinDiffMad = 0.6,
  [string]$WorkDir = "_assets_stock\work_extract"
)

$ErrorActionPreference = "Stop"

function Resolve-Tool([string]$name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($candidate in @(
    "$env:USERPROFILE\.gemini\tools\ffmpeg\$name.cmd",
    "C:\Program Files\Krita (x64)\bin\$name.exe"
  )) {
    if (Test-Path $candidate) { return $candidate }
  }
  throw "$name introuvable"
}

$ffExe = Resolve-Tool "ffmpeg"
$fpExe = Resolve-Tool "ffprobe"

New-Item -ItemType Directory -Force -Path "$WorkDir\all_frames", "$WorkDir\selected", "$WorkDir\processed", $OutDir | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue "$WorkDir\all_frames\*.png", "$WorkDir\selected\*.png"

Write-Host "[1/4] Analyse de la vidéo via ffprobe..."
& $fpExe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,duration -of default=noprint_wrappers=1 $Video

Write-Host "[2/4] Extraction des images natives via FFmpeg..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()
& $ffExe -hide_banner -loglevel error -i $Video -fps_mode passthrough "$WorkDir\all_frames\f_%04d.png"
$sw.Stop()
$all = Get-ChildItem "$WorkDir\all_frames\f_*.png" | Sort-Object Name
Write-Host "  -> $($all.Count) images natives extraites en $([math]::Round($sw.Elapsed.TotalSeconds, 2))s."

Write-Host "[3/4] Sélection de $Count images (début=$StartFrame, pas=$Step)..."
$selectedFiles = @()
for ($i = 0; $i -lt $Count; $i++) {
  $idx = $StartFrame + ($i * $Step) - 1
  if ($idx -ge $all.Count) { throw "Index $idx hors limites ($($all.Count) frames)" }
  $dst = "$WorkDir\selected\raw_$($i + 1).png"
  Copy-Item $all[$idx].FullName $dst -Force
  $selectedFiles += $dst
}

Write-Host "[4/4] Vérification anti-doublon (MAD entre images consécutives et boucle)..."
Add-Type -AssemblyName System.Drawing
$cs = @"
using System;
using System.Drawing;
public static class FrameDiff {
  public static byte[] Sample(string path) {
    using (var src = new Bitmap(path))
    using (var small = new Bitmap(src, new Size(96, 160))) {
      var buf = new byte[96 * 160 * 3];
      int k = 0;
      for (int y = 0; y < 160; y++) {
        for (int x = 0; x < 96; x++) {
          var c = small.GetPixel(x, y);
          buf[k++] = c.R; buf[k++] = c.G; buf[k++] = c.B;
        }
      }
      return buf;
    }
  }
  public static double Mad(byte[] a, byte[] b) {
    long sum = 0;
    for (int i = 0; i < a.Length; i++) sum += Math.Abs(a[i] - b[i]);
    return (double)sum / a.Length;
  }
}
"@
if (-not ([System.Management.Automation.PSTypeName]'FrameDiff').Type) {
  Add-Type -TypeDefinition $cs -ReferencedAssemblies System.Drawing
}

$samples = $selectedFiles | ForEach-Object { ,([FrameDiff]::Sample($_)) }
$minSeen = 999.0
$dups = 0
for ($i = 0; $i -lt $Count; $i++) {
  $next = ($i + 1) % $Count
  $mad = [FrameDiff]::Mad($samples[$i], $samples[$next])
  if ($mad -lt $minSeen) { $minSeen = $mad }
  if ($mad -lt $MinDiffMad) {
    $dups++
    Write-Warning ("  Doublon potentiel entre frame {0} et {1} (MAD={2:F2})" -f ($i+1), ($next+1), $mad)
  }
}
Write-Host ("  -> MAD minimum entre 2 frames = {0:F2} (seuil {1:F2}) | Doublons = {2}" -f $minSeen, $MinDiffMad, $dups)
Write-Host "Prêt pour détourage + harmonisation couleur + export WebP ($Prefix 1..$Count)."
