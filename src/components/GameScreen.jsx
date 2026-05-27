import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Save, BarChart3, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import DartCalculator from '@/components/DartCalculator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ROW_LABELS = [
  'Hourglass',
  '20',
  'DBL',
  '19',
  'TPL',
  '18',
  '51',
  '17',
  '1C',
  '16',
  '3C',
  '15',
  'Bulls eye'
];

const HOURGLASS_START = 20;

// Returns the bonus added to a row if at least one dart hit (or condition met).
const getRowBonus = (rowIndex, dartTotal) => {
  if (dartTotal <= 0) return 0;
  switch (rowIndex) {
    case 1: return 20;   // "20"
    case 3: return 19;   // "19"
    case 5: return 18;   // "18"
    case 6: return dartTotal === 51 ? 51 : 0; // "51" - must total exactly 51
    case 7: return 17;   // "17"
    case 9: return 16;   // "16"
    case 11: return 15;  // "15"
    case 12: return 50;  // "Bulls eye"
    default: return 0;   // DBL(2), TPL(4), 1C(8), 3C(10): no bonus
  }
};

const buildInitialScores = (players) =>
  players.reduce((acc, _, playerIndex) => {
    acc[playerIndex] = ROW_LABELS.reduce((rowAcc, _label, rowIndex) => {
      rowAcc[rowIndex] = rowIndex === 0 ? String(HOURGLASS_START) : '';
      return rowAcc;
    }, {});
    return acc;
  }, {});

