# Portfolio Analyzer API Change Log

Date: 2026-05-13

Summary
- The `/api/portfolio/analyze` endpoint now accepts either:
  - an uploaded CSV file (multipart/form-data) as before, OR
  - a JSON POST with a `csv_text` string containing the CSV contents.

Behavioural change (strict validation)
- To compute and return a full `tax_summary`, the endpoint now requires either:
  - an explicit `income` value in the request, OR
  - a `user_id` whose financials can be resolved by the server.
- If neither `income` nor a resolvable `user_id` is provided, the endpoint returns HTTP 400.

Frontend note
- The frontend `PortfolioAnalyzer` component was updated to POST JSON `{ csv_text }` by default. File uploads still work for backwards compatibility.

Rationale
- Sending CSV as JSON simplifies integration for serverless or cross-origin clients and makes automated testing easier.
- Requiring `income` or `user_id` ensures tax calculations (which depend on total income) are explicit and prevents accidental misreporting.

Next actions
- Update frontend to optionally send `income` and `deductions` when available to receive immediate `tax_summary`.
- Add documentation to API docs and update any external clients.
- Consider an opt-in query parameter to allow non-strict behaviour (return parsed data only).

File references
- Backend handler: `backend/app/api/endpoints/portfolio.py`
- Frontend change: `Frontend/src/components/PortfolioAnalyzer.tsx`
