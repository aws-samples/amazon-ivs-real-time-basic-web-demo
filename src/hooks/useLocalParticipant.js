import { useCallback, useState } from 'react';

function useLocalParticipant() {
  const [token, setToken] = useState(undefined);
  const [mirrored, setMirrored] = useState(undefined);
  const [attributes, setAttributes] = useState(undefined);
  const [stageParticipant, setStageParticipant] = useState(undefined);

  const updateMirror = useCallback((isMirrored) => {
    setMirrored(isMirrored);
  }, []);

  const updateToken = useCallback((token) => {
    setToken(token);
  }, []);

  const updateAttributes = useCallback((attributes) => {
    setAttributes(attributes);
  }, []);

  const updateStageParticipant = useCallback((participant) => {
    // Create a new object to make sure that react picks up the state change
    const update = Object.assign({}, participant);
    setStageParticipant(update);
  }, []);

  return {
    token,
    mirrored,
    attributes,
    stageParticipant,
    setToken: updateToken,
    setMirrored: updateMirror,
    setAttributes: updateAttributes,
    setStageParticipant: updateStageParticipant,
  };
}

export default useLocalParticipant;
