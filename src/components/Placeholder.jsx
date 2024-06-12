import { VideoCameraSlashIcon } from '@heroicons/react/20/solid';
import { motion } from 'framer-motion';
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from '../helpers/animation';

function Placeholder({ userId, userName }) {
  return (
    <motion.div
      key={`${userId}-placeholder`}
      className='grid place-items-center w-full h-full'
      initial='hidden'
      animate='visible'
      exit='hidden'
      variants={scaleMotionVariants}
      transition={scaleMotionTransitions}
    >
      <div className='flex flex-col justify-center items-center gap-y-2'>
        <div className='w-16 h-16 rounded-full bg-slate-800 flex justify-center items-center'>
          <VideoCameraSlashIcon className='w-8 h-8 text-white inline' />
        </div>
        <span className='text-uiText'>{userName}</span>
      </div>
    </motion.div>
  );
}

export default Placeholder;
