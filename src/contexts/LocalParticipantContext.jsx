import { createContext, useMemo } from 'react';
import useLocalParticipant from '../hooks/useLocalParticipant';

const LocalParticipantContext = createContext({
  token: undefined,
  attributes: undefined,
  mirrored: undefined,
  stageParticipant: undefined,
});

function LocalParticipantProvider({ children }) {
  const {
    token,
    setToken,
    mirrored,
    setMirrored,
    attributes,
    setAttributes,
    stageParticipant,
    setStageParticipant,
  } = useLocalParticipant();

  const state = useMemo(() => {
    return {
      token,
      setToken,
      mirrored,
      setMirrored,
      attributes,
      setAttributes,
      stageParticipant,
      setStageParticipant,
    };
  }, [
    attributes,
    setAttributes,
    mirrored,
    setMirrored,
    setStageParticipant,
    setToken,
    stageParticipant,
    token,
  ]);

  return (
    <LocalParticipantContext.Provider value={state}>
      {children}
    </LocalParticipantContext.Provider>
  );
}

export default LocalParticipantProvider;
export { LocalParticipantContext };
