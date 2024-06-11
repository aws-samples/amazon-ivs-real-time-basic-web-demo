import { motion } from 'framer-motion';

function SplitText({ text, ...props }) {
  const wordMotionVariants = {
    initial: {
      transition: { staggerChildren: 1, delayChildren: 0.2 },
    },
    default: {
      transition: { staggerChildren: 0.05, staggerDirection: 1 },
    },
  };

  const charMotionVariants = {
    initial: {
      y: 100,
      scale: 0.75,
    },
    default: {
      y: 0,
      scale: 1,
    },
  };

  return (
    <motion.span
      aria-hidden={true}
      className='inline-block'
      variants={wordMotionVariants}
      initial={'initial'}
      animate={'default'}
    >
      {text.split(' ').map((word, i) => (
        <motion.span
          aria-hidden={true}
          key={`split-${i}-${word}`}
          className='inline-block overflow-hidden'
          variants={wordMotionVariants}
        >
          {word.split('').map((char, i) => {
            return (
              <motion.span
                aria-hidden={true}
                key={`split-${i}-${char}`}
                variants={charMotionVariants}
                {...props}
              >
                {/* Wrap this in another span to fix kerning issues */}
                {'WV'.includes(char) ? (
                  <span
                    style={{
                      marginRight: '-0.06em',
                    }}
                  >
                    {char}
                  </span>
                ) : (
                  char
                )}
              </motion.span>
            );
          })}{' '}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default SplitText;
