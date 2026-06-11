# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Dedicated `/documents` page for document import, filing guidance, and
  reconciliation.
- Document reconciliation endpoint for encrypted workspace files, with
  JSON/CSV extraction and best-effort PDF support.
- Reconciled income, deduction, TDS, and capital-gains totals with findings and
  action items saved to the filing workspace.
- HTTP-only session authentication and owner-authorized workspace APIs.
- Family and HUF taxpayer profiles with a primary self profile.
- Assessment-year filing workspaces with revision-safe autosave.
- Encrypted document upload, download, listing, and deletion.
- `/auth` and `/workspace` frontend flows.
- Initial Alembic migration and end-to-end workspace API tests.

### Fixed
- Home/workspace duplication reduced by moving filing document guidance and
  upload/reconciliation flows into the dedicated document workbench.
- Existing frontend lint and Framer Motion type errors so production builds pass.

## [0.1.0] - 2026-05-13

### Added
- `backend/app/services/tax_engine.py` enhancements:
  - Surcharge bands and health & education cess applied correctly.
  - Optional `special_tax_components` support to include precomputed STCG/LTCG/VDA/crypto taxes.
  - 87A rebate handling applied to slab-tax portion.
- `backend/app/api/endpoints/portfolio.py`:
  - Endpoint `/api/portfolio/analyze` now accepts either multipart file upload **or** JSON body with `csv_text`.
  - Endpoint requires `income` (or a resolvable `user_id`) to return `tax_summary` (HTTP 400 otherwise).
- `Frontend/src/components/PortfolioAnalyzer.tsx` now posts CSV as JSON `{ csv_text }` by default for easier integration.
- `backend/app/services/portfolio_service.py` now exposes `tax_pre_cess` per trade and computes aggregated special-tax components.
- `backend/app/services/user_service.py` demo helper with `get_user_financials(user_id)` for integration tests.
- Tests:
  - Parameterized suite (~200 cases): `backend/tests/test_tax_engine_param.py`.
  - Hypothesis fuzzing harness: `backend/tests/test_tax_engine_fuzz.py`.
  - Combined scenario and integration tests including `backend/tests/test_portfolio_user_flow.py`, `backend/tests/test_tax_engine_combined.py`.
- Added `backend/tests/vectors/official_examples.json` with example vectors.
- Added `backend/PORTFOLIO_API_CHANGE.md` with API details.

### Changed
- `README.md` updated to mention the portfolio API change and link to the changelog entry.
- `backend/requirements.txt` updated to include `hypothesis` for fuzz testing.

### Fixed
- Test suite updated and verified: backend tests passing locally (213+ tests, 1 skipped as noted).

### Notes
- The `special_tax_components` parameter expects a mapping of precomputed tax amounts, e.g. `{ "stcg_tax": 1234.5, "ltcg_tax": 6789.0 }`.
- Consider updating external clients to POST JSON `csv_text` and include `income`/`deductions` to receive immediate `tax_summary` from the `/api/portfolio/analyze` endpoint.

---

For release notes, move the `Unreleased` section under a released version header.
