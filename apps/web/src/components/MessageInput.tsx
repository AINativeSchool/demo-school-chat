import { useRef, useState, type FormEvent } from 'react';
import { ImagePlus, Send } from 'lucide-react';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../storage/constants';
import { NeonButton } from './NeonButton';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (payload: { content?: string; imageDataUrl?: string }) => void;
  disabled?: boolean;
}

/** Text and image input bar for chat threads. */
export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend({ content: text });
    setText('');
    setError('');
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onSend({ imageDataUrl: reader.result as string });
      setError('');
    };
    reader.readAsDataURL(file);

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      {error && <p className="error-text">{error}</p>}
      <div className="message-input__row">
        <button
          type="button"
          className="message-input__attach"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Attach image"
        >
          <ImagePlus size={20} />
        </button>
        <input
          type="file"
          ref={fileRef}
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          hidden
          onChange={handleImage}
        />
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <NeonButton type="submit" variant="cyan" className="message-input__send" disabled={disabled || !text.trim()}>
          <Send size={18} />
        </NeonButton>
      </div>
    </form>
  );
}
