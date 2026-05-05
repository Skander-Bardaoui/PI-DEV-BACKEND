#!/bin/bash

# Script pour exécuter les tests des modules Purchases et Sales
# Usage: ./run-purchases-sales-tests.sh [option]

set -e

echo "🧪 Tests Unitaires - Modules Purchases et Sales"
echo "================================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les options
show_help() {
    echo "Options disponibles:"
    echo "  all              - Exécuter tous les tests"
    echo "  purchases        - Tests du module Purchases uniquement"
    echo "  sales            - Tests du module Sales uniquement"
    echo "  invoices         - Tests des factures (achat + vente)"
    echo "  suppliers        - Tests des fournisseurs"
    echo "  clients          - Tests des clients"
    echo "  coverage         - Tests avec rapport de couverture"
    echo "  watch            - Mode watch (re-exécution automatique)"
    echo "  help             - Afficher cette aide"
    echo ""
}

# Fonction pour exécuter les tests
run_tests() {
    local pattern=$1
    local description=$2
    
    echo -e "${BLUE}▶ $description${NC}"
    echo ""
    
    if [ -z "$pattern" ]; then
        npm run test
    else
        npm run test -- "$pattern"
    fi
}

# Fonction pour exécuter les tests avec couverture
run_coverage() {
    echo -e "${BLUE}▶ Exécution des tests avec couverture${NC}"
    echo ""
    npm run test:cov -- "Purchases|sales"
    echo ""
    echo -e "${GREEN}✓ Rapport de couverture généré dans coverage/lcov-report/index.html${NC}"
}

# Fonction pour le mode watch
run_watch() {
    echo -e "${BLUE}▶ Mode watch activé${NC}"
    echo -e "${YELLOW}Les tests seront ré-exécutés automatiquement à chaque modification${NC}"
    echo ""
    npm run test:watch -- "Purchases|sales"
}

# Traitement des arguments
case "${1:-all}" in
    all)
        run_tests "Purchases|sales" "Tous les tests Purchases et Sales"
        ;;
    purchases)
        run_tests "Purchases" "Tests du module Purchases"
        ;;
    sales)
        run_tests "sales" "Tests du module Sales"
        ;;
    invoices)
        run_tests "invoices.service.spec|purchase-invoices.service.spec" "Tests des factures (achat + vente)"
        ;;
    suppliers)
        run_tests "suppliers" "Tests des fournisseurs"
        ;;
    clients)
        run_tests "clients" "Tests des clients"
        ;;
    coverage)
        run_coverage
        ;;
    watch)
        run_watch
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${YELLOW}Option non reconnue: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ Terminé${NC}"
