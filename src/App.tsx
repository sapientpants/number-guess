import { useEffect } from 'react';
import { PlayerHeader } from './components/Player/PlayerHeader';
import { GameBoard } from './components/Game/GameBoard';
import { LeaderboardTable } from './components/Leaderboard';
import { usePlayerStore } from './store/playerStore';

function App() {
  const { loadPlayers, currentPlayer, players } = usePlayerStore();

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center mb-8 pb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Number Guessing Game
        </h1>

        <div className="mb-8">
          <PlayerHeader />
        </div>

        {/* Game Content - only show when a player is selected */}
        {currentPlayer && (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 order-1">
              <GameBoard />
            </div>
            <div className="lg:col-span-1 order-2">
              {players.length > 0 && <LeaderboardTable />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
