import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerProfile } from './PlayerProfile';

interface PlayerFormData {
  name: string;
}

interface PlayerLoginProps {
  onPlayerSelected?: () => void;
}

export const PlayerLogin = ({ onPlayerSelected }: PlayerLoginProps = {}) => {
  const { players, createPlayer, selectPlayer, currentPlayer } = usePlayerStore();
  const [isCreating, setIsCreating] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerFormData>();

  const onSubmit = (data: PlayerFormData) => {
    createPlayer(data.name);
    reset();
    setIsCreating(false);
    onPlayerSelected?.();
  };

  const handleSelectPlayer = (playerId: string) => {
    selectPlayer(playerId);
    onPlayerSelected?.();
  };

  if (currentPlayer && !showProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Welcome back!</h3>
            <p className="text-2xl font-bold text-purple-400 mb-4">{currentPlayer.name}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Games Played</p>
                <p className="text-xl font-semibold">{currentPlayer.gamesPlayed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Average Guesses</p>
                <p className="text-xl font-semibold">
                  {currentPlayer.averageGuesses > 0 ? currentPlayer.averageGuesses.toFixed(1) : '-'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowProfile(true)}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                View Full Profile
              </Button>
              <Button onClick={() => selectPlayer('')} variant="ghost" size="sm" className="flex-1">
                Switch Player
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (showProfile && currentPlayer) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <PlayerProfile onClose={() => setShowProfile(false)} showSwitchButton={true} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-center">
        {isCreating ? 'Create New Player' : 'Select Player'}
      </h3>

      {!isCreating ? (
        <>
          {players.length > 0 ? (
            <div className="space-y-2 mb-4">
              {players
                .sort((a, b) => {
                  // Sort by last played, most recent first
                  return new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime();
                })
                .map((player, index) => (
                  <motion.button
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectPlayer(player.id)}
                    className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold group-hover:text-purple-400 transition-colors">
                          {player.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {player.gamesPlayed} games • Avg:{' '}
                          {player.averageGuesses > 0 ? player.averageGuesses.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(player.lastPlayed).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.button>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 mb-4">
              No players yet. Create one to start playing!
            </p>
          )}

          <Button onClick={() => setIsCreating(true)} variant="secondary" className="w-full">
            Create New Player
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('name', {
                required: 'Please enter your name',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
                maxLength: {
                  value: 20,
                  message: 'Name must be less than 20 characters',
                },
              })}
              type="text"
              placeholder="Enter your name"
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-700'
              }`}
              autoFocus
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Create Player
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
