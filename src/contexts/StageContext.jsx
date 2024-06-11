// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { createContext, useMemo } from 'react';
import useStage from '../hooks/useStage';

const StageContext = createContext({
  joinStage: undefined,
  participants: [],
  stageConnected: false,
  getSdkVersion: undefined,
});

// eslint-disable-next-line react/prop-types
function StageProvider({ children }) {
  const { joinStage, stageJoined, leaveStage, participants, getSdkVersion } =
    useStage();
  const state = useMemo(() => {
    return {
      joinStage,
      stageJoined,
      leaveStage,
      participants,
      getSdkVersion,
    };
  }, [joinStage, leaveStage, participants, stageJoined, getSdkVersion]);

  return (
    <StageContext.Provider value={state}>{children}</StageContext.Provider>
  );
}

export { StageContext };
export default StageProvider;
