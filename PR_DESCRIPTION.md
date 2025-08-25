# ci: add full PR workflow

## Overview
This PR adds a comprehensive GitHub Actions workflow that runs on every Pull Request to test all pipelines (ingest/enrich/scoring/build web) in dry-run mode without deployment.

## Workflow Features
- **Trigger**: Runs on every PR (excluding documentation changes for speed)
- **Concurrency**: Prevents duplicate jobs for the same PR
- **Modular Jobs**: Sequential execution with proper dependencies
- **Dry-Run Mode**: All pipelines run with `PR_CI=1` flag
- **No Deployment**: Only builds and tests, no production impact

## Jobs Included
1. **Setup & Validate Schemas** - Python setup + schema validation
2. **Lint & Typecheck** - Python (ruff/mypy) + Web (npm lint/type-check)
3. **Ingest Pipeline** - Dry-run with fixtures (`PR_CI=1`)
4. **Enrich Pipeline** - Light features mode (`PR_CI=1`)
5. **Scoring Pipeline** - PP calculation (`PR_CI=1`)
6. **Build Web** - Build + export (no deploy)

## Definition of Done Checklist

- [ ] Tutti i job definiti
- [ ] Tutti falliscono correttamente se test/validazioni falliscono
- [ ] make validate incluso
- [ ] Build web completata senza deploy

## Technical Details
- **Python**: 3.11 with pip caching
- **Node.js**: LTS with npm caching
- **Environments**: `pr-ci` for pipeline jobs
- **Dependencies**: Sequential execution (ingest → enrich → scoring → web)
- **Timeout**: Appropriate limits for each job type
- **Summary Job**: Final status report for all checks

## Branch Protection Ready
Job names are stable and can be used as required status checks for main branch protection.