import { useState } from "react";
import { Button } from "./Buttons";
import { createSession } from "../sdk/Session";
import useToast from "../hooks/useToast";
import { NameInput } from "./NameInput";
import { createUsername } from "../helpers/username";
import { API_URL } from "../constants";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { ArrowUpRightIcon } from "@heroicons/react/20/solid";

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
          showToast("Invalid access code", "ERROR", "access-error-toast");
          setError(errorCode);
          break;
        default:
          showToast(
            "Could not create a session",
            "ERROR",
            "create-error-toast"
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
    <div className="bg-surface w-96 px-6 py-8 rounded-xl overflow-hidden flex flex-col gap-2 text-uiText/50 shadow-xl dark:shadow-black/80 ring-1 ring-surfaceAlt2/10">
      <h3 id="title" className="text-md font-bold text-uiText text-center mb-4">
        {!API_URL ? "Create a session" : "Enter your name"}
      </h3>
      <span id="full_description" className="hidden">
        <p>Enter a name to continue.</p>
      </span>
      {!API_URL && (
        <div className="mb-4 p-3 bg-warn/10 ring-1 ring-warn text-uiText rounded-lg text-sm">
          <span className="inline-flex gap-x-1">
            <ExclamationTriangleIcon className="size-6 text-warnAlt" />
            <h4 className="text-base font-bold">API_URL not found</h4>
          </span>
          <p className="text-pretty">
            An{" "}
            <code className="bg-warnAlt/20 px-1 py-0.5 rounded">API_URL</code>{" "}
            is required to create a session. Follow the instructions in the{" "}
            <a
              href="https://github.com/aws-samples/amazon-ivs-real-time-basic-web-demo/blob/main/infra/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex gap-x-0 items-center before:content-[''] before:absolute before:-inset-y-0.5 before:-inset-x-1 hover:before:bg-warnAlt/20 before:rounded"
            >
              README
              <span className="overflow-hidden">
                <ArrowUpRightIcon className="size-4 group-hover:animate-arrow-hover" />
              </span>
            </a>{" "}
            to get one.
          </p>
        </div>
      )}
      <form onSubmit={handleStart}>
        <div className="flex justify-center gap-x-2 mb-5">
          <NameInput
            placeholder=""
            inputValue={username}
            onChange={updateUsername}
            error={error}
            disabled={!API_URL}
          />
        </div>
        <Button
          appearance="primary"
          style="roundedText"
          fullWidth={true}
          loading={loading}
          disabled={username.length < 6 || !API_URL}
          type="submit"
        >
          Create session
        </Button>
      </form>
    </div>
  );
}
