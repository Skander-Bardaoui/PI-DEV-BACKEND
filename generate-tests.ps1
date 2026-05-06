# Generate basic test files for services and controllers without tests

Write-Host "Finding files without tests..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*service.ts","*controller.ts" | Where-Object { $_.Name -notlike "*.spec.ts" -and $_.Name -notlike "*.module.ts" }

$generated = 0

foreach ($file in $files) {
    $specFile = $file.FullName -replace '\.ts$', '.spec.ts'
    
    if (!(Test-Path $specFile)) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "export class (\w+)") {
            $className = $matches[1]
            
            Write-Host "Creating test for: $($file.Name)" -ForegroundColor Yellow
            
$testContent = @"
import { Test, TestingModule } from '@nestjs/testing';
import { $className } from './$($file.BaseName)';

describe('$className', () => {
  let instance: $className;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [$className],
    }).compile();

    instance = module.get<$className>($className);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
"@
            
            Set-Content -Path $specFile -Value $testContent -Encoding UTF8
            $generated++
        }
    }
}

Write-Host ""
Write-Host "Generated $generated test files!" -ForegroundColor Green
Write-Host "Run 'npm run test:cov' to see updated coverage" -ForegroundColor Cyan
