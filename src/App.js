import { useState } from "react";
import "@/App.css";
import SetupScreen from "@/components/SetupScreen";
import GameScreen from "@/components/GameScreen";
import HistoryScreen from "@/components/HistoryScreen";

function App() {
  const [currentScreen, setCurrentScreen] = useState('setup');
  const [players, setPlayers] = useState([]);

  const handleStartGame = (playerNames) => {
    setPlayers(playerNames);
    setCurrentScreen('game');
  };

  const handleEndGame = () => {
    setCurrentScreen('setup');
    setPlayers([]);
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleBackToSetup = () => {
    setCurrentScreen('setup');
  };

  return (
    <div className="App">
      {currentScreen === 'setup' && (
        <SetupScreen 
          onStartGame={handleStartGame} 
          onViewHistory={handleViewHistory}
        />
      )}
      {currentScreen === 'game' && (
        <GameScreen 
          players={players} 
          onEndGame={handleEndGame}
          onViewStats={handleViewHistory}
        />
      )}
      {currentScreen === 'history' && (
        <HistoryScreen onBack={handleBackToSetup} />
      )}
    </div>
  );
}

export default App;
