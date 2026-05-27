from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class PlayerScore(BaseModel):
    name: str
    score: float

class GameCreate(BaseModel):
    players: List[PlayerScore]
    winner: str

class Game(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    players: List[PlayerScore]
    winner: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TopPlayer(BaseModel):
    name: str
    wins: int
    games_played: int

class PlayerStats(BaseModel):
    name: str
    games_played: int
    total_wins: int
    avg_score: float
    highest_score: float
    total_score: float


@api_router.get("/")
async def root():
    return {"message": "Score Tracker API"}

@api_router.post("/games", response_model=Game, status_code=201)
async def save_game(game_input: GameCreate):
    if not game_input.players:
        raise HTTPException(status_code=400, detail="Players list cannot be empty")
    
    player_names = [p.name for p in game_input.players]
    if game_input.winner not in player_names:
        raise HTTPException(status_code=400, detail=f"Winner '{game_input.winner}' must be one of the players")
    
    game_obj = Game(
        players=game_input.players,
        winner=game_input.winner
    )
    
    doc = game_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    doc['players'] = [p.model_dump() for p in game_obj.players]
    
    await db.games.insert_one(doc)
    return game_obj

@api_router.get("/games", response_model=List[Game])
async def get_recent_games(limit: int = 20):
    games = await db.games.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for game in games:
        if isinstance(game['timestamp'], str):
            game['timestamp'] = datetime.fromisoformat(game['timestamp'])
    
    return games

@api_router.get("/leaderboard", response_model=List[TopPlayer])
async def get_leaderboard(limit: int = 10):
    pipeline = [
        {"$unwind": "$players"},
        {"$group": {
            "_id": "$players.name",
            "games_played": {"$sum": 1}
        }},
        {"$lookup": {
            "from": "games",
            "let": {"player_name": "$_id"},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$winner", "$$player_name"]}}}
            ],
            "as": "wins"
        }},
        {"$project": {
            "name": "$_id",
            "games_played": 1,
            "wins": {"$size": "$wins"}
        }},
        {"$sort": {"wins": -1, "games_played": -1}},
        {"$limit": limit}
    ]
    
    results = await db.games.aggregate(pipeline).to_list(limit)
    return [TopPlayer(name=r['name'], wins=r['wins'], games_played=r['games_played']) for r in results]

@api_router.get("/player-stats", response_model=List[PlayerStats])
async def get_player_stats():
    pipeline = [
        {"$unwind": "$players"},
        {"$group": {
            "_id": "$players.name",
            "games_played": {"$sum": 1},
            "total_score": {"$sum": "$players.score"},
            "highest_score": {"$max": "$players.score"}
        }},
        {"$lookup": {
            "from": "games",
            "let": {"player_name": "$_id"},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$winner", "$$player_name"]}}}
            ],
            "as": "wins"
        }},
        {"$project": {
            "name": "$_id",
            "games_played": 1,
            "total_wins": {"$size": "$wins"},
            "total_score": 1,
            "avg_score": {"$divide": ["$total_score", "$games_played"]},
            "highest_score": 1
        }},
        {"$sort": {"total_wins": -1, "avg_score": -1}}
    ]
    
    results = await db.games.aggregate(pipeline).to_list(1000)
    return [
        PlayerStats(
            name=r['name'],
            games_played=r['games_played'],
            total_wins=r['total_wins'],
            avg_score=round(r['avg_score'], 1),
            highest_score=r['highest_score'],
            total_score=r['total_score']
        ) for r in results
    ]

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
