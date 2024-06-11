import { useContext } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext';

import { LocalParticipantContext } from '../contexts/LocalParticipantContext';

import Participant from './Participant';

const LocalParticipant = function LocalParticipant({ tooltipId }) {
  const { currentVideoDevice } = useContext(LocalMediaContext);
  const { stageParticipant } = useContext(LocalParticipantContext);

  const audioMuted = stageParticipant.audioMuted || false;
  const videoStopped = currentVideoDevice?.isMuted || false;
  const userName = stageParticipant.attributes.username || 'undefined';

  return (
    <Participant
      id={'You'}
      userId={'You'}
      userName={`You (${userName})`}
      isLocal={true}
      tooltipId={tooltipId}
      videoStopped={videoStopped}
      audioMuted={audioMuted}
      videoStream={currentVideoDevice}
      audioRef={undefined}
    />
  );
};

export default LocalParticipant;
