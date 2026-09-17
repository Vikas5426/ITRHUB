from app.services.portfolio_service import parse_and_calc


def test_parse_and_calc_classifies_equity_ltcg_and_applies_exemption():
	csv_content = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Alpha Ltd,Listed Equity,2022-01-01,2023-02-01,100,150,10
Beta Ltd,Listed Equity,2022-01-01,2023-02-01,200,260,10
"""

	results = parse_and_calc(csv_content)

	assert len(results) == 2
	first, second = results

	assert first["cat"] == "LTCG"
	assert second["cat"] == "LTCG"
	assert first["gain"] == 500.0
	assert second["gain"] == 600.0
	assert first["tax"] == 0
	assert second["tax"] == 0


def test_parse_and_calc_handles_non_equity_short_term_gain():
	csv_content = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Debt Fund,Debt Mutual Fund,2024-01-01,2024-02-01,100,120,10
"""

	results = parse_and_calc(csv_content)

	assert len(results) == 1
	trade = results[0]
	assert trade["cat"] == "Slab"
	assert trade["gain"] == 200.0
	assert trade["tax"] > 0
