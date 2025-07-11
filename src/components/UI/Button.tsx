import { ReactNode, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonBaseProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

type ButtonProps = ButtonBaseProps & Omit<HTMLMotionProps<'button'>, keyof ButtonBaseProps>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }, ref) => {
    const baseStyles =
      'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 focus:ring-purple-500',
      secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500',
      ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 focus:ring-gray-500',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm min-h-[40px]', // Improved touch target
      md: 'px-5 py-2.5 text-base min-h-[44px]', // 44px is recommended minimum
      lg: 'px-6 py-3 text-lg min-h-[48px]',
    };

    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
