import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, History } from 'lucide-react';

const SetupScreen = ({ onStartGame, onViewHistory }) => {
  const [playerNames, setPlayerNames] = useState(['']);

  const addPlayer = () => {
    if (playerNames.length < 10) {
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index) => {
    if (playerNames.length > 1) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
    }
  };

  const updatePlayerName = (index, value) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    if (validNames.length > 0) {
      onStartGame(validNames);
    }
  };

  const validPlayerCount = playerNames.filter(name => name.trim() !== '').length;

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/f44ecba7-517c-4c72-8ea4-62aa595a6048/images/08b2b314ac10680e4b284d148f1c1bf4c04a5ea03b7b295f45d486f7a42a0e07.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/80"></div>
      
      <Button
        onClick={onViewHistory}
        className="absolute top-4 right-4 z-20 bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626] h-9 px-3 rounded-sm font-bold text-xs"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        data-testid="setup-history-btn"
      >
        <History className="h-4 w-4 mr-1" />
        HISTORY
      </Button>

      <div className="relative z-10 w-full max-w-md">
        <h1 
          className="text-5xl sm:text-6xl font-black tracking-tighter uppercase text-white mb-8 text-center"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          data-testid="setup-title"
        >
          HOURGLASS
        </h1>

        <div className="bg-[#121212] border border-[#262626] p-6 shadow-2xl">
          <div className="mb-6">
            <label 
              className="text-xs tracking-[0.2em] uppercase text-[#A1A1AA] font-bold mb-3 block"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              ADD PLAYERS ({validPlayerCount}/10)
            </label>
            
            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="flex-1 bg-[#0A0A0A] border-[#262626] text-white focus:ring-2 focus:ring-[#007AFF] rounded-sm h-11"
                    data-testid={`setup-player-input-${index}`}
                  />
                  {playerNames.length > 1 && (
                    <Button
                      onClick={() => removePlayer(index)}
                      variant="destructive"
                      size="icon"
                      className="h-11 w-11 rounded-sm bg-[#FF3B30] hover:bg-[#FF3B30]/90"
                      data-testid={`setup-remove-player-${index}`}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={addPlayer}
              disabled={playerNames.length >= 10}
              className="w-full bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626] h-11 rounded-sm font-bold tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="setup-add-player-btn"
            >
              + ADD PLAYER
            </Button>
            
            <Button
              onClick={handleStartGame}
              disabled={validPlayerCount === 0}
              className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white h-11 rounded-sm font-bold tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="setup-start-btn"
            >
              START GAME
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;