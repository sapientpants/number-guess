import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { usePlayerStore } from '../../store/playerStore';
import { useLeaderboardStore } from '../../store/leaderboardStore';

interface PlayerProfileProps {
  onClose?: () => void;
  showSwitchButton?: boolean;
  onSwitchPlayer?: () => void;
}

export const PlayerProfile = ({
  onClose,
  showSwitchButton = true,
  onSwitchPlayer,
}: PlayerProfileProps) => {
  const { currentPlayer, players, selectPlayer } = usePlayerStore();
  const { getPlayerRank, updateLeaderboard } = useLeaderboardStore();

  // Update leaderboard when component mounts
  useEffect(() => {
    updateLeaderboard();
  }, [updateLeaderboard]);

  if (!currentPlayer) return null;

  const rank = getPlayerRank(currentPlayer.id);

  const stats = [
    {
      label: 'Games Played',
      value: currentPlayer.gamesPlayed,
      color: 'text-blue-400',
    },
    {
      label: 'Best Game',
      value: currentPlayer.bestGame || '-',
      color: 'text-green-400',
    },
    {
      label: 'Average Guesses',
      value: currentPlayer.averageGuesses > 0 ? currentPlayer.averageGuesses.toFixed(1) : '-',
      color: 'text-purple-400',
    },
    {
      label: 'Leaderboard Rank',
      value: rank ? `#${rank}` : '-',
      color: 'text-pink-400',
    },
  ];

  const winRate =
    currentPlayer.gamesPlayed > 0
      ? Math.round(((currentPlayer.gamesWon || 0) / currentPlayer.gamesPlayed) * 100)
      : 0;

  return (
    <Card gradient className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {currentPlayer.name}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Last played: {new Date(currentPlayer.lastPlayed).toLocaleDateString()}
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            ✕
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-4 bg-gray-800/50 rounded-lg"
          >
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {currentPlayer.gamesPlayed > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Win Rate</span>
            <span>{winRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${winRate}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            />
          </div>
        </div>
      )}

      {showSwitchButton && players.length > 1 && (
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400 mb-3">Switch to another player:</p>
          <div className="flex flex-wrap gap-2">
            {players
              .filter((p) => p.id !== currentPlayer.id)
              .map((player) => (
                <Button
                  key={player.id}
                  onClick={() => {
                    selectPlayer(player.id);
                    onSwitchPlayer?.();
                  }}
                  variant="ghost"
                  size="sm"
                >
                  {player.name}
                </Button>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};
