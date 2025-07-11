import { motion } from 'framer-motion';
import { usePlayerStore } from '../../store/playerStore';
import { useGameStore } from '../../store/gameStore';
import { Card } from '../UI/Card';
import { getTemperatureEmoji } from '../../utils/gameLogic';
import { Game } from '../../types';

export const GameInsights = () => {
  const { currentPlayer } = usePlayerStore();
  const { loadGameHistory, currentGame, guesses } = useGameStore();

  const getPerformanceBackgroundClass = (guessCount: number, player: typeof currentPlayer) => {
    if (!player) return 'bg-gray-800/30';
    if (guessCount <= player.bestGame) return 'bg-green-900/20';
    if (guessCount <= player.averageGuesses) return 'bg-yellow-900/20';
    return 'bg-gray-800/30';
  };

  const calculateStreaks = (games: Game[], avgGuesses: number) => {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const game of games) {
      if (game.guesses.length <= avgGuesses) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        if (currentStreak === 0) currentStreak = tempStreak;
        tempStreak = 0;
      }
    }
    if (currentStreak === 0) currentStreak = tempStreak;

    return { currentStreak, bestStreak };
  };

  if (!currentPlayer) return null;

  // Get this player's game history
  const allGames = loadGameHistory();
  const playerGames = allGames
    .filter((game) => game.playerId === currentPlayer.id && game.isComplete)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  // Calculate insights
  const totalGuesses = playerGames.reduce((sum, game) => sum + game.guesses.length, 0);
  const gamesUnder5 = playerGames.filter((game) => game.guesses.length <= 5).length;
  const perfectGames = playerGames.filter((game) => game.guesses.length === 1).length;

  // Current game progress
  const currentProgress =
    currentGame && !currentGame.isComplete
      ? {
          guessCount: guesses.length,
          onTrack: guesses.length < currentPlayer.averageGuesses,
        }
      : null;

  // Calculate streaks
  const { currentStreak, bestStreak } = calculateStreaks(playerGames, currentPlayer.averageGuesses);

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
          {perfectGames > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg p-3 text-center"
            >
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-lg font-bold text-green-400">{perfectGames}</p>
              <p className="text-xs text-gray-400">
                Perfect {perfectGames === 1 ? 'Game' : 'Games'}
              </p>
            </motion.div>
          )}

          {gamesUnder5 > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 rounded-lg p-3 text-center"
            >
              <p className="text-2xl mb-1">⭐</p>
              <p className="text-lg font-bold text-yellow-400">{gamesUnder5}</p>
              <p className="text-xs text-gray-400">Under 5 Guesses</p>
            </motion.div>
          )}

          {currentStreak > 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-3 text-center"
            >
              <p className="text-2xl mb-1">🔥</p>
              <p className="text-lg font-bold text-purple-400">{currentStreak}</p>
              <p className="text-xs text-gray-400">Current Streak</p>
            </motion.div>
          )}

          {bestStreak > 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg p-3 text-center"
            >
              <p className="text-2xl mb-1">🏆</p>
              <p className="text-lg font-bold text-blue-400">{bestStreak}</p>
              <p className="text-xs text-gray-400">Best Streak</p>
            </motion.div>
          )}
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
                className={`flex-1 text-center p-2 rounded ${getPerformanceBackgroundClass(game.guesses.length, currentPlayer)}`}
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
