import sqlite3
import psycopg2

# 1. Your Supabase Connection String
DATABASE_URL = "postgresql://postgres.mvbprfzxbabbbwyvgdun:shreyalbandi@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"

# CHANGE THIS to the exact username you just created in Step 1
YOUR_USERNAME = "shreyal"

def migrate():
    try:
        # Connect to cloud Supabase
        pg_conn = psycopg2.connect(DATABASE_URL)
        pg_cursor = pg_conn.cursor()
        
        # Connect to local SQLite file
        sqlite_conn = sqlite3.connect('journal.db')
        sqlite_cursor = sqlite_conn.cursor()
        
        # Find your new user's ID from Supabase
        pg_cursor.execute("SELECT id FROM users WHERE username = %s", (YOUR_USERNAME,))
        user_row = pg_cursor.fetchone()
        
        if not user_row:
            print(f"❌ Error: Could not find the username '{YOUR_USERNAME}' in Supabase. Please sign up on the website first!")
            return
            
        user_id = user_row[0]
        print(f"Found user ID {user_id} for {YOUR_USERNAME}. Fetching old entries...")

        # Get all entries from your local SQLite database
        sqlite_cursor.execute("SELECT date, water, mood, song, content, todos FROM entries")
        old_entries = sqlite_cursor.fetchall()
        
        if not old_entries:
            print("No old entries found in your local journal.db file.")
            return

        print(f"Moving {len(old_entries)} entries to Supabase...")

        # Push them into Supabase, matching them to your new user ID
        for entry in old_entries:
            pg_cursor.execute('''
                INSERT INTO entries (user_id, date, water, mood, song, content, todos)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (user_id, entry[0], entry[1], entry[2], entry[3], entry[4], entry[5]))
        
        pg_conn.commit()
        
        print("🎉 Success! All old entries have been safely copied to the cloud.")
        
        # Close everything down
        sqlite_conn.close()
        pg_cursor.close()
        pg_conn.close()

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")

if __name__ == '__main__':
    migrate()