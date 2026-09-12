export const WIDGET_CSS = `
:host {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #f4f4f5;
  background: #121214;
  border-radius: 12px;
  box-sizing: border-box;
  line-height: 1.5;
  font-size: 14px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.threadly-container {
  padding: 24px;
  background: #121214;
  border-radius: 12px;
  border: 1px solid #232328;
}

/* Header Area */
.threadly-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.threadly-title-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.threadly-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

.threadly-sort-toggle {
  display: inline-flex;
  background: #1e1e24;
  border-radius: 20px;
  padding: 3px;
  border: 1px solid #27272a;
}

.sort-btn {
  background: transparent;
  border: none;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-btn.active {
  background: #2e2e38;
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

/* Auth Banner (Logged Out) */
.auth-banner {
  background: #18181c;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 28px 24px;
  text-align: center;
  margin-bottom: 24px;
}

.auth-headline {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.auth-subline {
  font-size: 14px;
  color: #a1a1aa;
  margin-bottom: 20px;
}

.auth-subline strong {
  color: #ffffff;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  margin: 0 auto;
}

.btn-oauth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  background: #ffffff;
  color: #09090b;
  font-weight: 600;
  font-size: 14px;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
  text-decoration: none;
}

.btn-oauth:hover {
  transform: translateY(-1px);
  opacity: 0.94;
}

.btn-oauth svg {
  width: 18px;
  height: 18px;
}

/* User Status (Logged In) */
.user-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.user-info:hover {
  background: #1e1e24;
}

.user-avatar-wrap {
  position: relative;
  width: 36px;
  height: 36px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-ring-crimson {
  box-shadow: 0 0 0 2px #f43f5e, 0 0 10px rgba(244, 63, 94, 0.5);
}

.avatar-ring-neon {
  box-shadow: 0 0 0 2px #22d3ee, 0 0 10px rgba(34, 211, 238, 0.5);
}

.avatar-ring-gold {
  box-shadow: 0 0 0 2px #fbbf24, 0 0 10px rgba(251, 191, 36, 0.5);
}

.avatar-ring-purple {
  box-shadow: 0 0 0 2px #a855f7, 0 0 10px rgba(168, 85, 247, 0.5);
}

.signed-in-text {
  font-size: 13px;
  color: #a1a1aa;
}

.signed-in-name {
  color: #f43f5e;
  font-weight: 700;
}

.btn-signout-link {
  background: transparent;
  border: none;
  color: #71717a;
  font-size: 12px;
  cursor: pointer;
}

.btn-signout-link:hover {
  color: #e4e4e7;
  text-decoration: underline;
}

/* Composer */
.composer-box {
  background: #1a1a1e;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 24px;
}

.composer-textarea {
  width: 100%;
  min-height: 80px;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
}

.composer-textarea::placeholder {
  color: #71717a;
}

.composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #24242a;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-icon-btn {
  background: #232329;
  border: 1px solid #2e2e36;
  color: #9ca3af;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.tool-icon-btn:hover {
  background: #2b2b33;
  color: #ffffff;
}

.char-counter {
  font-size: 12px;
  color: #71717a;
}

.btn-comment-submit {
  background: #ffffff;
  color: #121214;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-comment-submit:hover:not(:disabled) {
  background: #f4f4f5;
  transform: translateY(-1px);
}

.btn-comment-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Comment List */
.comment-tree {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #71717a;
  font-size: 15px;
  font-weight: 500;
}

.comment-card {
  display: flex;
  gap: 14px;
}

.comment-avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.comment-body {
  flex: 1;
}

.comment-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.author-name {
  font-weight: 700;
  color: #ffffff;
  font-size: 13px;
}

.author-badge {
  font-size: 11px;
  background: #27272a;
  color: #a1a1aa;
  padding: 2px 6px;
  border-radius: 4px;
}

.comment-time {
  font-size: 12px;
  color: #71717a;
}

.edited-badge {
  font-size: 11px;
  color: #71717a;
  font-style: italic;
}

.comment-text {
  font-size: 14px;
  color: #d4d4d8;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
  line-height: 1.6;
}

.comment-actions-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  background: transparent;
  border: none;
  color: #a1a1aa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.15s ease;
}

.action-btn:hover {
  color: #ffffff;
}

.action-btn.report-btn:hover {
  color: #f87171;
}

/* Replies List */
.replies-container {
  margin-top: 14px;
  padding-left: 18px;
  border-left: 2px solid #27272a;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Modals (Profile & Report) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.modal-card {
  background: #18181c;
  border: 1px solid #27272a;
  border-radius: 16px;
  width: 90%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  position: relative;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: #a1a1aa;
  font-size: 18px;
  cursor: pointer;
}

.modal-close-btn:hover {
  color: #ffffff;
}

.profile-avatar-center {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.profile-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  background: #24242a;
  border: 1px solid #32323a;
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: #f43f5e;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-buttons-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-modal-save {
  background: #27272a;
  color: #ffffff;
  border: 1px solid #3f3f46;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-modal-save:hover {
  background: #3f3f46;
}

.btn-modal-signout {
  background: #f43f5e;
  color: #ffffff;
  border: none;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-modal-signout:hover {
  background: #e11d48;
}
`;
