import { WIDGET_CSS } from "./styles.js";
import { AVATAR_DECORATIONS } from "@threadly/ui";
import { Comment, ThreadlyUser } from "@threadly/types";

export class ThreadlyCommentsElement extends HTMLElement {
  private shadow: ShadowRoot;
  private siteId: string = "";
  private pageId: string = "";
  private pageUrl: string = "";
  private apiUrl: string = "http://localhost:3000";
  private currentSort: "best" | "newest" = "best";
  private comments: Comment[] = [];
  private currentUser: ThreadlyUser | null = null;
  private isReplyingToId: string | null = null;
  private isEditingProfile: boolean = false;
  private isReportingCommentId: string | null = null;
  private isLoading: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["site-id", "page-id", "page-url", "api-url", "sort", "theme"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    if (name === "site-id") this.siteId = newValue;
    if (name === "page-id") this.pageId = newValue;
    if (name === "page-url") this.pageUrl = newValue;
    if (name === "api-url") this.apiUrl = newValue.replace(/\/+$/, "");
    if (name === "sort") this.currentSort = (newValue as any) || "best";

    if (this.isConnected && this.siteId) {
      this.fetchComments();
    }
  }

  connectedCallback() {
    this.siteId = this.getAttribute("site-id") || "";
    this.pageId = this.getAttribute("page-id") || "";
    this.pageUrl = this.getAttribute("page-url") || "";
    const customApi = this.getAttribute("api-url");
    if (customApi) {
      this.apiUrl = customApi.replace(/\/+$/, "");
    }

    this.checkSession().then(() => {
      this.fetchComments();
    });
  }

  public updatePage(params: { pageId?: string; pageUrl?: string }) {
    if (params.pageId) this.pageId = params.pageId;
    if (params.pageUrl) this.pageUrl = params.pageUrl;
    this.fetchComments();
  }

  public refresh() {
    this.fetchComments();
  }

  public openLogin() {
    this.handleDevLogin("kimchi");
  }

