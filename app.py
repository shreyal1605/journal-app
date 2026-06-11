from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
app.secret_key = 'pink_lily_secret_key' # Change this to any random string

# --- DATABASE SETUP ---
from werkzeug.security import generate_password_hash, check_password_hash

def init_db():
    conn = sqlite3.connect('journal.db')
    cursor = conn.cursor()
    
    # 1. NEW: Table for your friends (Users)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # 2. UPDATED: Entries table now has 'user_id'
    # This 'user_id' connects the entry to a specific person in the users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            water INTEGER,
            mood TEXT,
            song TEXT,
            content TEXT,
            todos TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

# Run the database setup as soon as the app starts
init_db()

# --- ROUTES (The Brain's Logic) ---
@app.route('/')
def home():
    # --- THIS IS THE BOUNCER (Add these 2 lines) ---
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    # -----------------------------------------------

    # 1. Connect to the database
    conn = sqlite3.connect('journal.db')
    cursor = conn.cursor()
    
    # 2. Get entries ONLY for the logged-in user
    # We add "WHERE user_id = ?" so you don't see your friends' journals
    cursor.execute('SELECT * FROM entries WHERE user_id = ? ORDER BY id DESC', (session['user_id'],))
    past_entries = cursor.fetchall()
    
    conn.close()
    
    # 3. Send those entries to your HTML page
    return render_template('index.html', entries=past_entries)

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/save', methods=['POST'])
def save():
    data = request.json
    conn = sqlite3.connect('journal.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM entries WHERE date LIKE ?", (f"{data['date']}%",))
    exists = cursor.fetchone()

    if exists:
        cursor.execute('''
            UPDATE entries 
            SET water=?, mood=?, song=?, content=?, todos=? 
            WHERE id=?
        ''', (data['water'], data['mood'], data['song'], data['content'], data['todos'], exists[0]))
    else:
        cursor.execute('''
            INSERT INTO entries (date, water, mood, song, content, todos)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['date'], data['water'], data['mood'], data['song'], data['content'], data['todos']))
    
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/get_entry/<date>')
def get_entry(date):
    conn = sqlite3.connect('journal.db')
    cursor = conn.cursor()
    
    # We search for an entry that starts with the date you picked (YYYY-MM-DD)
    cursor.execute("SELECT * FROM entries WHERE date LIKE ? ORDER BY id DESC LIMIT 1", (f"{date}%",))
    entry = cursor.fetchone()
    conn.close()

    if entry:
        # If we find it, send the data back to the browser
        return jsonify({
            "found": True,
            "water": entry[2],
            "mood": entry[3],
            "song": entry[4],
            "content": entry[5],
            "todos": entry[6]
        })
    else:
        return jsonify({"found": False})
@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    action = data.get('action') # 'login' or 'signup'

    conn = sqlite3.connect('journal.db')
    cursor = conn.cursor()

    if action == 'signup':
        # Scramble the password for safety
        hashed_pw = generate_password_hash(password)
        try:
            cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_pw))
            conn.commit()
            return jsonify({"success": True, "message": "Account created! Now login."})
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "That username is taken!"})

    elif action == 'login':
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        # Check if user exists AND if the password matches the secret hash
        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]
            session['username'] = user[1]
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Wrong username or password."})

    conn.close()

if __name__ == '__main__':
    app.run(debug=True)


