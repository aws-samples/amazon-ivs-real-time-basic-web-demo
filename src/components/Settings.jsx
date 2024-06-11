import Select from './Select';
import { useContext } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import { ModalContext } from '../contexts/ModalContext';
import { Button } from './Buttons';

function Settings() {
  const {
    audioDevices,
    videoDevices,
    updateLocalAudio,
    updateLocalVideo,
    currentAudioDeviceId,
    currentVideoDeviceId,
  } = useContext(LocalMediaContext);
  const { setModalOpen } = useContext(ModalContext);

  return (
    <div className='bg-surface w-96 px-5 pt-6 pb-8 rounded-xl overflow-hidden flex flex-col gap-2 text-uiText shadow-xl dark:shadow-black/80 ring-1 ring-surfaceAlt2/10'>
      <h3 id='title' className='text-md font-bold mb-4'>
        Settings
      </h3>
      <span id='full_description' className='hidden'>
        <p>Select the camera and microphone to use.</p>
      </span>
      <div className='flex flex-col gap-y-2 mb-4'>
        <Select
          options={videoDevices}
          onChange={updateLocalVideo}
          defaultValue={currentVideoDeviceId}
          title={'Camera'}
        />
        <Select
          options={audioDevices}
          onChange={updateLocalAudio}
          defaultValue={currentAudioDeviceId}
          title={'Microphone'}
        />
      </div>
      <Button
        appearance='primary'
        style='roundedText'
        fullWidth={true}
        onClick={() => setModalOpen(false)}
      >
        Done
      </Button>
    </div>
  );
}

export default Settings;
