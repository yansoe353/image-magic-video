
import GeminiApiKeyInput from "./GeminiApiKeyInput";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  // We now use the GeminiApiKeyInput component instead
  return <GeminiApiKeyInput onApiKeySet={onApiKeySet} />;
};

export default ApiKeyInput;
