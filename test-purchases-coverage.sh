#!/bin/bash

# Script pour tester la couverture du module Purchases
# Usage: ./test-purchases-coverage.sh

echo "🧪 Exécution des tests du module Purchases..."
echo ""

# Exécuter les tests avec couverture
npm test -- --testPathPatterns=Purchases --coverage --coverageReporters=text --maxWorkers=4

echo ""
echo "✅ Tests terminés!"
echo ""
echo "📊 Pour voir le rapport détaillé, ouvrez:"
echo "   coverage/lcov-report/index.html"
