import { useContext, useEffect } from "react";
import { ModalContext } from "../contexts/ModalContext";
import { AnimatedModal } from "./AnimatedModal";
import { JoinSession } from "./JoinSession";

export function JoinSessionDialog({
  username,
  handleChange,
  handleJoin,
  loading,
  error,
}) {
  const { modalOpen, setModalOpen } = useContext(ModalContext);

  useEffect(() => {
    setModalOpen(true);

    return () => {
      setModalOpen(false);
    };
  }, []);

  return (
    <main className="w-[100dvw] h-[100dvh] bg-surface dark:bg-surfaceAlt">
      <AnimatedModal isOpen={modalOpen} onRequestClose={() => null}>
        <JoinSession
          username={username}
          handleChange={handleChange}
          handleJoin={handleJoin}
          loading={loading}
          error={error}
        />
      </AnimatedModal>
    </main>
  );
}
