import { useCallback, useContext, useEffect, useRef } from "react";
import useMount from "../hooks/useMount";
import { StageContext } from "../contexts/StageContext";
import { AudioFiltersContext } from "../contexts/AudioFiltersContext";
import { LocalMediaContext } from "../contexts/LocalMediaContext";
import LocalParticipant from "./LocalParticipant";
import RemoteParticipants from "./RemoteParticipants";
import Modal from "react-modal";
import MediaControls from "./MediaControls";
import { ModalContext } from "../contexts/ModalContext";
import Spinner from "./Spinner";
import { useNavigate } from "../router";
import toast, { Toaster } from "react-hot-toast";
import MonitoringToast from "./MonitoringToast";
import "./StageSession.css";
import { Tooltip } from "react-tooltip";
import { AnimatedModal } from "./AnimatedModal";
import { Button } from "./Buttons";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { About } from "./About";
import clsx from "clsx";

// Recommend binding Modal to root element (https://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");

function StageSessionLoading() {
  return (
    <div className="grid place-items-center rounded-xl overflow-hidden relative bg-black">
      <Spinner size="large" />
    </div>
  );
}

function StageSession({ pathname, token }) {
  const { modalOpen, setModalOpen, modalContent, setModalContent } =
    useContext(ModalContext);
  const { joinStage, stageJoined, leaveStage, participants } =
    useContext(StageContext);
  const { monitoringEnabled, toggleMonitoring, voiceFocusEnabled } =
    useContext(AudioFiltersContext);
  const { updateLocalAudio, currentAudioDeviceId } =
    useContext(LocalMediaContext);
  const navigate = useNavigate();
  const isMounted = useMount();
  const totalParticipants = participants ? participants.size : 0;
  const voiceFocusApplied = useRef(false);
  const monitoringWasEnabled = useRef(false);

  const gridClass = clsx("grid gap-2 md:py-2", {
    "grid-1": totalParticipants === 0,
    "grid-2": totalParticipants === 1,
    "grid-3": totalParticipants === 2,
    "grid-4": totalParticipants === 3,
    "grid-5": totalParticipants === 4,
    "grid-6": totalParticipants === 5,
    "grid-7": totalParticipants === 6,
    "grid-8": totalParticipants === 7,
    "grid-9": totalParticipants === 8,
    "grid-10": totalParticipants === 9,
    "grid-11": totalParticipants === 10,
    "grid-12": totalParticipants === 11,
  });

  const handleLeave = useCallback(
    (reason, reasonType) => {
      leaveStage();
      toast.remove(); // remove all toasts from the call before redirecting
      navigate("/", { state: { reason, reasonType } });
    },
    [leaveStage, navigate]
  );

  const handleAboutIcon = useCallback(() => {
    setModalContent(<About />);
    setModalOpen(true);
  }, [setModalContent, setModalOpen]);

  const initActive = useRef(false);
  useEffect(() => {
    if (!token) return;

    async function initSession() {
      initActive.current = true;
      if (isMounted()) await joinStage(token);
    }

    if (!initActive.current) initSession();
  }, [isMounted, joinStage, token]);

  // Apply Voice Focus after stage joins if it was pre-enabled in settings
  useEffect(() => {
    if (
      stageJoined &&
      voiceFocusEnabled &&
      !voiceFocusApplied.current &&
      currentAudioDeviceId
    ) {
      voiceFocusApplied.current = true;
      // Re-apply audio with Voice Focus enabled
      updateLocalAudio(currentAudioDeviceId, { useVoiceFocus: true });
      console.log("Applying Voice Focus after stage join");
    }
  }, [stageJoined, voiceFocusEnabled, currentAudioDeviceId, updateLocalAudio]);

  // Manage monitoring toast - show when monitoring is enabled, dismiss when disabled
  useEffect(() => {
    if (monitoringEnabled) {
      // Show persistent warning about feedback with disable button
      toast(
        () =>
          MonitoringToast({
            enabled: true,
            onDisable: () => toggleMonitoring(false),
          }),
        {
          id: "monitoring-status",
          duration: Infinity,
        }
      );
      monitoringWasEnabled.current = true;
    } else if (monitoringWasEnabled.current) {
      // Show toast when monitoring is disabled
      toast(
        () =>
          MonitoringToast({
            enabled: false,
            onEnable: () => toggleMonitoring(true),
          }),
        {
          id: "monitoring-status",
          duration: 4000,
        }
      );
    }
  }, [monitoringEnabled, toggleMonitoring]);

  return (
    <>
      <Toaster containerClassName="!inset-14 md:!inset-4" containerStyle={{}} />
      <Tooltip
        className="bg-surface/90 backdrop-blur-sm text-uiText ring-1 ring-border px-4 py-2 rounded-full absolute z-50 pointer-events-none max-sm:hidden"
        id="MediaControlsTooltip"
        place={"left"}
        noArrow={true}
        disableStyleInjection={true}
        opacity={1}
      />
      <main className="w-[100dvw] h-[100dvh] grid grid-rows-[minmax(0,_1fr)_72px] grid-cols-1 md:grid-rows-1 md:grid-cols-[72px_minmax(0,_1fr)_72px] bg-surface dark:bg-surfaceAlt">
        {/* Left bar */}
        <div className="hidden md:flex p-2 items-start justify-center">
          <Button
            onClick={handleAboutIcon}
            appearance={"default"}
            style="round"
            data-tooltip-id={"MediaControlsTooltip"}
            data-tooltip-content={"About this app"}
          >
            <InformationCircleIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Participant grid */}
        <div className={gridClass}>
          {stageJoined ? (
            <>
              <div className="slot-1">
                <LocalParticipant tooltipId={"MediaControlsTooltip"} />
              </div>
              <RemoteParticipants tooltipId={"MediaControlsTooltip"} />
            </>
          ) : (
            <StageSessionLoading />
          )}
        </div>
        {/* Right bar */}
        <div className="flex p-2 items-end justify-center">
          {/* Controls */}
          <MediaControls
            inviteLink={pathname}
            tooltipId={"MediaControlsTooltip"}
            handleLeave={() =>
              handleLeave("Successfully disconnected", "SUCCESS")
            }
          />
        </div>
      </main>
      <AnimatedModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      >
        {modalContent}
      </AnimatedModal>
    </>
  );
}

export default StageSession;
