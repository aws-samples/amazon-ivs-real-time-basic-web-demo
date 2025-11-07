import LocalMediaProvider from '../../contexts/LocalMediaContext';
import AudioFiltersProvider from '../../contexts/AudioFiltersContext';
import StageProvider from '../../contexts/StageContext';
import StageSession from '../../components/StageSession';
import ModalProvider from '../../contexts/ModalContext';
import { useNavigate, useParams } from '../../router';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { getSessionToken } from '../../sdk/Session';
import LocalParticipantProvider from '../../contexts/LocalParticipantContext';
import { JoinSessionDialog } from '../../components/JoinSessionDialog';
import { createUsername } from '../../helpers/username';

function Session() {
  const { id } = useParams('/session/:id');
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(state ? state.token : undefined);
  const [expiration, setExpiration] = useState(
    state ? state.expiration : undefined
  );
  const [username, setUsername] = useState(createUsername());
  const [error, setError] = useState(undefined);

  const [tokenPending, setTokenPending] = useState(false);
  async function getSessionDetails(username) {
    setTokenPending(true);
    try {
      const { token, expiration } = await getSessionToken(id, username);
      setToken(token);
      setExpiration(expiration);
    } catch (err) {
      console.error(err);
      var reason;
      const reasonType = 'ERROR';
      switch (err.response.status) {
        case 400:
          reason = 'Could not find that session';
          break;
        default:
          reason = 'Could not join the session';
          break;
      }
      navigate('/', { state: { reason, reasonType } });
    }
    setTokenPending(false);
  }

  function handleUsernameChange(e) {
    setUsername(e.target.value);
    setError(undefined);
  }

  return (
    <LocalParticipantProvider>
      <AudioFiltersProvider>
        <LocalMediaProvider>
          <StageProvider>
            <ModalProvider>
              {token !== undefined ? (
                <StageSession
                  pathname={pathname}
                  token={token}
                  expiration={expiration}
                />
              ) : (
                <JoinSessionDialog
                  username={username}
                  handleChange={handleUsernameChange}
                  handleJoin={getSessionDetails}
                  loading={tokenPending}
                  error={error}
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
