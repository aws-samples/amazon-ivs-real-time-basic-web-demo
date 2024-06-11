import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useCallback } from 'react';
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from '../helpers/animation';

function Video({ videoStream, videoFilled, userId }) {
  const streamId = videoStream && videoStream.id;
  const attachRef = useCallback(
    (elem) => {
      if (!videoStream || !elem) return;
      try {
        elem.srcObject = new MediaStream([videoStream.mediaStreamTrack]);
      } catch (err) {
        console.error(err);
      }
    },
    [videoStream]
  );

  const videoClass = clsx('w-full h-full', {
    'object-cover': videoFilled,
    'object-fit': !videoFilled,
  });

  return (
    <motion.video
      key={`${userId}-video-${streamId}`}
      className={videoClass}
      ref={attachRef}
      autoPlay
      playsInline
      initial='hidden'
      animate='visible'
      exit='hidden'
      variants={scaleMotionVariants}
      transition={scaleMotionTransitions}
    />
  );
}

export default Video;
