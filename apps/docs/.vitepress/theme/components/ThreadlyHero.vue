<template>
  <div class="threadly-hero-container">
    <!-- Top Split Hero: Left Content + Right 3D Phone -->
    <div
      class="hero-split-grid"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      ref="heroRef"
    >
      <!-- Left Column: Branding, Copy, Buttons, Release Card -->
      <div class="hero-left-content">
        <h1 class="brand-title">Threadly</h1>
        <h2 class="hero-headline">Full-featured commenting platform</h2>
        <p class="hero-subtext">
          Discover and embed modern discussion threads into any blog, manga portal, comics, webtoon, or custom app — easier than ever on any device.
        </p>

        <!-- CTA Buttons -->
        <div class="hero-cta-row">
          <a href="./getting-started" class="btn-primary">Get started</a>
          <a href="./domains/troubleshooting" class="btn-secondary">Help center</a>
        </div>

        <!-- Release Card -->
        <div class="release-card">
          <div class="release-info">
            <span class="release-label">Latest stable release</span>
            <div class="release-version">Threadly v0.0.1</div>
            <span class="release-date">Released Sep 12, 2026</span>
          </div>

          <a href="./install-widget" class="release-download-btn">
            <!-- Material Download SVG Icon -->
            <svg class="mat-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
            </svg>
            <span>Install Widget</span>
          </a>
        </div>
      </div>

      <!-- Right Column: 3D Floating Smartphone Device Mockup with Radial Backlight -->
      <div class="hero-right-visual">
        <!-- Radial Back-Glow Aura -->
        <div class="phone-aura-glow"></div>

        <!-- 3D Smartphone Device -->
        <div class="phone-3d-stage" :style="phone3dStyle">
          <div class="phone-chassis">
            <!-- Hardware Details: Speaker & Camera Notch -->
            <div class="phone-notch">
              <span class="camera-lens"></span>
              <span class="speaker-grill"></span>
            </div>

            <!-- Phone Screen Content (Threadly Live Widget UI) -->
            <div class="phone-screen">
              <!-- Header Bar inside phone -->
              <div class="screen-header">
                <div class="screen-title-wrap">
                  <span class="screen-manga-title">Lookism • Ch. 500</span>
                  <span class="screen-domain-tag">mist-scans.threadly.com</span>
                </div>
                <div class="screen-status-badge">
                  <span class="dot-active"></span>
                  <span>Live</span>
                </div>
              </div>

              <!-- Stream of Comments inside phone -->
              <div class="phone-comments-list">
                <transition-group name="feed-anim">
                  <div
                    v-for="item in activeComments"
                    :key="item.id"
                    class="phone-comment-bubble"
                    :class="{ 'is-nested': item.isNested }"
                  >
                    <!-- User Avatar -->
                    <div class="phone-avatar-wrap" :class="item.avatarRing">
                      <img :src="item.avatar" :alt="item.author" class="phone-avatar-img" />
                    </div>

                    <!-- Comment Content -->
                    <div class="phone-comment-body">
                      <div class="phone-author-row">
                        <span class="phone-author-name">{{ item.author }}</span>
                        <span v-if="item.badge" class="phone-badge">{{ item.badge }}</span>
                        <span class="phone-time">{{ item.time }}</span>
                      </div>
                      <p class="phone-text">{{ item.text }}</p>

                      <!-- Reply Link -->
                      <div class="phone-actions-row">
                        <span class="phone-reply-action">
                          <!-- Material Reply SVG -->
                          <svg class="action-svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                          </svg>
                          Reply
                        </span>
                        <span v-if="item.replyCount" class="phone-reply-count">
                          {{ item.replyCount }} {{ item.replyCount === 1 ? 'reply' : 'replies' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </transition-group>
              </div>

              <!-- Interactive Input at bottom of phone -->
              <div class="phone-composer-bar">
                <input
                  v-model="inputReply"
                  @keyup.enter="handleUserComment"
                  placeholder="Leave a comment..."
                  class="phone-composer-input"
                />
                <button @click="handleUserComment" class="phone-send-btn">
                  <!-- Material Send SVG -->
                  <svg class="send-svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Feature Cards (3 columns) -->
    <div class="bottom-features-grid">
      <!-- Card 1: Shadow DOM Isolation -->
      <div class="feature-card">
        <div class="icon-container icon-green">
          <!-- Material Message / Chat SVG Icon -->
          <svg class="feature-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
          </svg>
        </div>
        <h3 class="feature-title">Shadow DOM Isolation</h3>
        <p class="feature-desc">
          Zero host CSS leakage. Host button styles will never destroy Threadly, and widget styles will never break your website.
        </p>
        <a href="./install-widget" class="feature-link">
          <span>Explore Widget</span>
          <span class="arrow-symbol">→</span>
        </a>
      </div>

      <!-- Card 2: Cloudflare SaaS Domains -->
      <div class="feature-card">
        <div class="icon-container icon-blue">
          <!-- Material Sliders / Tune SVG Icon -->
          <svg class="feature-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
          </svg>
        </div>
        <h3 class="feature-title">Cloudflare SaaS Domains</h3>
        <p class="feature-desc">
          Automatic *.threadly.com subdomains and one-click Custom Hostnames with free edge SSL provisioning.
        </p>
        <a href="./domains/overview" class="feature-link">
          <span>Domain setup</span>
          <span class="arrow-symbol">→</span>
        </a>
      </div>

      <!-- Card 3: Troubleshoot & Fix -->
      <div class="feature-card">
        <div class="icon-container icon-amber">
          <!-- Material Build / Troubleshoot SVG Icon -->
          <svg class="feature-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
          </svg>
        </div>
        <h3 class="feature-title">Troubleshoot & Fix</h3>
        <p class="feature-desc">
          Comprehensive diagnostics, DNS propagation checks, common error resolutions, and status guide.
        </p>
        <a href="./domains/troubleshooting" class="feature-link">
          <span>Troubleshooting guide</span>
          <span class="arrow-symbol">→</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const heroRef = ref(null);
const tiltX = ref(7);
const tiltY = ref(-14);
const inputReply = ref('');

const activeComments = ref([
  {
    id: 1,
    author: 'Aged Kimchi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    avatarRing: 'ring-rose',
    time: '2m ago',
    text: 'This chapter was crazy! The ending fight sequence had top tier art.',
    badge: 'Top Reader',
    replyCount: 1,
    isNested: false
  },
  {
    id: 2,
    author: 'Daniel Park',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=daniel',
    avatarRing: 'ring-cyan',
    time: '1m ago',
    text: 'Totally agree! Can not wait to see what happens next chapter.',
    badge: 'Verified',
    replyCount: 0,
    isNested: true
  },
  {
    id: 3,
    author: 'AstroDeveloper',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=astro',
    avatarRing: 'ring-gold',
    time: 'Just now',
    text: 'Integrated Threadly widget on our Astro site in 3 minutes. Clean Shadow DOM.',
    badge: 'Dev',
    replyCount: 0,
    isNested: false
  }
]);

const rotationPool = [
  {
    author: 'Elena Vance',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena',
    avatarRing: 'ring-rose',
    text: 'Cloudflare SaaS custom domain verified automatically in seconds!',
    badge: 'Owner'
  },
  {
    author: 'MangaFanatic',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=manga',
    avatarRing: 'ring-cyan',
    text: 'No reaction spam, just clean constructive chapter discussion.',
    badge: 'VIP'
  },
  {
    author: 'Jin Woo',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=jinwoo',
    avatarRing: 'ring-gold',
    text: 'Theme isolation works perfectly with our custom dark mode reader.',
    badge: 'Reader'
  }
];

let cycleIdx = 0;
let cycleTimer = null;

onMounted(() => {
  cycleTimer = setInterval(() => {
    if (activeComments.value.length >= 4) {
      activeComments.value.shift();
    }
    const item = rotationPool[cycleIdx % rotationPool.length];
    cycleIdx++;
    activeComments.value.push({
      id: Date.now(),
      author: item.author,
      avatar: item.avatar,
      avatarRing: item.avatarRing,
      time: 'Just now',
      text: item.text,
      badge: item.badge,
      replyCount: 0,
      isNested: Math.random() > 0.6
    });
  }, 4200);
});

onUnmounted(() => {
  if (cycleTimer) clearInterval(cycleTimer);
});

const handleMouseMove = (e) => {
  if (!heroRef.value) return;
  const rect = heroRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  tiltY.value = Math.max(-20, Math.min(20, (x / (rect.width / 2)) * 16));
  tiltX.value = Math.max(-16, Math.min(16, (-y / (rect.height / 2)) * 14));
};

const handleMouseLeave = () => {
  tiltX.value = 7;
  tiltY.value = -14;
};

const phone3dStyle = computed(() => ({
  transform: `rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`
}));

const handleUserComment = () => {
  if (!inputReply.value.trim()) return;
  activeComments.value.push({
    id: Date.now(),
    author: 'You (Guest)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=you',
    avatarRing: 'ring-cyan',
    time: 'Just now',
    text: inputReply.value.trim(),
    badge: 'Live',
    replyCount: 0,
    isNested: false
  });
  inputReply.value = '';
};
</script>

<style scoped>
.threadly-hero-container {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

/* 2-Column Split Hero Layout */
.hero-split-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 3rem;
  min-height: 520px;
}

/* Left Column */
.hero-left-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand-title {
  font-size: 3.8rem;
  font-weight: 800;
  color: #7079fe;
  line-height: 1.1;
  margin: 0 0 0.4rem;
  letter-spacing: -0.03em;
}

.hero-headline {
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  margin: 0 0 1.2rem;
  letter-spacing: -0.02em;
}

.hero-subtext {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #949bb0;
  max-width: 480px;
  margin: 0 0 2rem;
}

/* CTA Buttons */
.hero-cta-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.2rem;
}

.btn-primary {
  padding: 0.65rem 1.6rem;
  border-radius: 9999px;
  background: #5c65f6;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.25s ease;
  box-shadow: 0 4px 18px rgba(92, 101, 246, 0.4);
}

.btn-primary:hover {
  background: #4e57ec;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(92, 101, 246, 0.55);
}

.btn-secondary {
  padding: 0.65rem 1.6rem;
  border-radius: 9999px;
  background: #181a24;
  border: 1px solid #282b3c;
  color: #c0c6dc;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.25s ease;
}

.btn-secondary:hover {
  background: #202332;
  border-color: #383c54;
  color: #ffffff;
}

/* Release Card */
.release-card {
  width: 100%;
  max-width: 360px;
  background: #151722;
  border: 1px solid #242738;
  border-radius: 16px;
  padding: 1.1rem 1.3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.release-label {
  display: block;
  font-size: 0.7rem;
  color: #727992;
  margin-bottom: 0.2rem;
}

.release-version {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
}

.release-date {
  display: block;
  font-size: 0.7rem;
  color: #727992;
}

.release-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border-radius: 10px;
  background: #5c65f6;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.release-download-btn:hover {
  background: #4e57ec;
  transform: scale(1.03);
}

.mat-icon {
  width: 16px;
  height: 16px;
}

/* Right Column: 3D Phone Mockup */
.hero-right-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1200px;
}

