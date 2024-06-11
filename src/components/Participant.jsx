import { useCallback, useState } from 'react';
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/20/solid';
import Video from './Video';
import { Button } from './Buttons';
import Placeholder from './Placeholder';
import MicrophoneSlashIcon from './MicrophoneSlashIcon';
import { AnimatePresence, motion } from 'framer-motion';
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from '../helpers/animation';

function Participant({
  id,
  userId,
  userName,
  isLocal,
  tooltipId,
  videoStopped,
  audioMuted,
  videoStream,
  audioStream,
}) {
  const [videoFilled, setVideoFilled] = useState(false);

  const updateAudioStream = useCallback(
    (elem) => {
      if (!audioStream || !elem) return;
      try {
        elem.srcObject = new MediaStream([audioStream.mediaStreamTrack]);
      } catch (err) {
        console.error(err);
      }
    },
    [audioStream]
  );

  function toggleVideoFill() {
    setVideoFilled(!videoFilled);
  }

  return (
    <div className='grid w-full h-full rounded-xl overflow-hidden relative ring-0 md:ring-1 md:ring-inset md:ring-surfaceAlt2/10 bg-surfaceAlt dark:bg-black'>
      {/* Video preview */}
      <div className='absolute flex justify-center inset-0 overflow-hidden'>
        <div className=' w-full h-full'>
          <AnimatePresence>
            {videoStopped ? (
              <Placeholder
                key={`${id}-${userId}`}
                userId={userId}
                userName={userName}
              />
            ) : (
              <Video
                videoFilled={videoFilled}
                videoStream={videoStream}
                userId={userId}
                key={`${id}-${userId}`}
                videoStopped={videoStopped}
              />
            )}
          </AnimatePresence>
          {!isLocal && <audio ref={updateAudioStream} autoPlay />}
        </div>
      </div>
      {/* Video overlay */}
      <div className='absolute grid place-items-center inset-0 overflow-hidden'>
        {/* Center bottom */}
        <div className='absolute bottom-6'>
          <div className='grid h-full place-items-end'>
            <div className='flex flex-col items-center justify-center gap-y-2'>
              <AnimatePresence>
                {audioMuted && (
                  <motion.div
                    key='muted'
                    className='inline-flex justify-center items-center px-4 py-1.5 rounded-full text-neutral-200 bg-neutral-900/80 backdrop-blur'
                    initial='hidden'
                    animate='visible'
                    exit='hidden'
                    variants={scaleMotionVariants}
                    transition={scaleMotionTransitions}
                  >
                    <MicrophoneSlashIcon className='w-4 h-4 relative -top-px' />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Top-Right */}
        <div className='absolute top-6 right-6'>
          {!videoStopped && (
            <Button
              onClick={toggleVideoFill}
              appearance='overlay'
              style='round'
              data-tooltip-id={tooltipId}
              data-tooltip-content={
                videoFilled ? 'Scale to fit' : 'Scale to fill'
              }
            >
              {videoFilled ? (
                <ArrowsPointingInIcon className='w-5 h-5' />
              ) : (
                <ArrowsPointingOutIcon className='w-5 h-5' />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Participant;
