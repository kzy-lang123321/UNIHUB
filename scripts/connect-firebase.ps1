param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [Parameter(Mandatory=$true)][string]$Account
)
$ErrorActionPreference = 'Stop'
if ($ProjectId -notmatch '^[a-z][a-z0-9-]+$') { throw 'Invalid project ID' }
$access = (& gcloud auth print-access-token --account=$Account --quiet).Trim()
if ($LASTEXITCODE -ne 0 -or !$access) { throw 'Google authorization failed' }
$headers = @{ Authorization = "Bearer $access"; 'x-goog-user-project'=$ProjectId }
function Request-Json([string]$Method, [string]$Uri, $Body=$null) {
  $parameters = @{ Method=$Method; Uri=$Uri; Headers=$headers; ContentType='application/json' }
  if ($null -ne $Body) { $parameters.Body = $Body | ConvertTo-Json -Depth 30 -Compress }
  Invoke-RestMethod @parameters
}
try {
  $apps = Request-Json Get "https://firebase.googleapis.com/v1beta1/projects/$ProjectId/webApps"
  $app = $apps.apps | Where-Object { $_.displayName -eq 'UniHub' } | Select-Object -First 1
  if (!$app) { throw 'UniHub web app registration has not finished yet.' }
  $config = Request-Json Get ("https://firebase.googleapis.com/v1beta1/" + $app.name + '/config')
  $envText = @(
    "EXPO_PUBLIC_FIREBASE_API_KEY=$($config.apiKey)"
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=$($config.authDomain)"
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID=$ProjectId"
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=$($config.storageBucket)"
    "EXPO_PUBLIC_FIREBASE_APP_ID=$($config.appId)"
  ) -join "`n"
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) '.env'), $envText + "`n", [System.Text.UTF8Encoding]::new($false))
  @{ projects=@{ default=$ProjectId } } | ConvertTo-Json | Set-Content -LiteralPath '.firebaserc'
  Write-Output 'App configuration written to .env; no admin credential is embedded.'

  & npx firebase-tools deploy --project $ProjectId --only auth,firestore --non-interactive
  if ($LASTEXITCODE -ne 0) { throw 'Firebase deployment failed' }
  Write-Output "Connected project: $ProjectId. Storage billing and bucket provisioning are separate."
} finally { $access=$null; $headers=$null }
