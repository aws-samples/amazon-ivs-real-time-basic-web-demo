import { useContext, useEffect } from 'react';
import { Button } from './Buttons';
import { useNavigate } from '../router';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useToast from '../hooks/useToast';
import { AnimatedModal } from './AnimatedModal';
import { ModalContext } from '../contexts/ModalContext';
import { CreateSession } from './CreateSession';

function StartScreen() {
  const { modalOpen, setModalOpen, modalContent, setModalContent } =
    useContext(ModalContext);
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const { showToast, removeToast } = useToast();

  function handleSuccess({ sessionId, token, attributes, expiration }) {
    navigate('/session/:id', {
      params: { id: sessionId },
      state: { token, attributes, expiration },
    });
  }

  function handleStart() {
    setModalContent(<CreateSession handleSuccess={handleSuccess} />);
    setModalOpen(true);
  }

  useEffect(() => {
    if (!state) return;

    const { reason, reasonType } = state;
    showToast(reason, reasonType, 'disconnect-toast');

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
      <main className='relative grid place-items-center w-[100dvw] h-[100dvh] text-uiText/50 p-6 bg-surface'>
        <div className='grid place-items-center'>
          <div className='flex flex-col w-full space-y-4 items-center'>
            <h1
              className='text-4xl font-black sm:text-5xl text-center whitespace-break-spaces text-uiText inline-block cursor-default select-none'
              aria-label='Welcome to Amazon IVS Real-time'
            >
              Amazon IVS Real-time
            </h1>
            <p className='mb-5 text-center'>
              Create a session to see and talk with up to 12 other participants
              in real-time.
            </p>
            <div className='sm:px-8 w-full max-w-[320px]'>
              <Button
                appearance='primary'
                style='roundedText'
                fullWidth={true}
                onClick={handleStart}
              >
                <span className='font-bold'>Create session</span>
              </Button>
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
