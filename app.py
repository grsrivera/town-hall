from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from openai import OpenAI
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

DB_FILE = "database.db" 

# Connect to the database
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # For dictionary-like access
    return conn

# Get top 5 most recent threads for gov and cit
@app.route("/recent-threads", methods=["GET"])
def get_recent_threads():
    try:
        conn = get_db_connection()

        cur = conn.execute("""
        SELECT * FROM (
            SELECT t.thread_id, topic, last_activity, t.government,      -- from threads
            c.user_id, content, message_id, content,    -- from comments
            username, first_name, last_name, profile_pic    -- from users
            FROM threads t
            JOIN comments c ON t.thread_id = c.thread_id
            JOIN users u on c.user_id = u.user_id
            WHERE government = 1 AND c.message_id = (SELECT MIN(message_id) FROM comments WHERE thread_id=t.thread_id)
            ORDER BY last_activity desc
            LIMIT 5
        )
        UNION
        SELECT * FROM (
            SELECT t.thread_id, topic, last_activity, t.government,      -- from threads
            c.user_id, content, message_id, content,    -- from comments
            username, first_name, last_name, profile_pic    -- from users
            FROM threads t
            JOIN comments c ON t.thread_id = c.thread_id
            JOIN users u on c.user_id = u.user_id
            WHERE government = 0 AND c.message_id = (SELECT MIN(message_id) FROM comments WHERE thread_id=t.thread_id)
            ORDER BY last_activity desc
            LIMIT 5
        )               
        """)
        threads = cur.fetchall()

        conn.close()

        # Convert result to list of dictionaries
        recent_threads = [dict(thread) for thread in threads]
        return jsonify(recent_threads)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API to get threads (Frontend calls this to populate page)
@app.route("/get-threads", methods=["GET"])
def get_threads():
    def fetch_threads(gov_response, last_thread, conn):
        return conn.execute("""
            SELECT t.thread_id, topic, last_activity, t.government,      -- from threads
                c.user_id, content, message_id,    -- from comments
                username, first_name, last_name, profile_pic    -- from users
                FROM threads t
            JOIN comments c ON t.thread_id = c.thread_id
            JOIN users u on c.user_id = u.user_id
            WHERE government = ? 
                AND c.message_id = (SELECT MIN(message_id) FROM comments WHERE thread_id=t.thread_id)
                AND t.thread_id < ?
            ORDER BY last_activity desc
            LIMIT 5
            """, (gov_response, last_thread))
    
    def get_total_count(gov_response, conn):
        return conn.execute("""
            SELECT COUNT(*) FROM threads WHERE government = ?;
        """, (gov_response,))

    gov_response = request.args.get("response")
    last_thread = request.args.get("lastThreadId")

    # For index.html, total count for gov and citizen posts
    if gov_response:
        gov_response = int(gov_response)

    # For initial page load of allThreads.html, since last_thread will be empty
    if last_thread:
        last_thread = int(last_thread)

    conn = get_db_connection()
 
    if gov_response is None: # For index.html totals
        cur_1 = conn.execute("SELECT * FROM threads ORDER BY last_activity desc")
        cur_2 = None
    else:
        if last_thread is None:
            cur_1 = fetch_threads(gov_response, 1000000000, conn)
            cur_2 = get_total_count(gov_response, conn)
        else: 
            cur_1 = fetch_threads(gov_response, last_thread, conn)
            cur_2 = get_total_count(gov_response, conn)

    threads = cur_1.fetchall()
    threads = [dict(thread) for thread in threads]

    if cur_2:
        total_count = cur_2.fetchone()[0]
    else:
        total_count = len(threads)
    
    conn.close()
    return jsonify({"threads": threads, "total_count": total_count})


