// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { SubscribeType } from 'amazon-ivs-web-broadcast';

export default class Strategy {
  _videoStream = undefined;
  _audioStream = undefined;
  _subscribeType = SubscribeType.NONE;

  constructor(
    audioStream,
    videoStream,
    subscribeType = SubscribeType.AUDIO_VIDEO
  ) {
    this._videoStream = videoStream;
    this._audioStream = audioStream;
    this._subscribeType = subscribeType;
  }

  updateMedia(audioStream, videoStream) {
    this._audioStream = audioStream;
    this._videoStream = videoStream;
  }

  stageStreamsToPublish() {
    return [this._videoStream, this._audioStream];
  }

  // eslint-disable-next-line no-unused-vars
  shouldPublishParticipant(participantInfo) {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  shouldSubscribeToParticipant(participantInfo) {
    return this._subscribeType;
  }
}
