import sqlite3

conn = sqlite3.connect("backend/research_compass.db")
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cur.fetchall()
print("Tables:", tables)
for (t,) in tables:
    cur.execute(f'SELECT count(*) FROM "{t}"')
    print(f"{t}: {cur.fetchone()[0]}")
    if t == "papers":
        cur.execute("SELECT id, filename, created_at FROM papers")
        print("Papers:", cur.fetchall())
    if t == "analysis_state":
        cur.execute("SELECT key FROM analysis_state")
        print("analysis_state keys:", cur.fetchall())
conn.close()
