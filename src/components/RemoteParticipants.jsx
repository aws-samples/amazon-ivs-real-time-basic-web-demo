import { useContext } from "react";
import { StageContext } from "../contexts/StageContext";
import { AnimatePresence, motion } from "motion/react";
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from "../helpers/animation";
import { RemoteParticipant } from "./RemoteParticipant";

function RemoteParticipants({ tooltipId, isViewOnly }) {
  const { participants } = useContext(StageContext);

  function getSlotName(slot, isViewOnly) {
    const calculatedSlot = isViewOnly ? slot + 1 : slot + 2;
    return `slot-${calculatedSlot}`;
  }

  return (
    <>
      <AnimatePresence>
        {[...participants.keys()].map((key, i) => {
          return (
            <motion.div
              key={key}
              className={getSlotName(i, isViewOnly)}
              initial="hidden"
              animate="visible"
              exit="hidden"
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
