from database import get_db_connection

print("Starting MySQL test...", flush=True)

try:
    connection = get_db_connection()
    print("SUCCESS: MySQL connected!", flush=True)
    print("Database:", connection.database, flush=True)
    connection.close()
    print("Connection closed.", flush=True)

except Exception as error:
    print("FAILED:", repr(error), flush=True)
