import {
  ArrowLeft,
  Bot,
  Calculator,
  CheckCheck,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import './AppShowcase.css';
import './ChatBubble.css';
import './ConversationList.css';
import './PersonalityCard.css';

/** Inline SVG used as a sample shared notes photo in the chat preview. */
const NOTE_IMAGE_SRC = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140" viewBox="0 0 220 140">
  <rect width="220" height="140" fill="#15202b"/>
  <rect x="12" y="10" width="196" height="120" rx="6" fill="#1e2d3d" stroke="#2f455c"/>
  <line x1="24" y1="34" x2="196" y2="34" stroke="#2f455c" stroke-width="1"/>
  <line x1="24" y1="52" x2="196" y2="52" stroke="#2f455c" stroke-width="1"/>
  <line x1="24" y1="70" x2="196" y2="70" stroke="#2f455c" stroke-width="1"/>
  <line x1="24" y1="88" x2="160" y2="88" stroke="#2f455c" stroke-width="1"/>
  <text x="24" y="28" fill="#7dffaf" font-family="system-ui,sans-serif" font-size="11" font-weight="600">Biology · Cell structure</text>
  <text x="24" y="48" fill="#c8d6e5" font-family="system-ui,sans-serif" font-size="9">Nucleus, mitochondria, cell wall</text>
  <text x="24" y="66" fill="#c8d6e5" font-family="system-ui,sans-serif" font-size="9">Diagram for lab tomorrow</text>
  <circle cx="178" cy="98" r="16" fill="none" stroke="#00f5ff" stroke-width="2"/>
  <text x="172" y="102" fill="#00f5ff" font-family="system-ui,sans-serif" font-size="10">✓</text>
</svg>
`)}`;

type NavTab = 'chats' | 'friends' | 'teacher' | 'settings';

interface ShowcasePhoneProps {
  caption: string;
  navActive: NavTab;
  children: ReactNode;
}

/** Wraps a single static phone frame for the landing page showcase. */
function ShowcasePhone({ caption, navActive, children }: ShowcasePhoneProps) {
  return (
    <article className="app-showcase__item">
      <p className="app-showcase__caption">{caption}</p>
      <div className="app-showcase__phone">
        <div className="app-showcase__screen">
          {children}
          <ShowcaseNav active={navActive} />
        </div>
      </div>
    </article>
  );
}

/** Mini bottom nav mirroring the real app tabs. */
function ShowcaseNav({ active }: { active: NavTab }) {
  return (
    <nav className="app-showcase__nav" aria-hidden="true">
      <span className={`app-showcase__nav-item ${active === 'chats' ? 'active' : ''}`}>
        <MessageCircle size={16} />
        <span>Chats</span>
      </span>
      <span className={`app-showcase__nav-item ${active === 'friends' ? 'active' : ''}`}>
        <Users size={16} />
        <span>Friends</span>
      </span>
      <span className={`app-showcase__nav-item ${active === 'teacher' ? 'active' : ''}`}>
        <Bot size={16} />
        <span>Teacher</span>
      </span>
      <span className={`app-showcase__nav-item ${active === 'settings' ? 'active' : ''}`}>
        <Settings size={16} />
        <span>Settings</span>
      </span>
    </nav>
  );
}

/** Static chats list screen for the landing page preview. */
function ChatsListScreen() {
  return (
    <>
      <header className="app-showcase__screen-header">
        <span className="app-showcase__screen-title">Chats</span>
      </header>
      <div className="app-showcase__search" aria-hidden="true">
        <Search size={14} />
        <span>Search chats</span>
      </div>
      <div className="app-showcase__list">
        <div className="conversation-row">
          <div className="avatar">P</div>
          <div className="conversation-row__body">
            <div className="conversation-row__top">
              <span className="conversation-row__name">Priya Sharma</span>
              <span className="conversation-row__time unread">10:42</span>
            </div>
            <div className="conversation-row__bottom">
              <span className="conversation-row__preview">Thanks! Saved me before the lab.</span>
              <span className="conversation-row__badge">2</span>
            </div>
          </div>
        </div>
        <div className="conversation-row">
          <div className="avatar">R</div>
          <div className="conversation-row__body">
            <div className="conversation-row__top">
              <span className="conversation-row__name">Rahul Mehta</span>
              <span className="conversation-row__time">Yesterday</span>
            </div>
            <div className="conversation-row__bottom">
              <span className="conversation-row__preview">You: See you in physics class</span>
            </div>
          </div>
        </div>
        <div className="conversation-row">
          <div className="avatar">A</div>
          <div className="conversation-row__body">
            <div className="conversation-row__top">
              <span className="conversation-row__name">Ananya Patel</span>
              <span className="conversation-row__time">Mon</span>
            </div>
            <div className="conversation-row__bottom">
              <span className="conversation-row__preview">Photo</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Static 1:1 chat screen with a shared image attachment. */
function ChatDetailScreen() {
  return (
    <>
      <header className="app-showcase__header">
        <span className="app-showcase__back" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <div className="app-showcase__avatar">P</div>
        <div className="app-showcase__header-info">
          <span className="app-showcase__name">Priya Sharma</span>
          <span className="app-showcase__status">Classmate · online</span>
        </div>
      </header>

      <div className="app-showcase__messages chat-messages chat-messages--wallpaper">
        <div className="chat-bubble other">
          <div className="chat-bubble__content">
            <p className="chat-bubble__text">Did you finish the biology assignment?</p>
            <div className="chat-bubble__footer">
              <span className="chat-bubble__time">10:38</span>
            </div>
          </div>
        </div>

        <div className="chat-bubble own">
          <div className="chat-bubble__content">
            <p className="chat-bubble__text">Almost done — sharing my notes from today&apos;s class.</p>
            <div className="chat-bubble__footer">
              <span className="chat-bubble__time">10:40</span>
              <CheckCheck size={14} className="chat-bubble__ticks read" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="chat-bubble own">
          <div className="chat-bubble__content">
            <img
              src={NOTE_IMAGE_SRC}
              alt=""
              className="chat-bubble__image app-showcase__note-image"
              aria-hidden="true"
            />
            <div className="chat-bubble__footer">
              <span className="chat-bubble__time">10:40</span>
              <CheckCheck size={14} className="chat-bubble__ticks read" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="chat-bubble other">
          <div className="chat-bubble__content">
            <p className="chat-bubble__text">Thanks! Saved me before the lab period.</p>
            <div className="chat-bubble__footer">
              <span className="chat-bubble__time">10:42</span>
            </div>
          </div>
        </div>
      </div>

      <div className="app-showcase__input" aria-hidden="true">
        <span>Type a message...</span>
      </div>
    </>
  );
}

/** Static Teacher tab home screen for the landing page preview. */
function TeacherHomeScreen() {
  return (
    <>
      <header className="app-showcase__screen-header">
        <span className="app-showcase__screen-title">Teacher</span>
      </header>
      <div className="app-showcase__teacher-body">
        <p className="teacher-ai-intro">Chat with your teacher&apos;s AI assistant</p>
        <div className="app-showcase__teacher-grid">
          <div className="personality-card" style={{ '--personality-accent': '#ff00aa' } as CSSProperties}>
            <div className="personality-card__icon">
              <Sparkles size={18} />
            </div>
            <div className="personality-card__body">
              <div className="personality-card__name">
                <span>Pradeep Sir</span>
              </div>
              <div className="personality-card__expertise">
                <span className="expertise-label" style={{ '--personality-accent': '#ff00aa' } as CSSProperties}>
                  AI
                </span>
                <span className="expertise-label" style={{ '--personality-accent': '#ff00aa' } as CSSProperties}>
                  Startups
                </span>
              </div>
            </div>
          </div>
          <div className="personality-card" style={{ '--personality-accent': '#39ff14' } as CSSProperties}>
            <div className="personality-card__icon">
              <Calculator size={18} />
            </div>
            <div className="personality-card__body">
              <div className="personality-card__name">
                <span>Praveen Sir</span>
              </div>
              <div className="personality-card__expertise">
                <span className="expertise-label" style={{ '--personality-accent': '#39ff14' } as CSSProperties}>
                  Math
                </span>
                <span className="expertise-label" style={{ '--personality-accent': '#39ff14' } as CSSProperties}>
                  Puzzles
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="app-showcase__teacher-hint">Available anytime — even when Sir is busy.</p>
      </div>
    </>
  );
}

/** Three-screen phone preview strip for the auth landing pages. */
export function AppShowcase() {
  return (
    <section className="app-showcase" aria-label="Sample app screens preview">
      <div className="app-showcase__phones">
        <ShowcasePhone caption="Your chats" navActive="chats">
          <ChatsListScreen />
        </ShowcasePhone>
        <ShowcasePhone caption="Share notes & photos" navActive="chats">
          <ChatDetailScreen />
        </ShowcasePhone>
        <ShowcasePhone caption="Teacher AI Twins" navActive="teacher">
          <TeacherHomeScreen />
        </ShowcasePhone>
      </div>
    </section>
  );
}
