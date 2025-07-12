import { motion } from 'framer-motion';
import { usePlayerStore } from '../../store/playerStore';
import { useGameStore } from '../../store/gameStore';
import { Card } from '../UI/Card';

export const PlayerStats = () => {
  const { currentPlayer, players } = usePlayerStore();
  const { loadGameHistory } = useGameStore();

  const getPerformanceTextClass = (guessCount: number, player: typeof currentPlayer) => {
    if (!player) return 'text-gray-400';
    if (guessCount <= player.bestGame) return 'text-green-400';
    if (guessCount <= player.averageGuesses) return 'text-yellow-400';
    return 'text-gray-400';
  };

  if (!currentPlayer) return null;

  // Get this player's game history
  const allGames = loadGameHistory();
  const playerGames = allGames
    .filter((game) => game.playerId === currentPlayer.id && game.isComplete)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 10); // Last 10 games

  // Calculate performance trend
  const recentAverage =
    playerGames.slice(0, 5).reduce((sum, game) => sum + game.guesses.length, 0) /
    Math.min(5, playerGames.length);
  const olderAverage =
    playerGames.slice(5, 10).reduce((sum, game) => sum + game.guesses.length, 0) /
    Math.min(5, playerGames.length - 5);
  const trend =
    olderAverage && recentAverage
      ? (((olderAverage - recentAverage) / olderAverage) * 100).toFixed(0)
      : 0;
  const isImproving = Number(trend) > 0;

  // Get guess distribution
  const guessDistribution: Record<string, number> = {};
  playerGames.forEach((game) => {
    const guessCount = game.guesses.length;
    const key = guessCount <= 5 ? guessCount.toString() : '6+';
    guessDistribution[key] = (guessDistribution[key] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(guessDistribution), 1);

  return (
    <div className="space-y-6">
      {/* Recent Performance */}
      {playerGames.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Recent Performance</h3>

          {playerGames.length >= 3 && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Performance Trend</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-semibold ${isImproving ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {isImproving ? '↑' : '↓'} {Math.abs(Number(trend))}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {isImproving ? 'improving' : 'declining'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {playerGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex justify-between items-center p-2 bg-gray-800/30 rounded"
              >
                <span className="text-sm text-gray-400">
                  {new Date(game.completedAt!).toLocaleDateString()}
                </span>
                <span
                  className={`font-semibold ${getPerformanceTextClass(game.guesses.length, currentPlayer)}`}
                >
                  {game.guesses.length} guesses
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Guess Distribution */}
      {Object.keys(guessDistribution).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Guess Distribution</h3>
          <div className="space-y-3">
            {['1', '2', '3', '4', '5', '6+'].map((key) => {
              const count = guessDistribution[key] || 0;
              const percentage = (count / maxCount) * 100;

              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-8 text-right text-sm font-semibold">{key}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: Number(key[0]) * 0.1 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {count > 0 && count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Comparison with Others */}
      {players.length > 1 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Compare with Others</h3>
          <div className="space-y-3">
            {players
              .filter((p) => p.gamesPlayed > 0)
              .sort((a, b) => a.averageGuesses - b.averageGuesses)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    player.id === currentPlayer.id
                      ? 'bg-purple-900/20 border border-purple-500/30'
                      : 'bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                    <span
                      className={`font-semibold ${
                        player.id === currentPlayer.id ? 'text-purple-400' : 'text-gray-300'
                      }`}
                    >
                      {player.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{player.averageGuesses.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{player.gamesPlayed} games</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
