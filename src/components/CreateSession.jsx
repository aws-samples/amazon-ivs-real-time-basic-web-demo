import { useState } from 'react';
import { Button } from './Buttons';
import { createSession } from '../sdk/Session';
import useToast from '../hooks/useToast';
import { NameInput } from './NameInput';
import { createUsername } from '../helpers/username';

export function CreateSession({ handleSuccess }) {
  const [username, setUsername] = useState(createUsername());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const { showToast } = useToast();

  async function handleStart(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(undefined);

      // Create a stage
      const { sessionId, token, attributes, expiration } = await createSession({
        username,
      });

      handleSuccess({ sessionId, token, attributes, expiration });
    } catch (err) {
      const errorCode = err.response?.status || err.code;
      switch (errorCode) {
        case 403:
          showToast('Invalid access code', 'ERROR', 'access-error-toast');
          setError(errorCode);
          break;
        default:
          showToast(
            'Could not create a session',
            'ERROR',
            'create-error-toast'
          );
          setError(errorCode);
          break;
      }
      setLoading(false);
    }
  }

  const updateUsername = (e) => {
    setUsername(e.target.value);
    setError(undefined);
  };

  return (
    <div className='bg-surface w-96 px-6 py-8 rounded-xl overflow-hidden flex flex-col gap-2 text-uiText/50 shadow-xl dark:shadow-black/80 ring-1 ring-surfaceAlt2/10'>
      <h3 id='title' className='text-md font-bold text-uiText text-center mb-4'>
        Enter your name
      </h3>
      <span id='full_description' className='hidden'>
        <p>Enter a name to continue.</p>
      </span>
      <form onSubmit={handleStart}>
        <div className='flex justify-center gap-x-2 mb-5'>
          <NameInput
            placeholder=''
            inputValue={username}
            onChange={updateUsername}
            error={error}
          />
        </div>
        <Button
          appearance='primary'
          style='roundedText'
          fullWidth={true}
          loading={loading}
          disabled={username.length < 6}
          type='submit'
        >
          Create session
        </Button>
      </form>
    </div>
  );
}
