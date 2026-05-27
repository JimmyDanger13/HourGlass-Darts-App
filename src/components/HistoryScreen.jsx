import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, TrendingUp, Clock } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryScreen = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaderboardRes, statsRes, gamesRes] = await Promise.all([
        axios.get(`${API}/leaderboard`),
        axios.get(`${API}/player-stats`),
        axios.get(`${API}/games?limit=20`)
      ]);
      
      setLeaderboard(leaderboardRes.data);
      setPlayerStats(statsRes.data);
      setRecentGames(gamesRes.data);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="history-title"
          >
            GAME HISTORY
          </h1>
          
          <Button
            onClick={onBack}
            className="bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626] h-10 px-4 rounded-sm font-bold tracking-wide"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="history-back-btn"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK
          </Button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setActiveTab('leaderboard')}
            className={`h-10 px-6 rounded-sm font-bold tracking-wide ${
              activeTab === 'leaderboard' 
                ? 'bg-[#007AFF] hover:bg-[#0066DD] text-white' 
                : 'bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626]'
            }`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="tab-leaderboard"
          >
            <Trophy className="h-4 w-4 mr-2" />
            LEADERBOARD
          </Button>
          
          <Button
            onClick={() => setActiveTab('stats')}
            className={`h-10 px-6 rounded-sm font-bold tracking-wide ${
              activeTab === 'stats' 
                ? 'bg-[#007AFF] hover:bg-[#0066DD] text-white' 
                : 'bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626]'
            }`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="tab-stats"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            PLAYER STATS
          </Button>
          
          <Button
            onClick={() => setActiveTab('recent')}
            className={`h-10 px-6 rounded-sm font-bold tracking-wide ${
              activeTab === 'recent' 
                ? 'bg-[#007AFF] hover:bg-[#0066DD] text-white' 
                : 'bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626]'
            }`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="tab-recent"
          >
            <Clock className="h-4 w-4 mr-2" />
            RECENT GAMES
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">
            <p className="text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>LOADING...</p>
          </div>
        ) : (
          <>
            {activeTab === 'leaderboard' && (
              <div className="bg-[#121212] border border-[#262626] p-6 shadow-2xl">
                <h2 
                  className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white mb-4"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  TOP PLAYERS BY WINS
                </h2>
                {leaderboard.length === 0 ? (
                  <p className="text-[#A1A1AA] text-center py-8">No games played yet</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((player, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-[#0A0A0A] border border-[#262626] p-4 hover:bg-white/5 transition-colors"
                        data-testid={`leaderboard-item-${index}`}
                      >
                        <div className="flex items-center gap-4">
                          <span 
                            className="text-3xl font-black text-[#007AFF]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-white font-bold text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {player.name}
                            </p>
                            <p className="text-[#A1A1AA] text-sm">
                              {player.games_played} game{player.games_played !== 1 ? 's' : ''} played
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-[#007AFF]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {player.wins}
                          </p>
                          <p className="text-[#A1A1AA] text-xs uppercase tracking-wider">WINS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-[#121212] border border-[#262626] p-6 shadow-2xl">
                <h2 
                  className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white mb-4"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  DETAILED PLAYER STATS
                </h2>
                {playerStats.length === 0 ? (
                  <p className="text-[#A1A1AA] text-center py-8">No player stats available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#262626]">
                          <th className="text-left px-4 py-3 text-xs tracking-[0.2em] uppercase text-[#A1A1AA]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>PLAYER</th>
                          <th className="text-center px-4 py-3 text-xs tracking-[0.2em] uppercase text-[#A1A1AA]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>GAMES</th>
                          <th className="text-center px-4 py-3 text-xs tracking-[0.2em] uppercase text-[#A1A1AA]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>WINS</th>
                          <th className="text-center px-4 py-3 text-xs tracking-[0.2em] uppercase text-[#A1A1AA]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>AVG SCORE</th>
                          <th className="text-center px-4 py-3 text-xs tracking-[0.2em] uppercase text-[#A1A1AA]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>HIGHEST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerStats.map((player, index) => (
                          <tr key={index} className="border-b border-[#262626] hover:bg-white/5" data-testid={`stats-item-${index}`}>
                            <td className="px-4 py-3 text-white font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{player.name}</td>
                            <td className="px-4 py-3 text-center text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{player.games_played}</td>
                            <td className="px-4 py-3 text-center text-[#007AFF] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{player.total_wins}</td>
                            <td className="px-4 py-3 text-center text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{player.avg_score}</td>
                            <td className="px-4 py-3 text-center text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{player.highest_score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="bg-[#121212] border border-[#262626] p-6 shadow-2xl">
                <h2 
                  className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white mb-4"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  RECENT GAMES
                </h2>
                {recentGames.length === 0 ? (
                  <p className="text-[#A1A1AA] text-center py-8">No games played yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentGames.map((game, index) => (
                      <div 
                        key={index}
                        className="bg-[#0A0A0A] border border-[#262626] p-4 hover:bg-white/5 transition-colors"
                        data-testid={`recent-game-${index}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-[#007AFF]" />
                            <span className="text-white font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                              WINNER: {game.winner}
                            </span>
                          </div>
                          <span className="text-[#A1A1AA] text-sm">{formatDate(game.timestamp)}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {game.players.map((player, pIndex) => (
                            <div 
                              key={pIndex}
                              className={`p-2 rounded-sm ${
                                player.name === game.winner 
                                  ? 'bg-[#007AFF]/20 border border-[#007AFF]' 
                                  : 'bg-[#1A1A1A] border border-[#262626]'
                              }`}
                            >
                              <p className="text-white text-sm font-bold truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {player.name}
                              </p>
                              <p className="text-[#007AFF] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                {player.score}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
