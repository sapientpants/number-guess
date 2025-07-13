import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { GuessInput } from './GuessInput';
import { GuessHistory } from './GuessHistory';
import { GameStats } from './GameStats';
import { GameInsights } from '../Player/GameInsights';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';

type RightPanelTab = 'history' | 'stats';

export const GameBoard = () => {
  const { gameStatus, startNewGame, resetGame, guesses, currentGame } = useGameStore();

  const { currentPlayer, updatePlayerStats } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<RightPanelTab>('history');

  // Update player stats when game is won
  useEffect(() => {
    if (
      gameStatus === 'won' &&
      currentGame &&
      currentPlayer &&
      currentGame.isComplete &&
      currentGame.completedAt
    ) {
      // Use game ID to ensure we only update once per game
      const statsKey = `stats-updated-${currentGame.id}`;
      if (!sessionStorage.getItem(statsKey)) {
        updatePlayerStats(currentPlayer.id, currentGame.guesses.length);
        sessionStorage.setItem(statsKey, 'true');
      }
    }
  }, [gameStatus, currentGame, currentPlayer, updatePlayerStats]);

  // Guard against race conditions during win state
  if (gameStatus === 'won' && !currentPlayer) {
    return null;
  }

  const handleNewGame = () => {
    if (currentPlayer) {
      resetGame();
      startNewGame(currentPlayer.id);
    }
  };

  if (!currentPlayer) {
    return (
      <Card>
        <p className="text-center text-gray-300">
          Please select or create a player to start playing
        </p>
      </Card>
    );
  }

  if (gameStatus === 'idle') {
    return (
      <Card className="text-center" gradient>
        <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
        <p className="text-gray-300 mb-6">
          I'm thinking of a number between 1 and 100. Can you guess it?
        </p>
        <Button onClick={handleNewGame} size="lg">
          Start New Game
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <Card gradient className="order-1">
        <h2 className="text-2xl font-bold mb-6 text-center">Number Guessing Game</h2>

        <GameStats />

        <div className="mt-8">
          <GuessInput />
        </div>

        <AnimatePresence>
          {gameStatus === 'won' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-6 text-center"
            >
              <p className="text-2xl font-bold text-green-400 mb-4">
                🎉 Congratulations{currentPlayer ? `, ${currentPlayer.name}` : ''}! 🎉
              </p>
              <p className="text-gray-300 mb-4">
                You found the number in {guesses.length}{' '}
                {guesses.length === 1 ? 'guess' : 'guesses'}!
              </p>
              <Button onClick={handleNewGame} variant="secondary">
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="space-y-4 order-2 flex flex-col h-full">
        {/* Tab Navigation */}
        <div
          className="flex gap-2 p-1 bg-gray-800/50 rounded-lg"
          role="tablist"
          aria-label="Game information tabs"
        >
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all min-h-[44px] ${
              activeTab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
            role="tab"
            aria-selected={activeTab === 'history'}
            aria-controls="history-panel"
            id="history-tab"
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all min-h-[44px] ${
              activeTab === 'stats' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
            role="tab"
            aria-selected={activeTab === 'stats'}
            aria-controls="stats-panel"
            id="stats-tab"
          >
            Insights
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                role="tabpanel"
                id="history-panel"
                aria-labelledby="history-tab"
                className="h-full"
              >
                <Card className="h-full">
                  <GuessHistory />
                </Card>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                role="tabpanel"
                id="stats-panel"
                aria-labelledby="stats-tab"
                className="h-full"
              >
                <GameInsights />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
