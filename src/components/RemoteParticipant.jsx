import { StreamType } from 'amazon-ivs-web-broadcast';
import Participant from './Participant';

export function RemoteParticipant({
  id,
  userId,
  attributes,
  videoStopped,
  audioMuted,
  streams,
  tooltipId,
}) {
  const videoStream = streams.find(
    (stream) => stream.streamType === StreamType.VIDEO
  );
  const audioStream = streams.find(
    (stream) => stream.streamType === StreamType.AUDIO
  );

  return (
    <Participant
      id={id}
      userId={userId}
      userName={attributes.username}
      isLocal={false}
      tooltipId={tooltipId}
      videoStopped={videoStopped}
      audioMuted={audioMuted}
      videoStream={videoStream}
      audioStream={audioStream}
    />
  );
}
