import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { Game } from '../../types';

export const GameHistory = () => {
  const { loadGameHistory } = useGameStore();
  const { currentPlayer } = usePlayerStore();

  if (!currentPlayer) return null;

  const allGames = loadGameHistory();
  const playerGames = allGames
    .filter((game) => game.playerId === currentPlayer.id && game.isComplete)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  if (playerGames.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Game History</h3>
        <p className="text-center text-gray-400">
          No completed games yet. Play a game to see your history!
        </p>
      </Card>
    );
  }

  const formatDuration = (game: Game) => {
    if (!game.completedAt) return '';
    const duration = new Date(game.completedAt).getTime() - new Date(game.startedAt).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">
        Game History
        <span className="text-sm text-gray-400 ml-2">
          ({playerGames.length} {playerGames.length === 1 ? 'game' : 'games'})
        </span>
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {playerGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-sm text-gray-400">
                  {new Date(game.completedAt!).toLocaleDateString()}{' '}
                  {new Date(game.completedAt!).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    game.guesses.length <= currentPlayer.bestGame
                      ? 'text-green-400'
                      : game.guesses.length <= currentPlayer.averageGuesses
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                  }`}
                >
                  {game.guesses.length} {game.guesses.length === 1 ? 'guess' : 'guesses'}
                </p>
                <p className="text-xs text-gray-500">{formatDuration(game)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Target: {game.targetNumber}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">Guesses: {game.guesses.join(', ')}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