/* Backlight Aura */
.phone-aura-glow {
  position: absolute;
  width: 340px;
  height: 480px;
  background: radial-gradient(circle, rgba(92, 101, 246, 0.35) 0%, rgba(112, 121, 254, 0.15) 45%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
}

/* 3D Phone Stage */
.phone-3d-stage {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.25s cubic-bezier(0.2, 0, 0.2, 1);
  will-change: transform;
}

.phone-chassis {
  width: 280px;
  height: 520px;
  background: #111218;
  border: 5px solid #282a3a;
  border-radius: 42px;
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8),
              0 0 30px rgba(92, 101, 246, 0.2),
              inset 0 0 4px rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Notch */
.phone-notch {
  width: 100%;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #111218;
  z-index: 10;
}

.camera-lens {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1e202c;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}

.speaker-grill {
  width: 42px;
  height: 3px;
  border-radius: 2px;
  background: #252838;
}

/* Screen */
.phone-screen {
  flex: 1;
  background: #0d0e14;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  overflow: hidden;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid #1c1e2c;
}

.screen-manga-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
}

.screen-domain-tag {
  display: block;
  font-size: 0.6rem;
  font-family: var(--vp-font-family-mono);
  color: #7079fe;
}

.screen-status-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  font-size: 0.6rem;
  font-weight: 700;
  color: #34d399;
}

