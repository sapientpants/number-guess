import { motion } from 'framer-motion';
import { usePlayerStore } from '../../store/playerStore';
import { useGameStore } from '../../store/gameStore';
import { Card } from '../UI/Card';
import { getTemperatureEmoji } from '../../utils/gameLogic';
import {
  calculateStreaks,
  getCompletedGames,
  getPerformanceTier,
  summarizeGames,
  type PerformanceTier,
} from '../../utils/insights';

const TIER_BACKGROUND: Record<PerformanceTier, string> = {
  best: 'bg-green-900/20',
  good: 'bg-yellow-900/20',
  normal: 'bg-gray-800/30',
};

interface InsightTile {
  key: string;
  visible: boolean;
  emoji: string;
  value: number;
  label: string;
  gradient: string;
  valueColor: string;
  delay?: number;
}

export const GameInsights = () => {
  const { currentPlayer } = usePlayerStore();
  const { loadGameHistory, currentGame, guesses } = useGameStore();

  if (!currentPlayer) return null;

  const playerGames = getCompletedGames(loadGameHistory(), currentPlayer.id);
  const { totalGuesses, gamesUnder5, perfectGames } = summarizeGames(playerGames);
  const { currentStreak, bestStreak } = calculateStreaks(playerGames, currentPlayer.averageGuesses);

  // Current game progress
  const currentProgress =
    currentGame && !currentGame.isComplete
      ? {
          guessCount: guesses.length,
          onTrack: guesses.length < currentPlayer.averageGuesses,
        }
      : null;

  const tiles: InsightTile[] = [
    {
      key: 'perfect',
      visible: perfectGames > 0,
      emoji: '🎯',
      value: perfectGames,
      label: `Perfect ${perfectGames === 1 ? 'Game' : 'Games'}`,
      gradient: 'from-green-900/20 to-emerald-900/20',
      valueColor: 'text-green-400',
    },
    {
      key: 'under5',
      visible: gamesUnder5 > 0,
      emoji: '⭐',
      value: gamesUnder5,
      label: 'Under 5 Guesses',
      gradient: 'from-yellow-900/20 to-amber-900/20',
      valueColor: 'text-yellow-400',
      delay: 0.1,
    },
    {
      key: 'current-streak',
      visible: currentStreak > 2,
      emoji: '🔥',
      value: currentStreak,
      label: 'Current Streak',
      gradient: 'from-purple-900/20 to-pink-900/20',
      valueColor: 'text-purple-400',
      delay: 0.2,
    },
    {
      key: 'best-streak',
      visible: bestStreak > 3,
      emoji: '🏆',
      value: bestStreak,
      label: 'Best Streak',
      gradient: 'from-blue-900/20 to-cyan-900/20',
      valueColor: 'text-blue-400',
      delay: 0.3,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Current Game Progress */}
      {currentProgress && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20">
          <h3 className="text-sm font-semibold mb-3 text-gray-400">Current Game</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {currentProgress.guessCount}{' '}
                {currentProgress.guessCount === 1 ? 'guess' : 'guesses'}
              </p>
              <p className="text-sm text-gray-400">
                {currentProgress.onTrack ? '✨ On track for a good game!' : '💪 Keep going!'}
              </p>
            </div>
            <span className="text-3xl">{getTemperatureEmoji('warm')}</span>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <h3 className="text-sm font-semibold mb-3 text-gray-400">Game Insights</h3>

        <div className="grid grid-cols-2 gap-3">
          {tiles
            .filter((tile) => tile.visible)
            .map((tile) => (
              <motion.div
                key={tile.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: tile.delay ?? 0 }}
                className={`bg-gradient-to-br ${tile.gradient} rounded-lg p-3 text-center`}
              >
                <p className="text-2xl mb-1">{tile.emoji}</p>
                <p className={`text-lg font-bold ${tile.valueColor}`}>{tile.value}</p>
                <p className="text-xs text-gray-400">{tile.label}</p>
              </motion.div>
            ))}
        </div>

        {/* Fun fact */}
        {totalGuesses > 50 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-3 bg-gray-800/50 rounded-lg text-center"
          >
            <p className="text-sm text-gray-400">
              You've made <span className="font-bold text-purple-400">{totalGuesses}</span> total
              guesses!
            </p>
          </motion.div>
        )}
      </Card>

      {/* Recent Games Mini View */}
      {playerGames.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3 text-gray-400">Last 5 Games</h3>
          <div className="flex gap-2 justify-between">
            {playerGames.slice(0, 5).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex-1 text-center p-2 rounded ${TIER_BACKGROUND[getPerformanceTier(game.guesses.length, currentPlayer)]}`}
              >
                <p className="text-lg font-bold">{game.guesses.length}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