  public async logout() {
    try {
      await fetch(`${this.apiUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      this.currentUser = null;
      this.render();
      this.dispatchEvent(new CustomEvent("threadly:logout"));
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  private async checkSession() {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/users/me/profile`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        this.currentUser = json.data;
      } else {
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
  }

  private async fetchComments() {
    if (!this.siteId) return;
    this.isLoading = true;
    this.render();

    try {
      const query = new URLSearchParams();
      if (this.pageId) query.set("pageId", this.pageId);
      if (this.pageUrl) query.set("pageUrl", this.pageUrl);
      query.set("sort", this.currentSort);

      const res = await fetch(
        `${this.apiUrl}/api/v1/sites/${encodeURIComponent(this.siteId)}/comments?${query.toString()}`,
        { credentials: "include" }
      );

      if (res.ok) {
        const json = await res.json();
        this.comments = json.data.items || [];
      }
    } catch (err) {
      console.error("[Threadly Widget] Failed to fetch comments:", err);
    } finally {
      this.isLoading = false;
      this.render();
      this.dispatchEvent(new CustomEvent("threadly:ready"));
    }
  }

  private async handleDevLogin(username: string) {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        this.currentUser = json.data.user;
        this.render();
        this.dispatchEvent(
          new CustomEvent("threadly:login", { detail: this.currentUser })
        );
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  }

  private async submitComment(content: string, parentId: string | null = null) {
    if (!content.trim() || !this.siteId) return;

    try {
      const res = await fetch(
        `${this.apiUrl}/api/v1/sites/${encodeURIComponent(this.siteId)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            parentId,
            pageId: this.pageId,
            pageUrl: this.pageUrl || window.location.href,
          }),
          credentials: "include",
        }
      );

      const json = await res.json();
      if (res.ok && json.success) {
        this.isReplyingToId = null;
        await this.fetchComments();
        this.dispatchEvent(
          new CustomEvent("threadly:comment-created", { detail: json.data })
        );
      } else {
        alert(json.error?.message || "Failed to post comment");
      }
    } catch (err) {
      alert("Network error submitting comment");
    }
  }

  private async submitReport(commentId: string, reason: string, details?: string) {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/comments/${commentId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert("Report submitted to site moderators. Thank you.");
        this.isReportingCommentId = null;
        this.render();
      } else {
        alert(json.error?.message || "Failed to submit report");
      }
    } catch {
      alert("Network error reporting comment");
    }
  }

  private async saveProfile(data: { displayName: string; username: string; bio: string; avatarDecoration: string }) {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/users/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        this.currentUser = json.data;
        this.isEditingProfile = false;
        this.render();
      } else {
        alert(json.error?.message || "Failed to update profile");
      }
    } catch {
      alert("Failed to update profile");
    }
  }

  private getDecorationClass(decId?: string) {
    if (decId === "crimson-flame") return "avatar-ring-crimson";
    if (decId === "neon-cyan") return "avatar-ring-neon";
    if (decId === "gold-aura") return "avatar-ring-gold";
    if (decId === "void-purple") return "avatar-ring-purple";
    return "";
  }

  private formatTimeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private render() {
    this.shadow.innerHTML = `
      <style>${WIDGET_CSS}</style>
      <div class="threadly-container">
        <!-- Header -->
        <div class="threadly-header">
          <div class="threadly-title-wrap">
            <span class="threadly-title">Comments</span>
            <div class="threadly-sort-toggle">
              <button class="sort-btn ${this.currentSort === "best" ? "active" : ""}" id="btn-sort-best">Best</button>
              <button class="sort-btn ${this.currentSort === "newest" ? "active" : ""}" id="btn-sort-newest">Newest</button>
            </div>
          </div>
        </div>

        <!-- Auth Banner if logged out -->
        ${
          !this.currentUser
            ? `
          <div class="auth-banner">
            <div class="auth-headline">Be part of the discussion</div>
            <div class="auth-subline">Sign in to <strong>Threadly</strong>.</div>
            <div class="auth-buttons">
              <button class="btn-oauth" id="btn-google-login">
                <svg viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17.4C3.7 21.1 7.5 24 12 24z"/></svg>
                Continue with Google
              </button>
              <button class="btn-oauth" id="btn-discord-login">
                <svg viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                Continue with Discord
              </button>
            </div>
          </div>
        `
            : `
          <!-- User Status Bar -->
          <div class="user-status-bar">
            <div class="user-info" id="btn-edit-profile">
              <div class="user-avatar-wrap">
                <img src="${this.currentUser.avatarUrl}" class="user-avatar ${this.getDecorationClass(this.currentUser.avatarDecoration)}" alt="Avatar" />
              </div>
              <span class="signed-in-text">Signed in as <span class="signed-in-name">${this.currentUser.displayName}</span></span>
            </div>
            <button class="btn-signout-link" id="btn-logout">Sign Out</button>
          </div>
        `
        }

        <!-- Comment Composer -->
        <div class="composer-box">
          <textarea
            class="composer-textarea"
            id="root-composer-input"
            placeholder="${this.currentUser ? "Join the discussion..." : "Sign in above to join the discussion..."}"
            ${!this.currentUser ? "disabled" : ""}
          ></textarea>
          <div class="composer-toolbar">
            <div class="composer-actions">
              <button class="tool-icon-btn" title="Add GIF">GIF</button>
              <button class="tool-icon-btn" title="Attach image">📎</button>
              <span class="char-counter" id="root-composer-counter">0/2000</span>
            </div>
            <button class="btn-comment-submit" id="btn-root-comment-submit" ${!this.currentUser ? "disabled" : ""}>
              Comment
            </button>
          </div>
        </div>

        <!-- Comments Tree -->
        <div class="comment-tree">
          ${
            this.isLoading
              ? `<div class="empty-state">Loading comments...</div>`
              : this.comments.length === 0
              ? `<div class="empty-state">No comments.</div>`
              : this.comments.map((c) => this.renderCommentCard(c)).join("")
          }
        </div>

        <!-- Profile Modal matching Screenshot 2 -->
        ${
          this.isEditingProfile && this.currentUser
            ? `
          <div class="modal-overlay" id="profile-modal-overlay">
            <div class="modal-card">
              <button class="modal-close-btn" id="btn-close-profile">✕</button>
              
              <div class="profile-avatar-center">
                <img src="${this.currentUser.avatarUrl}" class="profile-avatar-img ${this.getDecorationClass(this.currentUser.avatarDecoration)}" alt="Avatar Preview" />
              </div>

              <div class="form-group">
                <label class="form-label">Display Name</label>
                <input type="text" class="form-input" id="modal-display-name" value="${this.currentUser.displayName}" />
              </div>

              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-input" id="modal-username" value="${this.currentUser.username}" />
              </div>

              <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea class="form-textarea" id="modal-bio" maxlength="500" placeholder="Say something about yourself...">${this.currentUser.bio || ""}</textarea>
                <div style="font-size: 11px; color: #71717a; text-align: right; margin-top: 4px;" id="modal-bio-counter">
                  ${(this.currentUser.bio || "").length}/500
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Avatar Decoration</label>
                <select class="form-select" id="modal-decoration-select">
                  ${AVATAR_DECORATIONS.map(
                    (d) => `<option value="${d.id}" ${this.currentUser?.avatarDecoration === d.id ? "selected" : ""}>${d.name} ${d.badge || ""}</option>`
                  ).join("")}
                </select>
              </div>

              <div class="modal-buttons-row">
                <button class="btn-modal-save" id="btn-save-profile">💾 Save</button>
                <button class="btn-modal-signout" id="btn-modal-signout">Sign Out</button>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Report Modal -->
        ${
          this.isReportingCommentId
            ? `
          <div class="modal-overlay" id="report-modal-overlay">
            <div class="modal-card">
              <button class="modal-close-btn" id="btn-close-report">✕</button>
              <h3 style="font-size: 16px; margin-bottom: 16px; color: #ffffff;">Report Comment</h3>
              <div class="form-group">
                <label class="form-label">Reason</label>
                <select class="form-select" id="report-reason-select">
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Hate">Hate Speech</option>
                  <option value="Sexual content">Sexual content</option>
                  <option value="Violence">Violence</option>
                  <option value="Spoiler">Spoiler</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Additional Details (optional)</label>
                <textarea class="form-textarea" id="report-details-input" placeholder="Explain why this content violates community guidelines..."></textarea>
              </div>
              <div class="modal-buttons-row">
                <button class="btn-modal-save" id="btn-submit-report">Submit Report</button>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    this.attachEvents();
  }

  private renderCommentCard(comment: Comment): string {
    const isOwner = this.currentUser && this.currentUser.id === comment.userId;
    return `
      <div class="comment-card" data-comment-id="${comment.id}">
        <div class="comment-avatar-col">
          <img
            src="${comment.author.avatarUrl}"
            class="user-avatar ${this.getDecorationClass(comment.author.avatarDecoration)}"
            alt="${comment.author.displayName}"
          />
        </div>
        <div class="comment-body">
          <div class="comment-header-row">
            <span class="author-name">${comment.author.displayName}</span>
            <span class="comment-time">${this.formatTimeAgo(comment.createdAt)}</span>
            ${comment.edited ? `<span class="edited-badge">(edited)</span>` : ""}
          </div>
          <div class="comment-text">${this.escapeHtml(comment.content)}</div>
          
          <div class="comment-actions-row">
            <button class="action-btn btn-reply-trigger" data-id="${comment.id}">Reply</button>
            <button class="action-btn report-btn btn-report-trigger" data-id="${comment.id}">Report</button>
          </div>

          <!-- Inline Reply Box -->
          ${
            this.isReplyingToId === comment.id
              ? `
            <div class="composer-box" style="margin-top: 12px; margin-bottom: 8px;">
              <textarea class="composer-textarea" id="reply-input-${comment.id}" placeholder="Replying to ${comment.author.displayName}..."></textarea>
              <div class="composer-toolbar">
                <button class="action-btn" id="btn-cancel-reply-${comment.id}">Cancel</button>
                <button class="btn-comment-submit" id="btn-submit-reply-${comment.id}">Reply</button>
              </div>
            </div>
          `
              : ""
          }

          <!-- Nested Replies -->
          ${
            comment.replies && comment.replies.length > 0
              ? `
            <div class="replies-container">
              ${comment.replies.map((reply) => this.renderReplyCard(reply)).join("")}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  private renderReplyCard(reply: Comment): string {
    return `
      <div class="comment-card" data-comment-id="${reply.id}">
        <div class="comment-avatar-col">
          <img
            src="${reply.author.avatarUrl}"
            class="user-avatar ${this.getDecorationClass(reply.author.avatarDecoration)}"
            style="width: 28px; height: 28px;"
            alt="${reply.author.displayName}"
          />
        </div>
        <div class="comment-body">
          <div class="comment-header-row">
            <span class="author-name">${reply.author.displayName}</span>
            <span class="comment-time">${this.formatTimeAgo(reply.createdAt)}</span>
          </div>
          <div class="comment-text">${this.escapeHtml(reply.content)}</div>
          <div class="comment-actions-row">
            <button class="action-btn report-btn btn-report-trigger" data-id="${reply.id}">Report</button>
          </div>
        </div>
      </div>
    `;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private attachEvents() {
    // Sort switch
    this.shadow.getElementById("btn-sort-best")?.addEventListener("click", () => {
      if (this.currentSort !== "best") {
        this.currentSort = "best";
        this.fetchComments();
      }
    });

    this.shadow.getElementById("btn-sort-newest")?.addEventListener("click", () => {
      if (this.currentSort !== "newest") {
        this.currentSort = "newest";
        this.fetchComments();
      }
    });

    // Auth actions
    this.shadow.getElementById("btn-google-login")?.addEventListener("click", () => {
      this.handleDevLogin("kimchi");
    });
    this.shadow.getElementById("btn-discord-login")?.addEventListener("click", () => {
      this.handleDevLogin("reader");
    });
    this.shadow.getElementById("btn-logout")?.addEventListener("click", () => {
      this.logout();
    });

    // Profile modal
    this.shadow.getElementById("btn-edit-profile")?.addEventListener("click", () => {
      this.isEditingProfile = true;
      this.render();
    });
    this.shadow.getElementById("btn-close-profile")?.addEventListener("click", () => {
      this.isEditingProfile = false;
      this.render();
    });
    this.shadow.getElementById("btn-modal-signout")?.addEventListener("click", () => {
      this.isEditingProfile = false;
      this.logout();
    });

    // Bio counter
    const bioTextarea = this.shadow.getElementById("modal-bio") as HTMLTextAreaElement | null;
    bioTextarea?.addEventListener("input", () => {
      const counterEl = this.shadow.getElementById("modal-bio-counter");
      if (counterEl) counterEl.textContent = `${bioTextarea.value.length}/500`;
    });

    // Save profile
    this.shadow.getElementById("btn-save-profile")?.addEventListener("click", () => {
      const displayName = (this.shadow.getElementById("modal-display-name") as HTMLInputElement)?.value || "";
      const username = (this.shadow.getElementById("modal-username") as HTMLInputElement)?.value || "";
      const bio = (this.shadow.getElementById("modal-bio") as HTMLTextAreaElement)?.value || "";
      const avatarDecoration = (this.shadow.getElementById("modal-decoration-select") as HTMLSelectElement)?.value || "none";

      this.saveProfile({ displayName, username, bio, avatarDecoration });
    });

    // Root Comment Submission
    const rootInput = this.shadow.getElementById("root-composer-input") as HTMLTextAreaElement | null;
    rootInput?.addEventListener("input", () => {
      const counter = this.shadow.getElementById("root-composer-counter");
      if (counter) counter.textContent = `${rootInput.value.length}/2000`;
    });

    this.shadow.getElementById("btn-root-comment-submit")?.addEventListener("click", () => {
      if (!this.currentUser) {
        this.openLogin();
        return;
      }
      if (rootInput && rootInput.value.trim()) {
        this.submitComment(rootInput.value.trim(), null);
        rootInput.value = "";
      }
    });

    // Reply triggers
    this.shadow.querySelectorAll(".btn-reply-trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this.currentUser) {
          this.openLogin();
          return;
        }
        const commentId = btn.getAttribute("data-id");
        this.isReplyingToId = this.isReplyingToId === commentId ? null : commentId;
        this.render();
      });
    });

    // Reply submits
    if (this.isReplyingToId) {
      const parentId = this.isReplyingToId;
      this.shadow.getElementById(`btn-cancel-reply-${parentId}`)?.addEventListener("click", () => {
        this.isReplyingToId = null;
        this.render();
      });

      this.shadow.getElementById(`btn-submit-reply-${parentId}`)?.addEventListener("click", () => {
        const input = this.shadow.getElementById(`reply-input-${parentId}`) as HTMLTextAreaElement | null;
        if (input && input.value.trim()) {
          this.submitComment(input.value.trim(), parentId);
        }
      });
    }

    // Report triggers
    this.shadow.querySelectorAll(".btn-report-trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this.currentUser) {
          this.openLogin();
          return;
        }
        this.isReportingCommentId = btn.getAttribute("data-id");
        this.render();
      });
    });

    this.shadow.getElementById("btn-close-report")?.addEventListener("click", () => {
      this.isReportingCommentId = null;
      this.render();
    });

    this.shadow.getElementById("btn-submit-report")?.addEventListener("click", () => {
      const reason = (this.shadow.getElementById("report-reason-select") as HTMLSelectElement)?.value || "Other";
      const details = (this.shadow.getElementById("report-details-input") as HTMLTextAreaElement)?.value || "";
      if (this.isReportingCommentId) {
        this.submitReport(this.isReportingCommentId, reason, details);
      }
    });
  }
}

if (!customElements.get("threadly-comments")) {
  customElements.define("threadly-comments", ThreadlyCommentsElement);
}
