import { Navigate } from 'react-router-dom';
import { aiService } from '../services/aiService';

/** Sends /ai visitors straight into the default learn-mode chat. */
export function AIPage() {
  return <Navigate to={aiService.getLearnChatPath()} replace />;
}
