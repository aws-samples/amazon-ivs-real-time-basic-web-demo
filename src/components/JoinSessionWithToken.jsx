import { useState } from "react";
import { useClipboard } from "@custom-react-hooks/use-clipboard";
import { createSessionWithToken } from "../sdk/Session";
import { decodeJWT, isJWTExpired } from "../helpers/jwt";
import { Button } from "./Buttons";
import { TokenInput } from "./TokenInput";
import useToast from "../hooks/useToast";

export function JoinSessionWithToken({ handleSuccess }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const { showToast } = useToast();
  const { pasteFromClipboard } = useClipboard();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(undefined);

      // Decode the token
      const decodedToken = decodeJWT(token);

      // Check if token is not expired
      if (isJWTExpired(token)) {
        throw new Error("Token has expired");
      }

      const { sessionId, attributes, expiration } =
        createSessionWithToken(decodedToken);

      handleSuccess({ sessionId, token, attributes, expiration });
    } catch (err) {
      const errorMessage = err.message || "Could not join session";
      showToast(errorMessage, "ERROR", "join-error-toast");
      setError(errorMessage);
      setLoading(false);
    }
  }

  const updateToken = (e) => {
    setToken(e.target.value);
    setError(undefined);
  };

  async function handlePasteToken() {
    try {
      const pastedText = await pasteFromClipboard();
      if (pastedText && pastedText.trim()) {
        setToken(pastedText.trim());
        setError(undefined);
        showToast(
          "Token pasted from clipboard",
          "SUCCESS",
          "paste-success-toast"
        );
      } else {
        showToast("Clipboard is empty", "ERROR", "paste-error-toast");
      }
    } catch (err) {
      const errorMessage =
        "Failed to paste from clipboard. Please check clipboard permissions.";
      showToast(errorMessage, "ERROR", "paste-error-toast");
      setError(errorMessage);
    }
  }

  return (
    <div className="bg-surface w-96 px-6 py-8 rounded-xl overflow-hidden flex flex-col gap-2 text-uiText/50 shadow-xl dark:shadow-black/80 ring-1 ring-surfaceAlt2/10">
      <h3 id="title" className="text-md font-bold text-uiText text-center">
        Enter your participant token
      </h3>
      <span id="full_description" className="hidden">
        <p>Enter your participant token to continue.</p>
      </span>
      <span className="text-xs text-center text-pretty mb-4 text-uiTextAlt2">
        You can create a token through the AWS&nbsp;console or AWS&nbsp;CLI.{" "}
        <a
          href="https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/getting-started-distribute-tokens.html#getting-started-distribute-tokens-console"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary border-b border-secondary hover:border-b-2"
        >
          Learn more
        </a>
      </span>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-x-2 mb-5">
          <TokenInput
            placeholder="eyJ..."
            inputValue={token}
            onChange={updateToken}
            error={error}
          />
        </div>
        <div className="flex flex-col gap-y-3">
          <Button
            appearance="default"
            style="roundedText"
            fullWidth={true}
            type="button"
            onClick={handlePasteToken}
          >
            Paste token
          </Button>
          <Button
            appearance="primary"
            style="roundedText"
            fullWidth={true}
            loading={loading}
            disabled={token?.length < 6}
            type="submit"
          >
            Join session
          </Button>
        </div>
      </form>
    </div>
  );
}
