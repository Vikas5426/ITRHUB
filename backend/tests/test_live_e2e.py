import httpx
import pytest

BASE_BACKEND = "http://127.0.0.1:8000"
BASE_FRONTEND = "http://127.0.0.1:3000"


def test_live_full_flow():
    client = httpx.Client(base_url=BASE_BACKEND, timeout=10.0)

    # 1. Register new user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Vikas Sharma",
            "email": "e2e_vikas@example.com",
            "password": "StrongPass123",
        },
    )
    if reg_res.status_code == 409:
        # Already registered, log in
        login_res = client.post(
            "/api/auth/login",
            json={
                "email": "e2e_vikas@example.com",
                "password": "StrongPass123",
            },
        )
        assert login_res.status_code == 200
    else:
        assert reg_res.status_code == 201

    # 2. Verify /api/auth/me session
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    user_data = me.json()
    assert user_data["email"] == "e2e_vikas@example.com"
    assert user_data["full_name"] == "Vikas Sharma"

    # 3. Test Profile Update (Personal & Tax Information)
    profile_update = client.put(
        "/api/auth/profile",
        json={
            "full_name": "Vikas Sharma",
            "phone_number": "+919876543210",
            "occupation": "Principal Tax Architect",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "pan": "ABCDE1234F",
            "aadhaar_last_four": "7890",
            "residency_status": "resident",
            "bio": "Lead tax professional preparing AY 2026-27 return on ITRHUB.",
        },
    )
    assert profile_update.status_code == 200
    updated = profile_update.json()
    assert updated["occupation"] == "Principal Tax Architect"
    assert updated["pan_masked"] == "ABXXXXX34F"
    assert updated["aadhaar_masked"] == "XXXX-XXXX-7890"

    # 4. Get active profile and filing workspace
    profiles = client.get("/api/workspace/profiles").json()
    assert len(profiles) > 0
    profile_id = profiles[0]["id"]

    filings = client.get("/api/workspace/filings").json()
    if not filings:
        ws_res = client.post(
            "/api/workspace/filings",
            json={"profile_id": profile_id, "assessment_year_start": 2026},
        )
        workspace = ws_res.json()
    else:
        workspace = filings[0]

    ws_id = workspace["id"]

    # 5. Save Income Sources (Salary ₹12,00,000, TDS ₹85,000, Capital gains ₹1,50,000 STCG)
    income_res = client.put(
        f"/api/workspace/filings/{ws_id}/income-sources",
        json={
            "salary": {
                "enabled": True,
                "employer_count": 1,
                "gross_salary": 1200000,
                "standard_deduction": 75000,
                "professional_tax": 2400,
                "tds": 85000,
            },
            "house_property": {
                "enabled": False,
                "property_count": 1,
                "rental_income": 0,
                "home_loan_interest": 0,
                "municipal_taxes": 0,
            },
            "business": {
                "enabled": False,
                "business_type": "none",
                "presumptive_scheme": "none",
                "gross_receipts": 0,
                "expenses": 0,
                "net_profit": 0,
                "requires_audit": False,
            },
            "capital_gains": {
                "enabled": True,
                "listed_equity_stcg": 150000,
                "listed_equity_ltcg": 100000,
                "property_gains": 0,
                "crypto_vda_gains": 0,
                "has_loss_carry_forward": False,
            },
            "foreign": {
                "enabled": False,
                "foreign_income": 0,
                "foreign_assets": False,
                "foreign_tax_credit": 0,
            },
            "other": {
                "interest_income": 25000,
                "dividend_income": 10000,
                "agricultural_income": 0,
                "other_income": 0,
                "exempt_income": 0,
            },
        },
    )
    if income_res.status_code != 200:
        print("Income update error:", income_res.status_code, income_res.text)
    assert income_res.status_code == 200
    assert income_res.json()["income_sources"]["salary"]["gross_salary"] == 1200000

    # 6. Save Deductions (80C ₹1,50,000, 80D ₹25,000)
    ded_res = client.put(
        f"/api/workspace/filings/{ws_id}/deductions",
        json={
            "sec_80c": 150000,
            "sec_80d_self": 25000,
            "sec_80d_parents": 0,
            "sec_80ccd_1b": 50000,
            "sec_80e": 0,
            "sec_80g": 0,
            "sec_80tta_ttb": 10000,
            "hra_exemption": 0,
            "sec_24b_home_loan": 0,
            "other_deductions": 0,
        },
    )
    assert ded_res.status_code == 200
    assert ded_res.json()["deductions"]["sec_80c"] == 150000

    # 7. Query live Tax Analysis
    tax_analysis = client.get(f"/api/workspace/filings/{ws_id}/tax-analysis").json()
    assert "new_regime" in tax_analysis
    assert "old_regime" in tax_analysis
    assert tax_analysis["optimal_regime"] in ("old", "new")
    assert tax_analysis["readiness_score"] >= 70

    # 8. Query live Tax Analysis
    tax_analysis = client.get(f"/api/workspace/filings/{ws_id}/tax-analysis").json()
    assert "new_regime" in tax_analysis
    assert "old_regime" in tax_analysis
    assert tax_analysis["optimal_regime"] in ("old", "new")
    assert tax_analysis["readiness_score"] >= 70
    print(f"Tax Analysis computed: Optimal={tax_analysis['optimal_regime']}, Readiness={tax_analysis['readiness_score']}%")

    print("All live end-to-end operations passed successfully!")


if __name__ == "__main__":
    test_live_full_flow()
