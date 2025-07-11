import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { getMessageForFeedback } from '../../utils/gameLogic';

export const GameStats = () => {
  const { guesses, guessResults, gameStatus } = useGameStore();
  const { currentPlayer } = usePlayerStore();

  const lastGuess = guessResults[guessResults.length - 1];
  const message = lastGuess
    ? getMessageForFeedback(lastGuess.feedback, lastGuess.distance)
    : 'Make your first guess!';

  // Calculate the narrowed range based on feedback
  let minRange = 1;
  let maxRange = 100;

  guesses.forEach((guess, index) => {
    const result = guessResults[index];
    if (result) {
      if (result.feedback === 'too-high') {
        maxRange = Math.min(maxRange, guess - 1);
      } else if (result.feedback === 'too-low') {
        minRange = Math.max(minRange, guess + 1);
      }
    }
  });

  return (
    <div className="text-center space-y-4">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[60px] flex items-center justify-center"
      >
        <p className="text-xl text-gray-200">{message}</p>
      </motion.div>

      <div className="flex justify-center space-x-8">
        <div>
          <p className="text-gray-400 text-sm">Attempts</p>
          <motion.p
            key={guesses.length}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-purple-400"
          >
            {guesses.length}
          </motion.p>
        </div>

        {currentPlayer && currentPlayer.bestGame > 0 && (
          <div>
            <p className="text-gray-400 text-sm">Your Best</p>
            <p className="text-3xl font-bold text-pink-400">{currentPlayer.bestGame}</p>
          </div>
        )}

        {gameStatus === 'playing' && (
          <div>
            <p className="text-gray-400 text-sm">Range</p>
            <p className="text-lg font-semibold text-gray-300">
              {minRange} - {maxRange}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