# API to get comments to populate post.html
@app.route("/get-posts", methods=["GET"])
def get_posts():
    try:
        thread_id = request.args.get("thread_id")
        conn = get_db_connection()

        comments = conn.execute("""
            SELECT c.*, u.first_name, u.last_name, u.profile_pic, t.topic, t.government
            FROM comments c
            JOIN users u ON c.user_id = u.user_id
            JOIN threads t ON c.thread_id = t.thread_id
            WHERE c.thread_id = ?
            ORDER BY c.message_id ASC
        """, (thread_id,)).fetchall()

        conn.close()

        # put comments in a list then jsonify
        comments = [dict(comment) for comment in comments]
        return jsonify(comments)

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# API to get users (Frontend calls this to populate page)
@app.route("/users", methods=["GET"])
def get_users():
    try:
        conn = get_db_connection()
        users = conn.execute("SELECT * FROM users").fetchall()
        conn.close()

        return jsonify([dict(user) for user in users])

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API to post a reply (add a comment to a thread)
@app.route("/post-reply", methods=["POST"])
def post_reply():
    try:
        data = request.json
        thread_id = data["thread_id"]

        conn = get_db_connection()
        
        # Insert new comment
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO comments (thread_id, user_id, content, timestamp) 
            VALUES (?, ?, ?, ?)
        """, (thread_id, data["user_id"], data["content"], data["timestamp"]))
        
        # Update last activity and message count for the thread
        cursor.execute("UPDATE threads SET last_activity = ?, message_count = message_count + 1 WHERE thread_id = ?", (data["timestamp"], thread_id))

        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Comment added"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API to create a thread
@app.route("/create-thread", methods=["POST"])
def create_thread():
    try:
        data = request.json
    
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert new thread
        cursor.execute("""
            INSERT INTO threads (topic, government, last_activity, message_count) 
            VALUES (?, ?, ?, ?)
        """, (data["topic"], False, data["timestamp"]))
        
        thread_id = cursor.lastrowid  # Get the ID of the new thread

        # Insert the first comment
        cursor.execute("""
            INSERT INTO comments (thread_id, user_id, content, timestamp) 
            VALUES (?, ?, ?, ?)
        """, (thread_id, data["user_id"], data["content"], data["timestamp"]))

        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Thread created", "thread_id": thread_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Search
@app.route("/search", methods=["GET"])
def get_search():
    search_query = request.args.get("query", "")

    conn = get_db_connection()
    cur_1 = conn.execute("""
        SELECT t.thread_id, topic, last_activity, t.government,      -- from threads
        c.user_id, content, message_id    -- from comments
        username, first_name, last_name, profile_pic    -- from users
        FROM threads t
        JOIN comments c ON t.thread_id = c.thread_id
        JOIN users u on c.user_id = u.user_id
        WHERE content LIKE ?
            OR u.first_name LIKE ?
            OR u.last_name LIKE ?
            OR topic LIKE ?
        ORDER BY last_activity desc
    """, ("%" + search_query + "%", "%" + search_query + "%", "%" + search_query + "%", "%" + search_query + "%",))

    cur_2 = conn.execute("""
        SELECT COUNT(*) FROM threads t
        JOIN comments c ON t.thread_id = c.thread_id
        JOIN users u on c.user_id = u.user_id                 
        WHERE content LIKE ?
            OR u.first_name LIKE ?
            OR u.last_name LIKE ?
            OR topic LIKE ?
    """, ("%" + search_query + "%", "%" + search_query + "%", "%" + search_query + "%", "%" + search_query + "%",))

    threads = cur_1.fetchall()
    total_count = cur_2.fetchone()[0]
    conn.close()

    threads = [dict(thread) for thread in threads]
    
    return jsonify({"threads": threads, "total_count": total_count})

# API to get a summary of citizen posts using Llama
load_dotenv()
API_KEY = os.getenv("API_KEY")

@app.route("/get-summary", methods=["GET"])
def summarize():
    try:
        conn = get_db_connection()
        threads = conn.execute("SELECT * FROM threads").fetchall()
        conn.close()

        # Separate threads with and without government replies
        # gov_reply = [dict(thread) for thread in threads if thread["government"] == 1]
        citizen_posts = [dict(thread) for thread in threads if thread["government"] == 0]

        client = OpenAI(
            # This is the default and can be omitted
            api_key=API_KEY,
            base_url="https://api.llama-api.com/"
        )

        response = client.chat.completions.create(
            messages=[
                        {
                            "role": "system",
                            "content": "You are the AI for the State of Alaska's official online message board. The user is the governor. His constituents reach out to him on the message board and expect responses or government action. You will be summarizing citizen posts for the governor so he knows the most pressing topics for citizens."
                        },
                        {
                            "role": "user",
                            "content": f"These are messages from my constituents. Can you summarize what their posts are about in a few sentences? "
                                        f"Then can you give me a list of the top 5 most pressing concerns to them?\n"
                                        f"In the list, please include hyperlinks when you mention a topic, like hyperlink one to a few words. "
                                        f"When mentioning topics, format them as hyperlinks using this format: "
                                        f"\"<a href=\"post.html?thread_id=THREAD_ID\" target=\"_blank\" rel=\"noopener noreferrer\">TOPIC_NAME</a>. "
                                        f"That helps me post them in html easier.\n"
                                        f"Here are the citizen posts: {citizen_posts}\n"
                        }
                    ],
            model="llama3.2-3b",
            stream=False
        )

        return jsonify({"summary": response.choices[0].message.content})

    except Exception as e:
        import traceback
        print("Llama Error:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
