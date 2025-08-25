.PHONY: help validate web all clean install-deps

# Default target
help:
	@echo "PP100 - Parlamento Live"
	@echo ""
	@echo "Comandi disponibili:"
	@echo "  make validate    - Valida schemi JSON"
	@echo "  make web         - Build ed export frontend"
	@echo "  make all         - Validate + web"
	@echo "  make clean       - Pulisce build artifacts"
	@echo "  make install-deps - Installa dipendenze Python"
	@echo "  make help        - Mostra questo help"
	@echo ""
	@echo "Prerequisiti:"
	@echo "  - Python 3.11"
	@echo "  - Node.js LTS"
	@echo "  - npm"

# Installa dipendenze Python
install-deps:
	@echo "🔧 Installazione dipendenze Python..."
	python -m pip install --upgrade pip
	pip install jsonschema
	@echo "✅ Dipendenze Python installate"

# Valida schemi JSON
validate: install-deps
	@echo "🔍 Validazione schemi JSON..."
	python scripts/validate_schemas.py
	@echo "✅ Validazione completata"

# Build ed export frontend
web:
	@echo "🌐 Build frontend..."
	cd web && npm ci
	cd web && npm run lint
	cd web && npm run type-check
	cd web && npm run export
	@echo "✅ Frontend buildato ed esportato in web/out/"

# Tutto: validate + web
all: validate web
	@echo "🎉 Tutto completato con successo!"

# Pulisce build artifacts
clean:
	@echo "🧹 Pulizia build artifacts..."
	rm -rf web/node_modules
	rm -rf web/.next
	rm -rf web/out
	@echo "✅ Pulizia completata"

# Setup completo per nuovo ambiente
setup: install-deps
	@echo "🚀 Setup completo..."
	cd web && npm install
	@echo "✅ Setup completato"
	@echo ""
	@echo "Prossimi passi:"
	@echo "  1. make validate    # Testa validazione schemi"
	@echo "  2. make web         # Build frontend"
	@echo "  3. cd web && npm run dev  # Sviluppo locale"

# Test rapido
test: validate
	@echo "🧪 Test rapido completato"
	@echo "Schemi validi ✓"
	@echo "Mock data validi ✓"

# Info ambiente
info:
	@echo "📋 Informazioni ambiente:"
	@echo "Python: $(shell python --version 2>/dev/null || echo 'Non installato')"
	@echo "Node: $(shell node --version 2>/dev/null || echo 'Non installato')"
	@echo "npm: $(shell npm --version 2>/dev/null || echo 'Non installato')"
	@echo "OS: $(shell uname -s) $(shell uname -r)"
