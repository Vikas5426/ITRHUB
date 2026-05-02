import os
from fpdf import FPDF

def generate_mock_pdf():
    os.makedirs('tax_docs', exist_ok=True)
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=15)
    pdf.cell(200, 10, txt="2026 Union Budget - Income Tax Highlights", ln=1, align='C')
    
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt="The New Tax Regime for the assessment year 2026-27 has been updated with new slabs and rebate limits.")
    
    pdf.set_font("Arial", 'B', size=14)
    pdf.cell(200, 10, txt="New Tax Regime Slabs (AY 2026-27)", ln=1)
    
    pdf.set_font("Arial", size=12)
    pdf.cell(100, 10, txt="Up to Rs 3,000,000", border=1)
    pdf.cell(50, 10, txt="Nil", border=1, ln=1)
    
    pdf.cell(100, 10, txt="Rs 3,000,001 to Rs 7,000,000", border=1)
    pdf.cell(50, 10, txt="5%", border=1, ln=1)
    
    pdf.cell(100, 10, txt="Rs 7,000,001 to Rs 10,000,000", border=1)
    pdf.cell(50, 10, txt="10%", border=1, ln=1)
    
    pdf.cell(100, 10, txt="Rs 10,000,001 to Rs 12,000,000", border=1)
    pdf.cell(50, 10, txt="15%", border=1, ln=1)
    
    pdf.cell(100, 10, txt="Rs 12,000,001 to Rs 15,000,000", border=1)
    pdf.cell(50, 10, txt="20%", border=1, ln=1)
    
    pdf.cell(100, 10, txt="Above Rs 15,000,000", border=1)
    pdf.cell(50, 10, txt="30%", border=1, ln=1)
    
    pdf.set_font("Arial", 'B', size=14)
    pdf.cell(200, 10, txt="Key Changes", ln=1)
    
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt="Standard Deduction: Increased to Rs 75,000 for salaried employees under the new tax regime.")
    pdf.multi_cell(0, 10, txt="Rebate Limit: Under Section 87A, the rebate limit has been increased to Rs 12,000,000 in the new tax regime. This means no tax is payable for income up to Rs 12 lakh.")
    pdf.multi_cell(0, 10, txt="Note: If you have a home loan and live in a rented house in a different city, you can claim both HRA (Sec 10(13A)) and Home Loan Interest (Sec 24) under the OLD tax regime. The new regime does not allow most deductions including HRA.")
    
    pdf.output("tax_docs/2026_Budget_Summary.pdf")
    print("Mock PDF generated at tax_docs/2026_Budget_Summary.pdf")

if __name__ == "__main__":
    generate_mock_pdf()
