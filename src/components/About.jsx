import { useContext } from 'react';
import { StageContext } from '../contexts/StageContext';
import { Button } from './Buttons';
import { AppIcon } from './AppIcon';
import { ModalContext } from '../contexts/ModalContext';

export function About() {
  const { getSdkVersion } = useContext(StageContext);
  const { setModalOpen } = useContext(ModalContext);
  return (
    <div className='grid grid-rows-[1fr_auto] w-full max-w-sm h-full gap-4 bg-surface rounded-xl text-uiText ring-1 ring-surfaceAlt2/10 shadow-xl dark:shadow-black/80'>
      <div className='p-6 pb-0 overflow-y-auto overflow-x-hidden'>
        <div className='flex flex-col items-center justify-center text-center gap-4'>
          <div className='w-24 h-24'>
            <AppIcon />
          </div>
          <h3>Amazon IVS Real-time Basic Web Demo</h3>
        </div>
        <div className='flex text-center flex-col'>
          <p className='text-sm mb-3 text-uiText/50'>
            SDK Version: {`${getSdkVersion().split('-')[0]}`}
          </p>
          <span className='text-sm mb-3 text-uiText/50'>
            View source code on{' '}
            <a
              href='https://github.com/aws-samples/amazon-ivs-real-time-basic-web-demo'
              target='_blank'
              rel='noreferrer noopener'
              className='text-uiText/50 hover:text-uiText underline underline-offset-1'
            >
              Github
            </a>
          </span>
          <p className='text-xs text-uiText/50'>
            For more demos, visit{' '}
            <a
              href='https://ivs.rocks/examples/'
              target='_blank'
              rel='noreferrer noopener'
              className='text-uiText/50 hover:text-uiText underline underline-offset-1'
            >
              ivs.rocks/examples
            </a>
          </p>
        </div>
      </div>
      <footer className='flex flex-col w-full items-center justify-center gap-4 p-6 pt-0'>
        <Button
          style='roundedText'
          fullWidth={true}
          onClick={() => setModalOpen(false)}
        >
          Close
        </Button>
      </footer>
    </div>
  );
}
