import { useContext, useEffect } from "react";
import { Button } from "./Buttons";
import { useNavigate } from "../router";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useToast from "../hooks/useToast";
import { AnimatedModal } from "./AnimatedModal";
import { ModalContext } from "../contexts/ModalContext";
import { CreateSession } from "./CreateSession";
import ColorBends from "./ColorBends";
import { JoinSessionWithToken } from "./JoinSessionWithToken";

function StartScreen() {
  const { modalOpen, setModalOpen, modalContent, setModalContent } =
    useContext(ModalContext);
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const { showToast, removeToast } = useToast();

  function handleSuccess({ sessionId, token, attributes, expiration }) {
    navigate("/session/:id", {
      params: { id: sessionId },
      state: { token, attributes, expiration },
    });
  }

  function handleStart() {
    setModalContent(<CreateSession handleSuccess={handleSuccess} />);
    setModalOpen(true);
  }

  function handleJoinWithToken() {
    setModalContent(<JoinSessionWithToken handleSuccess={handleSuccess} />);
    setModalOpen(true);
  }

  useEffect(() => {
    if (!state) return;

    const { reason, reasonType } = state;
    showToast(reason, reasonType, "disconnect-toast");

    navigate(pathname, {});

    return () => {
      removeToast();
    };
    // Run once on mount and unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Toaster />
      {/* Animated background */}
      <div className="fixed w-[100dvw] h-[110dvh] pointer-events-none opacity-20 dark:opacity-50 bg-surface">
        <ColorBends
          rotation={73}
          autoRotate={1}
          speed={0.42}
          scale={1.6}
          frequency={1.1}
          warpStrength={1}
          mouseInfluence={0}
          parallax={0}
          noise={0.42}
          transparent
        />
      </div>
      <main className="relative grid place-items-center w-[100dvw] h-[100dvh] overflow-x-hidden text-uiText/50 p-6">
        <div className="relative grid place-items-center">
          {/* Center UI container */}
          <div className="relative w-full">
            <div className="absolute -inset-48 bg-[radial-gradient(ellipse_at_center,theme(colors.surface)_30%,transparent_70%)]"></div>
            <div className="relative w-fuull flex flex-col space-y-4 items-center">
              <h1
                className="text-4xl font-black sm:text-5xl text-center whitespace-break-spaces text-uiText inline-block cursor-default select-none"
                aria-label="Welcome to Amazon IVS Real-time"
              >
                Amazon IVS Real-time
              </h1>
              <p className="mb-5 text-center">
                Create a session to see and talk with up to 12 other
                participants in real-time.
              </p>
              <div className="flex flex-col gap-y-2 sm:px-8 w-full max-w-[320px]">
                <Button
                  appearance="primary"
                  style="roundedText"
                  fullWidth={true}
                  onClick={handleStart}
                >
                  <span className="font-bold">Create session</span>
                </Button>
                <Button
                  appearance="default"
                  style="roundedText"
                  fullWidth={true}
                  onClick={handleJoinWithToken}
                >
                  <span className="font-bold">Join with token</span>
                </Button>
              </div>
            </div>
          </div>
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

export default StartScreen;
