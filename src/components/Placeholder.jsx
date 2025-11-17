import Avatar from "boring-avatars";
import { VideoCameraSlashIcon } from "@heroicons/react/20/solid";
import { motion } from "motion/react";
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from "../helpers/animation";

function Placeholder({ userId, userName, isLocal }) {
  const name = userName || userId || "ivsuser-0";
  const displayName = isLocal ? `You (${name})` : name;

  return (
    <motion.div
      key={`${userId}-placeholder`}
      className="grid place-items-center w-full h-full"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={scaleMotionVariants}
      transition={scaleMotionTransitions}
    >
      <div className="flex flex-col justify-center items-center gap-y-2">
        <div className="relative w-16 h-16 flex justify-center items-center">
          <Avatar size={64} variant="beam" name={name} />
          <div className="absolute -bottom-0.5 -right-0.5 flex justify-center items-center p-1.5 rounded-full ring ring-surfaceAlt dark:ring-surface bg-surfaceAlt3">
            <VideoCameraSlashIcon className="size-3 text-uiText inline" />
          </div>
        </div>
        <span className="text-uiText">{displayName}</span>
      </div>
    </motion.div>
  );
}

export default Placeholder;
