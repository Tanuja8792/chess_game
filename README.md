# Royal 3D Chess

A 3D browser chess game built with Python, Django, Three.js and chess.js.

## First milestone
- Interactive 3D chessboard and 3D pieces
- Local two-player chess
- Legal moves, check, checkmate and draw detection using chess.js
- Move history, undo, reset, board rotation and zoom
- Django home page and a GameRecord database model foundation

## Requirements
Python 3.10+ and an internet connection for Three.js and chess.js CDN libraries.

## Run on Windows
1. Clone or download this repository and open it in VS Code.
2. Create a virtual environment: py -m venv .venv
3. Activate it: .venv\Scripts\activate
4. Install dependencies: python -m pip install -r requirements.txt
5. Create database tables: python manage.py migrate
6. Start the server: python manage.py runserver
7. Open http://127.0.0.1:8000/

This is the first milestone. Saving completed games, user authentication, online multiplayer and deployment are follow-up tasks. Before production, change SECRET_KEY, DEBUG and ALLOWED_HOSTS.
