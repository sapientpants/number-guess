import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { getColorForDistance, getTemperatureEmoji } from '../../utils/gameLogic';

export const GuessHistory = () => {
  const { guessResults } = useGameStore();

  if (guessResults.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p className="text-lg">No guesses yet</p>
        <p className="text-sm mt-2">Enter a number between 1 and 100</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Your Guesses</h3>
      <div className="flex-grow max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {[...guessResults].reverse().map((result, index) => (
            <motion.div
              key={`guess-${result.guess}-${guessResults.length - index - 1}`}
              layout
              initial={{ opacity: 0, x: -50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
                opacity: { duration: 0.2 },
              }}
              className={`p-3 rounded-lg bg-gradient-to-r ${getColorForDistance(result.distance, result.difference)} shadow-lg border border-gray-700/50 backdrop-blur-sm`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {getTemperatureEmoji(result.distance, result.difference)}
                  </span>
                  <span className="text-white font-bold text-xl">{result.guess}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {result.feedback === 'too-high'
                      ? '↓ Too High'
                      : result.feedback === 'too-low'
                        ? '↑ Too Low'
                        : '🎯 Correct!'}
                  </p>
                  <p className="text-xs text-gray-300 capitalize">
                    {result.feedback === 'correct' ? 'Perfect!' : result.distance}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
