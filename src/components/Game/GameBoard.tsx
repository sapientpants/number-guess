/* eslint-disable complexity */
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { GuessInput } from './GuessInput';
import { GuessHistory } from './GuessHistory';
import { GameStats } from './GameStats';
import { GameInsights } from '../Player/GameInsights';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import type { Game } from '../../types';
import { saveGames } from '../../utils/storage';

type RightPanelTab = 'history' | 'stats';

interface TabButtonProps {
  tab: RightPanelTab;
  activeTab: RightPanelTab;
  onSelect: (tab: RightPanelTab) => void;
  children: ReactNode;
}

const TabButton = ({ tab, activeTab, onSelect, children }: TabButtonProps) => {
  const isActive = tab === activeTab;
  return (
    <button
      onClick={() => onSelect(tab)}
      className={`flex-1 px-4 py-2 rounded-md font-medium transition-all min-h-[44px] ${
        isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
      }`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tab}-panel`}
      id={`${tab}-tab`}
    >
      {children}
    </button>
  );
};

export const GameBoard = () => {
  const { gameStatus, startNewGame, resetGame, guesses, currentGame } = useGameStore();

  const { currentPlayer } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<RightPanelTab>('history');

  // Player stats are updated via the GAME_WON event in gameStore.ts

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

  const handleGiveUp = () => {
    if (!currentGame || !currentPlayer) return;

    const updatedGame: Game = {
      ...currentGame,
      isComplete: true,
      status: 'lost',
      completedAt: new Date(),
    };

    // Save to localStorage
    const allGames = useGameStore.getState().loadGameHistory();
    const gameIndex = allGames.findIndex((g) => g.id === currentGame.id);
    if (gameIndex >= 0) {
      allGames[gameIndex] = updatedGame;
    } else {
      allGames.push(updatedGame);
    }
    saveGames(allGames);

    // Reset and start new game
    useGameStore.getState().resetGame();
    const { startNewGame } = useGameStore.getState();
    startNewGame(currentPlayer.id);

    // GAME_LOST event is emitted in gameStore.ts
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
          <div className="mt-4 flex justify-center">
            <Button onClick={handleGiveUp} variant="secondary" size="sm">
              Give Up
            </Button>
          </div>
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
                🎉 Congratulations, {currentPlayer.name}! 🎉
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

          {gameStatus === 'lost' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-6 text-center"
            >
              <p className="text-2xl font-bold text-red-400 mb-4">
                😢 Game Over, {currentPlayer.name}!
              </p>
              <p className="text-gray-300 mb-4">The number was {currentGame?.targetNumber}.</p>
              <Button onClick={handleNewGame} variant="secondary">
                Try Again
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
          <TabButton tab="history" activeTab={activeTab} onSelect={setActiveTab}>
            History
          </TabButton>
          <TabButton tab="stats" activeTab={activeTab} onSelect={setActiveTab}>
            Insights
          </TabButton>
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
