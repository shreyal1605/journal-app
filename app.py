from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2

app = Flask(__name__)
app.secret_key = 'pink_lily_secret_key'



# Replace your old DATABASE_URL string and get_db_connection function with this:
def get_db_connection():
    return psycopg2.connect(
        host="aws-0-ap-northeast-1.pooler.supabase.com",
        port="5432",
        database="postgres",
        user="mvbprfzxbabbbwyvgdun.postgres",
        password="shreyalbandi",
        sslmode="require"
    )

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Table for users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    ''')
    
    # 2. Entries table linked to user_id
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entries (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            water INTEGER,
            mood TEXT,
            song TEXT,
            content TEXT,
            todos TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    ''')
    conn.commit()
    cursor.close()
    conn.close()

# Run the database setup as soon as the app starts
init_db()

# --- ROUTES ---

@app.route('/')
def index():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT NOW();')
        db_version = cur.fetchone()
        cur.close()
        conn.close()
        return f"Database connected successfully! Server time: {db_version[0]}"
    except Exception as e:
        return f"Database connection failed: {str(e)}"
        
def home():
    # THE BOUNCER
    if 'user_id' not in session:
        return redirect(url_for('login_page'))

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get entries ONLY for the logged-in user
    cursor.execute('SELECT * FROM entries WHERE user_id = %s ORDER BY id DESC', (session['user_id'],))
    past_entries = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('index.html', entries=past_entries)


@app.route('/login')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('home'))
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))


@app.route('/save', methods=['POST'])
def save():
    # Block saves if not logged in
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if this user already has an entry for this exact date
    cursor.execute("SELECT id FROM entries WHERE user_id = %s AND date LIKE %s", (session['user_id'], f"{data['date']}%"))
    exists = cursor.fetchone()

    if exists:
        # Update existing entry for THIS user
        cursor.execute('''
            UPDATE entries 
            SET water=%s, mood=%s, song=%s, content=%s, todos=%s 
            WHERE id=%s AND user_id=%s
        ''', (data['water'], data['mood'], data['song'], data['content'], data['todos'], exists[0], session['user_id']))
    else:
        # Insert brand new entry tied to the logged-in user's ID
        cursor.execute('''
            INSERT INTO entries (user_id, date, water, mood, song, content, todos)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (session['user_id'], data['date'], data['water'], data['mood'], data['song'], data['content'], data['todos']))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "success"})


@app.route('/get_entry/<date>')
def get_entry(date):
    # Block fetching if not logged in
    if 'user_id' not in session:
        return jsonify({"found": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Find entry matching BOTH the date and the specific logged-in user
    cursor.execute("SELECT * FROM entries WHERE user_id = %s AND date LIKE %s ORDER BY id DESC LIMIT 1", (session['user_id'], f"{date}%"))
    entry = cursor.fetchone()
    cursor.close()
    conn.close()

    if entry:
        # Note: In PostgreSQL fetchall/fetchone, column positions match table creation structure
        # id=0, user_id=1, date=2, water=3, mood=4, song=5, content=6, todos=7
        return jsonify({
            "found": True,
            "water": entry[3],
            "mood": entry[4],
            "song": entry[5],
            "content": entry[6],
            "todos": entry[7]
        })
    else:
        return jsonify({"found": False})


@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    action = data.get('action')

    conn = get_db_connection()
    cursor = conn.cursor()

    if action == 'signup':
        hashed_password = generate_password_hash(password)
        try:
            cursor.execute(
                'INSERT INTO users (username, password) VALUES (%s, %s)', 
                (username, hashed_password)
            )
            conn.commit()
            return jsonify({"success": True, "message": "Account created! You can now log in."})
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return jsonify({"success": False, "message": "That username is already taken."})
        finally:
            cursor.close()
            conn.close()

    elif action == 'login':
        cursor.execute('SELECT id, username, password FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]   
            session['username'] = user[1]  
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Wrong username or password."})


if __name__ == "__main__":
    init_db()
    app.run()
else:
    # This ensures your Supabase tables are ready when Render starts the app
    init_db()