.dot-active {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
}

/* Comments List inside Phone */
.phone-comments-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  overflow: hidden;
  margin: 0.6rem 0;
  mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
}

.phone-comment-bubble {
  display: flex;
  gap: 0.5rem;
  background: #14151e;
  border: 1px solid #202230;
  border-radius: 12px;
  padding: 0.5rem 0.6rem;
  transition: all 0.35s ease;
}

.phone-comment-bubble.is-nested {
  margin-left: 1.2rem;
  border-left: 2px solid #5c65f6;
  background: #161824;
}

.phone-avatar-wrap {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.phone-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.ring-rose::after {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: 50%;
  border: 1.5px solid #f43f5e;
}

.ring-cyan::after {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: 50%;
  border: 1.5px solid #38bdf8;
}

.ring-gold::after {
  content: "";
  position: absolute;
  inset: -1.5px;
  border-radius: 50%;
  border: 1.5px solid #fbbf24;
}

.phone-comment-body {
  flex: 1;
  min-width: 0;
}

.phone-author-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.15rem;
}

.phone-author-name {
  font-size: 0.65rem;
  font-weight: 700;
  color: #ffffff;
}

.phone-badge {
  font-size: 0.5rem;
  font-weight: 700;
  background: rgba(92, 101, 246, 0.18);
  color: #818cf8;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
}

