import React from 'react';
import { motion } from 'framer-motion';
import { LeaderboardEntry as LeaderboardEntryType } from '../../types';

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  isCurrentPlayer: boolean;
  index: number;
}

export const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  entry,
  isCurrentPlayer,
  index,
}) => {
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        border-b border-gray-700 transition-colors
        ${isCurrentPlayer ? 'bg-purple-500/10' : 'hover:bg-gray-800/50'}
      `}
    >
      <td className="px-4 py-3 text-center">
        <span className="flex items-center justify-center gap-2">
          <span className={isCurrentPlayer ? 'text-purple-400 font-bold' : ''}>{entry.rank}</span>
          {getMedalEmoji(entry.rank)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={isCurrentPlayer ? 'text-purple-400 font-bold' : ''}>
          {entry.playerName}
          {isCurrentPlayer && ' (You)'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`
            font-semibold text-lg
            ${isCurrentPlayer ? 'text-purple-400' : 'text-green-400'}
          `}
        >
          {entry.averageGuesses.toFixed(1)}
        </span>
      </td>
    </motion.tr>
  );
};
