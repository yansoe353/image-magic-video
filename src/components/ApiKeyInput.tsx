
import GeminiApiKeyInput from "./GeminiApiKeyInput";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  // We now use only the GeminiApiKeyInput component since FAL API key is handled in the backend
  return <GeminiApiKeyInput onApiKeySet={onApiKeySet} />;
};

export default ApiKeyInput;