.phone-time {
  font-size: 0.55rem;
  color: #727992;
  margin-left: auto;
}

.phone-text {
  font-size: 0.65rem;
  color: #c0c6dc;
  line-height: 1.35;
  margin: 0;
}

.phone-actions-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.phone-reply-action {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.55rem;
  font-weight: 600;
  color: #727992;
  cursor: pointer;
}

.action-svg {
  width: 9px;
  height: 9px;
}

.phone-reply-count {
  font-size: 0.55rem;
  color: #727992;
}

/* Phone Composer */
.phone-composer-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #151722;
  border: 1px solid #242738;
  border-radius: 9999px;
  padding: 0.25rem 0.35rem 0.25rem 0.75rem;
}

.phone-composer-input {
  flex: 1;
  background: none;
  border: none;
  font-size: 0.65rem;
  color: #ffffff;
  outline: none;
}

.phone-composer-input::placeholder {
  color: #5d6378;
}

.phone-send-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #5c65f6;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
}

.send-svg {
  width: 10px;
  height: 10px;
}

/* Bottom Features Grid */
.bottom-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 3.5rem;
}

.feature-card {
  background: #151722;
  border: 1px solid #242738;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: #383c54;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.icon-container {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
}

.icon-green {
  background: #182622;
  color: #34d399;
}

.icon-blue {
  background: #1a2234;
  color: #60a5fa;
}

.icon-amber {
  background: #2a2218;
  color: #fbbf24;
}

.feature-svg {
  width: 20px;
  height: 20px;
}

.feature-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem;
}

.feature-desc {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #949bb0;
  margin: 0 0 1.2rem;
  flex: 1;
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #7079fe;
  text-decoration: none;
  transition: color 0.2s;
}

.feature-link:hover {
  color: #8b92fe;
}

.arrow-symbol {
  transition: transform 0.2s ease;
}

.feature-link:hover .arrow-symbol {
  transform: translateX(3px);
}

/* Animations */
.feed-anim-enter-active,
.feed-anim-leave-active {
  transition: all 0.35s ease;
}

.feed-anim-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.feed-anim-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* Responsive */
@media (max-width: 860px) {
  .hero-split-grid {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2.5rem;
  }
  .hero-left-content {
    align-items: center;
  }
  .hero-subtext {
    text-align: center;
  }
  .bottom-features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
