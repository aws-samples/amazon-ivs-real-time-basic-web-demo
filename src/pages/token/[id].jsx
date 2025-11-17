import LocalMediaProvider from "../../contexts/LocalMediaContext";
import AudioFiltersProvider from "../../contexts/AudioFiltersContext";
import StageProvider from "../../contexts/StageContext";
import StageSession from "../../components/StageSession";
import ViewOnlyStageSession from "../../components/ViewOnlyStageSession";
import ModalProvider from "../../contexts/ModalContext";
import { useNavigate } from "../../router";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import LocalParticipantProvider from "../../contexts/LocalParticipantContext";

function Session() {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [token, setToken] = useState(state ? state.token : undefined);
  // eslint-disable-next-line no-unused-vars
  const [expiration, setExpiration] = useState(
    state ? state.expiration : undefined
  );
  // eslint-disable-next-line no-unused-vars
  const [hasPublish, setHasPublish] = useState(
    state ? state.hasPublish : undefined
  );

  useEffect(() => {
    if (token) return;
    navigate("/");
  }, [token, navigate]);

  // For view-only mode, we exclude LocalMediaProvider and LocalParticipantProvider
  // to avoid requesting camera/microphone permissions
  if (!hasPublish) {
    return (
      <AudioFiltersProvider>
        <StageProvider>
          <ModalProvider>
            {token !== undefined && (
              <ViewOnlyStageSession
                isTokenSession={true}
                pathname={pathname}
                token={token}
                expiration={expiration}
              />
            )}
          </ModalProvider>
        </StageProvider>
      </AudioFiltersProvider>
    );
  }

  // For participants with publish permissions, include all providers
  return (
    <LocalParticipantProvider>
      <AudioFiltersProvider>
        <LocalMediaProvider>
          <StageProvider>
            <ModalProvider>
              {token !== undefined && (
                <StageSession
                  isTokenSession={true}
                  pathname={pathname}
                  token={token}
                  expiration={expiration}
                />
              )}
            </ModalProvider>
          </StageProvider>
        </LocalMediaProvider>
      </AudioFiltersProvider>
    </LocalParticipantProvider>
  );
}

export default Session;
