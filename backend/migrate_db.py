import sqlite3

def migrate():
    con = sqlite3.connect("d:/Work/ITRHUB/backend/itrhub.db")
    cur = con.cursor()
    columns_to_add = [
        ("users", "phone_number", "VARCHAR(20)"),
        ("users", "avatar_url", "VARCHAR(500)"),
        ("users", "bio", "VARCHAR(500)"),
        ("users", "occupation", "VARCHAR(100)"),
        ("users", "address_line", "VARCHAR(255)"),
        ("users", "city", "VARCHAR(100)"),
        ("users", "state", "VARCHAR(100)"),
        ("users", "pincode", "VARCHAR(10)"),
        ("users", "gender", "VARCHAR(20)"),
        ("users", "date_of_birth", "DATE"),
        ("taxpayer_profiles", "full_pan", "VARCHAR(10)"),
        ("taxpayer_profiles", "aadhaar_last_four", "VARCHAR(4)"),
    ]
    for table, col, col_type in columns_to_add:
        try:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            print(f"Added {col} to {table}")
        except Exception as e:
            print(f"{col} in {table}: {e}")
    con.commit()
    con.close()
    print("Migration finished!")

if __name__ == "__main__":
    migrate()
