#!/bin/bash

# Script pour tester la couverture du module Sales
# Usage: ./test-sales-coverage.sh

echo "🧪 Exécution des tests du module Sales..."
echo ""

# Exécuter les tests avec couverture
npm test -- --testPathPatterns=sales --coverage --coverageReporters=text --maxWorkers=4

echo ""
echo "✅ Tests terminés!"
echo ""
echo "📊 Pour voir le rapport détaillé, ouvrez:"
echo "   coverage/lcov-report/index.html"
