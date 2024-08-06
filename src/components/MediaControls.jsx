import { useContext, useRef, useState } from 'react';
import {
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  MicrophoneIcon,
  UserPlusIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/20/solid';
import useMediaControls from '../hooks/useMediaControls';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
import Spacer from '../components/Spacer';
import MicrophoneSlashIcon from '../components/MicrophoneSlashIcon';
import { Button } from './Buttons';
import { StageContext } from '../contexts/StageContext';
import { ModalContext } from '../contexts/ModalContext';
import copyTextToClipboard from '../helpers/clipboard';
import useToast from '../hooks/useToast';
import Settings from './Settings';
import { Invite } from './Invite';

function MediaLoader() {
  return (
    <Button appearance={'default'} style='round' loading={true}>
      <VideoCameraSlashIcon className='w-5 h-5' />
    </Button>
  );
}

function MediaControls({ inviteLink, handleLeave, tooltipId }) {
  const { currentAudioDevice, currentVideoDevice, permissions } =
    useContext(LocalMediaContext);
  const { toggleDeviceMute, audioMuted, videoMuted } = useMediaControls({
    currentAudioDevice,
    currentVideoDevice,
  });
  const { stageJoined } = useContext(StageContext);
  const { modalOpen, setModalOpen, setModalContent } = useContext(ModalContext);
  const { showToast } = useToast();
  const [copyTooltipText, setCopyTooltipText] = useState('Copy invite link');
  const copyLinkTimeoutRef = useRef();

  function handleMicClick() {
    const deviceIsMuted = toggleDeviceMute(currentAudioDevice);
    const toastMessage = deviceIsMuted
      ? 'Microphone muted'
      : 'Microphone unmuted';
    showToast(toastMessage, 'SUCCESS', 'mic-toast');
  }

  function handleCamClick() {
    const deviceIsMuted = toggleDeviceMute(currentVideoDevice);
    const toastMessage = deviceIsMuted ? 'Camera disabled' : 'Camera enabled';
    showToast(toastMessage, 'SUCCESS', 'cam-toast');
  }

  function handleSettingsClick() {
    setModalContent(<Settings />);
    setModalOpen(!modalOpen);
  }

  function handleLeaveClick() {
    handleLeave();
  }

  function copyInviteLink() {
    const fullLink = window.location.origin + inviteLink;
    let copied = false;
    if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
    try {
      copyTextToClipboard(fullLink);
      showToast('Link copied to clipboard', 'SUCCESS', 'clipboard-toast');
      console.log('copied');
      setCopyTooltipText('Link copied');
      copied = true;
    } catch (err) {
      showToast(`Failed to copy link: ${fullLink}`, 'ERROR', 'clipboard-toast');
      setCopyTooltipText('Failed to copy link');
    } finally {
      copyLinkTimeoutRef.current = setTimeout(() => {
        resetCopyTooltipText();
      }, 2000);
    }
    return { link: fullLink, copied };
  }

  function handleInviteClick() {
    const { link } = copyInviteLink();
    setModalContent(<Invite link={link} copyLink={copyInviteLink} />);
    setModalOpen(!modalOpen);
  }

  function resetCopyTooltipText() {
    setCopyTooltipText('Copy invite link');
  }

  return (
    <div className='flex h-full md:h-auto md:flex-col gap-x-2 md:gap-y-2 p-2 items-center justify-center'>
      {stageJoined ? (
        <>
          <Button
            onClick={handleMicClick}
            appearance={audioMuted ? 'destruct' : 'default'}
            style='round'
            loading={!stageJoined || !permissions}
            data-tooltip-id={tooltipId}
            data-tooltip-content={audioMuted ? 'Unmute' : 'Mute'}
          >
            {audioMuted ? (
              <MicrophoneSlashIcon className='w-5 h-5' />
            ) : (
              <MicrophoneIcon className='w-5 h-5' />
            )}
          </Button>
          <Button
            onClick={handleCamClick}
            appearance={videoMuted ? 'destruct' : 'default'}
            style='round'
            loading={!stageJoined || !permissions}
            data-tooltip-id={tooltipId}
            data-tooltip-content={
              videoMuted ? 'Enable camera' : 'Disable camera'
            }
          >
            {videoMuted ? (
              <VideoCameraSlashIcon className='w-5 h-5' />
            ) : (
              <VideoCameraIcon className='w-5 h-5' />
            )}
          </Button>
          <Button
            onClick={handleSettingsClick}
            style='round'
            loading={!stageJoined}
            data-tooltip-id={tooltipId}
            data-tooltip-content='Settings'
          >
            <Cog6ToothIcon className='w-5 h-5' />
          </Button>
          <Button
            appearance={'positive'}
            style='tall'
            fullWidth={true}
            onClick={handleInviteClick}
            loading={!stageJoined}
            data-tooltip-id={tooltipId}
            data-tooltip-content={copyTooltipText}
          >
            <UserPlusIcon className='w-5 h-5 mx-2 md:my-2 md:mx-0' />
          </Button>
          <Spacer />
          <Button
            appearance={'destruct'}
            style='tall'
            fullWidth={true}
            onClick={handleLeaveClick}
            loading={!stageJoined}
            data-tooltip-id={tooltipId}
            data-tooltip-content='Leave session'
          >
            <ArrowLeftOnRectangleIcon className='w-5 h-5 mx-2 md:my-2 md:mx-0' />
          </Button>
        </>
      ) : (
        <MediaLoader />
      )}
    </div>
  );
}

export default MediaControls;
