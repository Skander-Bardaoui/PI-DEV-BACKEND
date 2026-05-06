#!/bin/bash

# Script to generate basic test files for services without tests

echo "🔍 Finding services without tests..."

# Find all service files
find src -name "*.service.ts" ! -name "*.spec.ts" | while read service_file; do
    # Get the spec file name
    spec_file="${service_file%.ts}.spec.ts"
    
    # Check if spec file already exists
    if [ ! -f "$spec_file" ]; then
        # Extract service name
        service_name=$(basename "$service_file" .service.ts)
        class_name="${service_name^}Service"
        
        echo "📝 Creating test for: $service_file"
        
        # Create basic test file
        cat > "$spec_file" << EOF
import { Test, TestingModule } from '@nestjs/testing';
import { ${class_name} } from './${service_name}.service';

describe('${class_name}', () => {
  let service: ${class_name};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ${class_name},
          useValue: {
            // Mock methods here
          },
        },
      ],
    }).compile();

    service = module.get<${class_name}>(${class_name});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Add more tests for each method
});
EOF
    fi
done

echo "✅ Done! Run 'npm run test:cov' to see updated coverage"
