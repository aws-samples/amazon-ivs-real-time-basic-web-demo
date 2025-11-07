import { useCallback, useState, useContext, useEffect, useRef } from "react";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/20/solid";
import Video from "./Video";
import { Button } from "./Buttons";
import Placeholder from "./Placeholder";
import MicrophoneSlashIcon from "./MicrophoneSlashIcon";
import { AnimatePresence, motion } from "motion/react";
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from "../helpers/animation";
import { AudioFiltersContext } from "../contexts/AudioFiltersContext";

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
  const audioElementRef = useRef(null);
  const filterAppliedRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const {
    normalizeOutputEnabled,
    applyOutputNormalization,
    removeOutputNormalization,
  } = useContext(AudioFiltersContext);

  const updateAudioStream = useCallback(
    (elem) => {
      if (!audioStream || !elem) return;

      audioElementRef.current = elem;

      try {
        // Create or reuse MediaStream to ensure consistency
        if (
          !mediaStreamRef.current ||
          mediaStreamRef.current.getTracks()[0] !== audioStream.mediaStreamTrack
        ) {
          mediaStreamRef.current = new MediaStream([
            audioStream.mediaStreamTrack,
          ]);
        }
        // Set the srcObject for the audio element
        elem.srcObject = mediaStreamRef.current;
      } catch (err) {
        console.error(err);
      }
    },
    [audioStream]
  );

  // Apply/remove normalization when the setting changes or when audio stream changes
  // This handles both toggling the setting and when participants join
  useEffect(() => {
    if (isLocal || !audioStream) return;

    const handleFilterToggle = async () => {
      if (normalizeOutputEnabled && !filterAppliedRef.current) {
        // Setting is ON - apply normalization using the audio track directly
        try {
          console.log(`Applying normalization for participant ${id}`);
          // Ensure any existing chain is cleaned up first (defensive)
          removeOutputNormalization(id);
          // Use the same MediaStream that the audio element is using
          await applyOutputNormalization(audioStream.mediaStreamTrack, id);
          filterAppliedRef.current = true;
        } catch (error) {
          console.error("Error applying output normalization:", error);
        }
      } else if (!normalizeOutputEnabled && filterAppliedRef.current) {
        // Setting was turned OFF - remove normalization
        console.log(`Removing normalization for participant ${id}`);
        removeOutputNormalization(id);
        filterAppliedRef.current = false;

        // Resume audio playback through the audio element
        // When we switch from Web Audio API back to native playback,
        // we need to refresh the audio element's srcObject and ensure playback
        if (audioElementRef.current && mediaStreamRef.current) {
          console.log(`Resuming native audio playback for participant ${id}`);
          // Use a small timeout to ensure the Web Audio chain is fully disconnected
          setTimeout(() => {
            if (audioElementRef.current && mediaStreamRef.current) {
              // Refresh the srcObject to ensure the audio element takes control
              audioElementRef.current.srcObject = null;
              audioElementRef.current.srcObject = mediaStreamRef.current;

              // Explicitly start playback
              audioElementRef.current.play().catch((error) => {
                console.error("Error resuming audio playback:", error);
              });
            }
          }, 100);
        }
      }
    };

    handleFilterToggle();
  }, [
    normalizeOutputEnabled,
    isLocal,
    audioStream,
    id,
    applyOutputNormalization,
    removeOutputNormalization,
  ]);

  // Cleanup on unmount or when participant leaves
  useEffect(() => {
    return () => {
      if (!isLocal && filterAppliedRef.current) {
        removeOutputNormalization(id);
        filterAppliedRef.current = false;
      }
    };
  }, [isLocal, id, removeOutputNormalization]);

  function toggleVideoFill() {
    setVideoFilled(!videoFilled);
  }

  return (
    <div className="grid w-full h-full rounded-xl overflow-hidden relative ring-0 md:ring-1 md:ring-inset md:ring-surfaceAlt2/10 bg-surfaceAlt dark:bg-black">
      {/* Video preview */}
      <div className="absolute flex justify-center inset-0 overflow-hidden">
        <div className=" w-full h-full">
          <AnimatePresence>
            {videoStopped ? (
              <Placeholder
                key={`${id}-${userId}`}
                isLocal={isLocal}
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
          {!isLocal && (
            <audio
              ref={updateAudioStream}
              autoPlay
              muted={normalizeOutputEnabled}
            />
          )}
        </div>
      </div>
      {/* Video overlay */}
      <div className="absolute grid place-items-center inset-0 overflow-hidden">
        {/* Center bottom */}
        <div className="absolute bottom-6">
          <div className="grid h-full place-items-end">
            <div className="flex flex-col items-center justify-center gap-y-2">
              <AnimatePresence>
                {audioMuted && (
                  <motion.div
                    key="muted"
                    className="inline-flex justify-center items-center px-4 py-1.5 rounded-full text-neutral-200 bg-neutral-900/80 backdrop-blur"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={scaleMotionVariants}
                    transition={scaleMotionTransitions}
                  >
                    <MicrophoneSlashIcon className="w-4 h-4 relative -top-px" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Top-Right */}
        <div className="absolute top-6 right-6">
          {!videoStopped && (
            <Button
              onClick={toggleVideoFill}
              appearance="overlay"
              style="round"
              data-tooltip-id={tooltipId}
              data-tooltip-content={
                videoFilled ? "Scale to fit" : "Scale to fill"
              }
            >
              {videoFilled ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Participant;
