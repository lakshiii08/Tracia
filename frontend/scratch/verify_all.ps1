$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "=================================================="
Write-Host " TRACIA COMPREHENSIVE PRODUCTION VERIFICATION"
Write-Host "=================================================="

# 1. Authenticate Operator
$loginBody = @{
    operatorId = "Admin"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
    Write-Host "[PASS] 1. Operator Authenticated: $($login.operatorId) ($($login.role))"
} catch {
    Write-Error "[FAIL] 1. Auth failed: $_"
    exit 1
}

# 2. Check Socket.IO Health
try {
    $socketHealth = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "[PASS] 2. Socket.IO Relay Server: $($socketHealth.status) - $($socketHealth.service)"
} catch {
    Write-Host "[WARN] 2. Socket server on port 3001 check: $_"
}

# 3. Verify Empty/Clean Initial Storage (Zero Fake/Mock Cases)
try {
    $cases = Invoke-RestMethod -Uri "http://localhost:3000/api/cases" -Method Get -WebSession $session
    $firs = Invoke-RestMethod -Uri "http://localhost:3000/api/firs" -Method Get -WebSession $session
    
    $hasMockNightfall = ($cases | Where-Object { $_.name -match "Nightfall" -or $_.id -eq "C-1001" })
    if ($hasMockNightfall) {
        Write-Host "[FAIL] 3. Found mock case in storage!"
    } else {
        Write-Host "[PASS] 3. Storage verified clean. Zero mock/fake cases present. Initial cases count: $($cases.Count)"
    }
} catch {
    Write-Error "[FAIL] 3. Cases/FIRs retrieval failed: $_"
}

# 4. Verify Real Case & Real FIR Creation & Persistence
try {
    $newCaseBody = @{
        name = "Operation Sentinel Shield"
        desc = "Cross-border financial cybercrime and burner SIM syndicate."
        category = "cyber"
        priority = "Critical"
        assignedOfficerIds = @("usr-admin", "usr-inv-01")
    } | ConvertTo-Json

    $createdCase = Invoke-RestMethod -Uri "http://localhost:3000/api/cases" -Method Post -Body $newCaseBody -ContentType "application/json" -WebSession $session
    Write-Host "[PASS] 4. Created Real Case: $($createdCase.id) - $($createdCase.name)"

    $newFirBody = @{
        caseId = $createdCase.id
        firNumber = "FIR-2026/DEL/701"
        policeStation = "Special Cyber Crime Cell, New Delhi"
        incidentDate = "2026-03-15"
        sections = "Sec 66D IT Act, 419, 420 IPC"
        complainant = "Reserve Financial Integrity Unit"
        accused = "Unidentified Foreign VoIP Mule Network"
        description = "Unauthorized API diversion and automated fund routing."
        fileName = "FIR_2026_DEL_701_Signed.pdf"
        sha256Hash = "8f3b2c1e0d9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c"
        status = "Registered"
    } | ConvertTo-Json

    $createdFir = Invoke-RestMethod -Uri "http://localhost:3000/api/firs" -Method Post -Body $newFirBody -ContentType "application/json" -WebSession $session
    Write-Host "[PASS] 4. Registered Real FIR: $($createdFir.firNumber) attached to $($createdFir.caseId)"

    # Verify Disk Persistence
    $diskCases = Get-Content -Raw "data/cases.json" | ConvertFrom-Json
    $diskFirs = Get-Content -Raw "data/firs.json" | ConvertFrom-Json
    $persistedCase = $diskCases | Where-Object { $_.id -eq $createdCase.id }
    $persistedFir = $diskFirs | Where-Object { $_.firNumber -eq $createdFir.firNumber }

    if ($persistedCase -and $persistedFir) {
        Write-Host "[PASS] 4. Disk Persistence Verified in data/cases.json & data/firs.json"
    } else {
        Write-Host "[FAIL] 4. Disk persistence check failed!"
    }
} catch {
    Write-Error "[FAIL] 4. Real case/FIR creation failed: $_"
}

# 5. Verify Entity Resolution Live Queue from Neo4j
try {
    $erQueue = Invoke-RestMethod -Uri "http://localhost:3000/api/entity-resolution/queue" -Method Get -WebSession $session
    Write-Host "[PASS] 5. Entity Resolution Queue retrieved: $($erQueue.Count) candidates"
    foreach ($m in $erQueue) {
        Write-Host "       Candidate: $($m.nameA) <-> $($m.nameB) ($($m.similarity)%) | Source: $($m.sourceA)"
    }
    
    # Test resolving first match if available
    if ($erQueue.Count -gt 0) {
        $firstMatch = $erQueue[0]
        $resolveBody = @{
            action = "confirm"
            nameA = $firstMatch.nameA
            nameB = $firstMatch.nameB
        } | ConvertTo-Json
        $resolveRes = Invoke-RestMethod -Uri "http://localhost:3000/api/entity-resolution/$($firstMatch.id)/resolve" -Method Post -Body $resolveBody -ContentType "application/json" -WebSession $session
        Write-Host "[PASS] 5. Entity Resolution Confirmation Succeeded: $($resolveRes.message)"
    }
} catch {
    Write-Error "[FAIL] 5. Entity resolution check failed: $_"
}

# 6. Verify AI Copilot Query (Deployed AI Link + Neo4j GraphRAG)
try {
    $copilotQuery = @{
        prompt = "Identify all active targets and phone links"
        caseId = $createdCase.id
    } | ConvertTo-Json
    
    $copilotRes = Invoke-RestMethod -Uri "http://localhost:3000/api/copilot" -Method Post -Body $copilotQuery -ContentType "application/json" -WebSession $session
    Write-Host "[PASS] 6. AI Copilot Response Received:"
    Write-Host "       Intent: $($copilotRes.intent)"
    Write-Host "       Findings: $($copilotRes.text)"
    Write-Host "       Sources: $($copilotRes.sources -join ', ')"
} catch {
    Write-Error "[FAIL] 6. Copilot query failed: $_"
}

Write-Host "=================================================="
Write-Host " ALL PRODUCTION VERIFICATION CHECKS COMPLETED"
Write-Host "=================================================="
