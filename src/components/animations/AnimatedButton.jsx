import { motion } from 'framer-motion';

export function AnimatedButton({ children, className = '', as: Component = 'button', ...props }) {
  const Wrapper = Component === 'button' ? motion.button : motion.div;

  return (
    <Wrapper
      className={className}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </Wrapper>
  );
}
