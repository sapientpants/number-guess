import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerProfile } from './PlayerProfile';
import { PlayerLogin } from './PlayerLogin';

export const PlayerHeader = () => {
  const { currentPlayer, selectPlayer } = usePlayerStore();
  const [showFullView, setShowFullView] = useState(false);
  const [viewType, setViewType] = useState<'profile' | 'switch'>('profile');

  const handleShowProfile = () => {
    setViewType('profile');
    setShowFullView(true);
  };

  const handleSwitchPlayer = () => {
    // Clear current player first so PlayerLogin shows the selection screen
    selectPlayer('');
    setViewType('switch');
    setShowFullView(true);
  };

  // If no current player and not in switch mode, show player login
  if (!currentPlayer && !showFullView) {
    return <PlayerLogin />;
  }

  // If switching players, show player login but keep the structure
  if (showFullView && viewType === 'switch') {
    return (
      <div className="space-y-4">
        {/* Show a minimal header even when switching */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Switch Player</h3>
            <button
              onClick={() => {
                setShowFullView(false);
                // If we have players, select the first one
                const players = usePlayerStore.getState().players;
                if (players.length > 0 && !currentPlayer) {
                  selectPlayer(players[0]?.id || '');
                }
              }}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <PlayerLogin onPlayerSelected={() => setShowFullView(false)} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // If we somehow have no current player but aren't in switch mode, return null
  if (!currentPlayer) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Player Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              {currentPlayer.name.charAt(0).toUpperCase()}
            </div>

            {/* Player Info */}
            <div>
              <h3 className="font-semibold text-white">{currentPlayer.name}</h3>
              <div className="flex gap-3 text-sm text-gray-400">
                <span>Games: {currentPlayer.gamesPlayed}</span>
                <span>•</span>
                <span>
                  Avg:{' '}
                  {currentPlayer.averageGuesses > 0 ? currentPlayer.averageGuesses.toFixed(1) : '-'}
                </span>
                {currentPlayer.bestGame > 0 && (
                  <>
                    <span>•</span>
                    <span>Best: {currentPlayer.bestGame}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleShowProfile}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-all"
              aria-label="View full profile"
            >
              Profile
            </button>
            <button
              onClick={handleSwitchPlayer}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-all"
              aria-label="Switch player"
            >
              Switch
            </button>
          </div>
        </div>
      </motion.div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showFullView && viewType === 'profile' && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullView(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Profile Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="max-w-2xl w-full">
                <PlayerProfile
                  onClose={() => setShowFullView(false)}
                  showSwitchButton={true}
                  onSwitchPlayer={() => {
                    setShowFullView(false);
                    setTimeout(() => selectPlayer(''), 100);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
