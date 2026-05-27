import os
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # fallback to frontend/.env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Root health
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# Save Game endpoint
def test_save_game_and_persist(session):
    payload = {
        "players": [
            {"name": "TEST_Alice", "score": 120},
            {"name": "TEST_Bob", "score": 95}
        ],
        "winner": "TEST_Alice"
    }
    r = session.post(f"{API}/games", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["winner"] == "TEST_Alice"
    assert len(data["players"]) == 2
    assert data["players"][0]["name"] == "TEST_Alice"
    assert data["players"][0]["score"] == 120
    assert "id" in data
    assert "timestamp" in data

    # Verify persistence via GET /games
    r2 = session.get(f"{API}/games?limit=20")
    assert r2.status_code == 200
    games = r2.json()
    ids = [g["id"] for g in games]
    assert data["id"] in ids


def test_save_second_game_for_leaderboard(session):
    payload = {
        "players": [
            {"name": "TEST_Alice", "score": 200},
            {"name": "TEST_Bob", "score": 150},
            {"name": "TEST_Charlie", "score": 50}
        ],
        "winner": "TEST_Alice"
    }
    r = session.post(f"{API}/games", json=payload)
    assert r.status_code == 200
    # And one game where Bob wins
    payload2 = {
        "players": [
            {"name": "TEST_Alice", "score": 80},
            {"name": "TEST_Bob", "score": 180}
        ],
        "winner": "TEST_Bob"
    }
    r2 = session.post(f"{API}/games", json=payload2)
    assert r2.status_code == 200


def test_leaderboard(session):
    r = session.get(f"{API}/leaderboard")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # Find TEST_Alice and TEST_Bob entries
    by_name = {p["name"]: p for p in data}
    assert "TEST_Alice" in by_name
    alice = by_name["TEST_Alice"]
    # Alice should have wins >= 2 and games_played >= 3
    assert alice["wins"] >= 2
    assert alice["games_played"] >= 3
    # Verify sorted by wins descending
    wins = [p["wins"] for p in data]
    assert wins == sorted(wins, reverse=True)


def test_player_stats(session):
    r = session.get(f"{API}/player-stats")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    by_name = {p["name"]: p for p in data}
    assert "TEST_Alice" in by_name
    alice = by_name["TEST_Alice"]
    assert alice["games_played"] >= 3
    assert alice["total_wins"] >= 2
    assert alice["highest_score"] >= 200
    # avg_score should be total_score / games_played (approx)
    expected_avg = round(alice["total_score"] / alice["games_played"], 1)
    assert abs(alice["avg_score"] - expected_avg) < 0.2


def test_recent_games_sorted_desc(session):
    r = session.get(f"{API}/games?limit=20")
    assert r.status_code == 200
    games = r.json()
    assert len(games) >= 3
    # Check timestamp descending
    timestamps = [g["timestamp"] for g in games]
    assert timestamps == sorted(timestamps, reverse=True)
    # Each has expected fields
    g = games[0]
    assert "winner" in g
    assert "players" in g
    assert isinstance(g["players"], list)
    # No mongo _id leaked
    assert "_id" not in g


def test_save_game_validation_missing_fields(session):
    # Missing winner
    r = session.post(f"{API}/games", json={"players": [{"name": "X", "score": 10}]})
    assert r.status_code == 422