const GameScreen = ({ players, onEndGame, onViewStats }) => {
  const [scores, setScores] = useState(() => buildInitialScores(players));
  const [isSaving, setIsSaving] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const updateScore = (playerIndex, rowIndex, value) => {
    setScores(prev => ({
      ...prev,
      [playerIndex]: {
        ...prev[playerIndex],
        [rowIndex]: value
      }
    }));
  };

  const clearScores = () => {
    setScores(buildInitialScores(players));
    setSelectedCell(null);
  };

  const restartGame = () => {
    clearScores();
    toast.success('Game restarted with same players!');
  };

  // Total = the value of the latest filled row (running cumulative)
  const totals = useMemo(() => {
    return players.map((_, playerIndex) => {
      const playerScores = scores[playerIndex];
      let lastValue = 0;
      for (let i = 0; i < ROW_LABELS.length; i++) {
        const raw = playerScores[i];
        if (raw !== '' && raw !== undefined && raw !== null) {
          const num = parseFloat(raw);
          if (!isNaN(num)) lastValue = num;
        }
      }
      return lastValue;
    });
  }, [scores, players]);

  const handleSaveGame = async () => {
    const playerScores = players.map((name, index) => ({
      name,
      score: totals[index]
    }));

    const maxScore = Math.max(...totals);
    const winnerIndex = totals.indexOf(maxScore);
    const winner = players[winnerIndex];

    if (maxScore === 0) {
      toast.error('Cannot save game with no scores!');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(`${API}/games`, {
        players: playerScores,
        winner
      });
      toast.success(`Game saved! Winner: ${winner} with ${maxScore} points`);
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error('Failed to save game. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCalculator = (playerIndex, rowIndex) => {
    if (rowIndex === 0) {
      toast.error('Hourglass starts at 20 and cannot be edited');
      return;
    }
    setSelectedCell({ playerIndex, rowIndex });
    setCalculatorOpen(true);
  };

  const handleCalculatorSubmit = (totalScore) => {
    if (!selectedCell) return;
    const { playerIndex, rowIndex } = selectedCell;
    if (rowIndex === 0) return;
    const previousCellValue = parseFloat(scores[playerIndex][rowIndex - 1]) || 0;
    const bonus = getRowBonus(rowIndex, totalScore);
    const added = totalScore + bonus;
    const newCellValue = previousCellValue + added;
    updateScore(playerIndex, rowIndex, newCellValue.toString());
    setCalculatorOpen(false);
    if (bonus > 0) {
      toast.success(`+${added} (${totalScore} darts + ${bonus} bonus) = ${newCellValue}`);
    } else {
      toast.success(`+${added} = ${newCellValue}`);
    }
  };

  const handleMiss = () => {
    if (!selectedCell) {
      toast.error('Please select a cell first');
      return;
    }
    const { playerIndex, rowIndex } = selectedCell;
    if (rowIndex === 0) {
      toast.error('Cannot miss on Hourglass row');
      return;
    }
    const previousCellValue = parseFloat(scores[playerIndex][rowIndex - 1]) || 0;
    const newCellValue = Math.floor(previousCellValue / 2);
    updateScore(playerIndex, rowIndex, newCellValue.toString());
    setCalculatorOpen(false);
    toast.error(`Miss! ${ROW_LABELS[rowIndex]} = ${newCellValue} (half of ${previousCellValue})`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-3 sm:p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 
            className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="game-title"
          >
            HOURGLASS
          </h1>
          
          <Button
            onClick={onViewStats}
            className="bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626] h-9 px-3 rounded-sm font-bold text-xs"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            data-testid="game-view-stats-btn"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto relative w-full border border-[#262626] bg-[#0A0A0A] shadow-2xl mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#121212]">
                <th 
                  className="sticky left-0 bg-[#121212] border-r border-[#262626] z-10 font-bold px-2 py-2 w-24 text-left"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  data-testid="header-label"
                >
                  <span className="text-xs tracking-wider uppercase text-[#A1A1AA]">NAME</span>
                </th>
                {players.map((player, index) => (
                  <th 
                    key={index}
                    className="border-r border-[#262626] px-2 py-2 text-center font-bold text-white text-sm"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    data-testid={`header-player-${index}`}
                  >
                    {player}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROW_LABELS.map((label, rowIndex) => (
                <tr key={rowIndex}>
                  <td 
                    className="sticky left-0 bg-[#121212] border-r border-b border-[#262626] z-10 font-bold px-2 py-2 text-white text-xs"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    data-testid={`row-label-${rowIndex}`}
                  >
                    {label}
                  </td>
                  {players.map((_, playerIndex) => {
                    const isSelected = selectedCell?.playerIndex === playerIndex && selectedCell?.rowIndex === rowIndex;
                    const cellValue = scores[playerIndex][rowIndex];
                    const isLocked = rowIndex === 0;
                    return (
                      <td 
                        key={playerIndex}
                        className={`border-b border-r border-[#262626] p-0 relative transition-colors ${
                          isLocked 
                            ? 'bg-[#1A1A1A] cursor-not-allowed' 
                            : 'cursor-pointer hover:bg-white/5'
                        } ${
                          isSelected ? 'ring-2 ring-[#007AFF] ring-inset bg-[#007AFF]/10' : ''
                        }`}
                        onClick={() => !isLocked && handleOpenCalculator(playerIndex, rowIndex)}
                        data-testid={`grid-cell-player${playerIndex}-row${rowIndex}`}
                      >
                        <div 
                          className={`w-full text-center py-3 font-mono text-base min-h-[44px] flex items-center justify-center ${
                            isLocked ? 'text-[#A1A1AA]' : 'text-white'
                          }`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          data-testid={`grid-input-player${playerIndex}-row${rowIndex}`}
                        >
                          {cellValue || ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-[#007AFF] bg-[#1A1A1A]">
                <td 
                  className="sticky left-0 bg-[#1A1A1A] border-r border-[#262626] z-10 font-bold px-2 py-2 text-white text-xs"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  data-testid="total-label"
                >
                  TOTAL
                </td>
                {totals.map((total, index) => (
                  <td 
                    key={index}
                    className="border-r border-[#262626] px-2 py-2 text-center font-bold text-[#007AFF] text-base"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    data-testid={`total-player-${index}`}
                  >
                    {total}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSaveGame}
              disabled={isSaving}
              className="flex-1 bg-[#007AFF] hover:bg-[#0066DD] text-white h-10 rounded-sm font-bold text-xs"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="btn-save-game"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'SAVING...' : 'SAVE'}
            </Button>

            <Button
              onClick={restartGame}
              className="flex-1 bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#262626] h-10 rounded-sm font-bold text-xs"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="btn-restart"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              RESTART
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleMiss}
              className="flex-1 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white h-10 rounded-sm font-bold text-xs"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="btn-miss"
            >
              MISS (÷2)
            </Button>
            
            <Button
              onClick={onEndGame}
              className="flex-1 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white h-10 rounded-sm font-bold text-xs"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              data-testid="btn-end"
            >
              END
            </Button>
          </div>
        </div>
      </div>

      {calculatorOpen && (
        <DartCalculator
          rowIndex={selectedCell?.rowIndex}
          rowLabel={selectedCell !== null ? ROW_LABELS[selectedCell.rowIndex] : ''}
          onClose={() => setCalculatorOpen(false)}
          onSubmit={handleCalculatorSubmit}
          onMiss={handleMiss}
        />
      )}
    </div>
  );
};

export default GameScreen;