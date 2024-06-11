import { useContext } from 'react';
import { StageContext } from '../contexts/StageContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from '../helpers/animation';
import { RemoteParticipant } from './RemoteParticipant';

function RemoteParticipants({ tooltipId }) {
  const { participants } = useContext(StageContext);

  return (
    <>
      <AnimatePresence>
        {[...participants.keys()].map((key, i) => {
          return (
            <motion.div
              key={key}
              className={`slot-${i + 2}`}
              initial='hidden'
              animate='visible'
              exit='hidden'
              variants={scaleMotionVariants}
              transition={scaleMotionTransitions}
            >
              <RemoteParticipant
                tooltipId={tooltipId}
                {...participants.get(key)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}

export default RemoteParticipants;
