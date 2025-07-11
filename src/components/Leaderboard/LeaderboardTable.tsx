import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../UI/Card';
import { LeaderboardEntry } from './LeaderboardEntry';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { usePlayerStore } from '../../store/playerStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export const LeaderboardTable: React.FC = () => {
  const { entries, updateLeaderboard } = useLeaderboardStore();
  const { currentPlayer, players } = usePlayerStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    updateLeaderboard();
  }, [players, updateLeaderboard]);

  if (entries.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-400">
          <p>No players yet. Be the first to play!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card gradient>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label={isExpanded ? 'Collapse leaderboard' : 'Expand leaderboard'}
          >
            <svg
              className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Mobile: Show top 3 when collapsed */}
        <div className="lg:hidden">
          <AnimatePresence>
            {!isExpanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2">
                  {entries.slice(0, 3).map((entry, index) => (
                    <div
                      key={entry.playerId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        currentPlayer?.id === entry.playerId ? 'bg-purple-900/30' : 'bg-gray-800/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-bold">
                          {index + 1}. {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                        <span>{entry.playerName}</span>
                        {currentPlayer?.id === entry.playerId && (
                          <span className="text-xs text-purple-400">(You)</span>
                        )}
                      </div>
                      <span className="text-green-400 font-semibold">
                        {entry.averageGuesses.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop or expanded mobile view */}
        <AnimatePresence>
          {(isExpanded || isDesktop) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b-2 border-gray-700">
                      <th className="px-4 py-3 text-center">Rank</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3 text-center">Avg. Guesses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, 10).map((entry, index) => (
                      <LeaderboardEntry
                        key={entry.playerId}
                        entry={entry}
                        isCurrentPlayer={currentPlayer?.id === entry.playerId}
                        index={index}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {entries.length > 10 && (
                <div className="mt-4 text-center text-sm text-gray-400">
                  Showing top 10 players out of {entries.length}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
};
