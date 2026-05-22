// Temporary helper: add missing i18n sections to en.json
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const enPath = resolve(root, 'src/i18n/locales/en.json');

const en = JSON.parse(readFileSync(enPath, 'utf-8'));

// ─── help.faq ──────────────────────────────────────────────────────────
en.help.faq = {
  general: {
    whatIsMangaAura: {
      q: "What is MangaAura?",
      a: "MangaAura is a platform to discover, read and share manga. We offer an extensive manga library with online reading, achievement system, active community and creator tools."
    },
    isItFree: {
      q: "Is MangaAura free?",
      a: "Yes, most content is free. Some premium manga or exclusive features may require a subscription or Ink Coins, our virtual currency."
    },
    howToCreateAccount: {
      q: "How do I create an account?",
      a: "Click 'Sign Up' in the top right corner. You can register with email, Google or GitHub. You only need a username and email address."
    }
  },
  reading: {
    saveProgress: {
      q: "How do I save my reading progress?",
      a: "Your progress is automatically saved when you're logged in. Just click the read button and the system will remember where you left off."
    },
    offline: {
      q: "Can I read offline?",
      a: "Offline reading is not currently available, but it's a planned feature for future updates."
    },
    changeMode: {
      q: "How do I change reading mode?",
      a: "In the reader, use the settings menu (gear icon) to switch between single page, double page or continuous scroll reading."
    }
  },
  community: {
    followUsers: {
      q: "How do I follow other users?",
      a: "Visit the user's profile and click the \"Follow\" button. You'll receive notifications when they publish content or interact with you."
    },
    howClansWork: {
      q: "How do clans work?",
      a: "Clans are community groups organized by interests. You can join an existing clan or create your own to connect with other readers."
    },
    reportContent: {
      q: "How do I report inappropriate content?",
      a: "Use the report button that appears on each piece of content (manga, comment, profile) or visit our reports page to submit a detailed report."
    }
  },
  creators: {
    publishManga: {
      q: "How do I publish my manga on MangaAura?",
      a: "Go to \"Creator Dashboard\" from your profile menu and click \"Publish manga\". You can upload chapters, add covers and manage your entire work."
    },
    monetize: {
      q: "Can I monetize my manga?",
      a: "Yes, through our sponsorship system and Ink Coins. Readers can support you directly and you receive a share of the revenue."
    },
    formats: {
      q: "What image formats are accepted?",
      a: "We accept JPG, PNG and WebP. We recommend images at least 1200px wide for optimal reading quality."
    }
  },
  account: {
    recoverPassword: {
      q: "How do I recover my password?",
      a: "On the login page, click \"Forgot your password?\" and follow the instructions. You'll receive an email to reset it."
    },
    whatAreInkCoins: {
      q: "What are Ink Coins?",
      a: "They're MangaAura's virtual currency. You can use them to unlock premium chapters, support creators and buy special features."
    },
    deleteAccount: {
      q: "How do I delete my account?",
      a: "Go to Settings > Account and select \"Delete account\". Note that this action is irreversible and you will lose all your data."
    }
  },
  safety: {
    dataProtection: {
      q: "How do you protect my data?",
      a: "We use SSL encryption, secure authentication and comply with privacy regulations. You can review our privacy policy for more details."
    },
    blockUser: {
      q: "How do I block a user?",
      a: "Visit the user's profile, click the three dots and select \"Block\". They won't be able to message or interact with you."
    },
    harassment: {
      q: "What if I'm being harassed?",
      a: "Report the user immediately using the report function. Our moderation team will review the case within 24 hours. You can also block the user in the meantime."
    }
  }
};

// ─── userProfile ────────────────────────────────────────────────────────
en.userProfile = {
  stats: {
    mangas: "Mangas",
    following: "Following",
    achievements: "Achievements",
    streak: "Streak",
    streakDays: "{count} days",
    created: "Created"
  },
  roles: {
    admin: "Admin",
    moderator: "Moderator",
    creator: "Creator",
    verified: "Verified"
  },
  memberSince: "Member since {date}",
  levelAndXp: "Level {level} • {xp} XP",
  tabs: {
    activity: "Activity",
    reading: "Reading",
    achievements: "Achievements",
    created: "Created"
  },
  activity: {
    readChapter: "Read a chapter",
    followUser: "Followed a user",
    followManga: "Followed a manga",
    comment: "Commented",
    achievement: "Unlocked an achievement",
    createManga: "Published a manga",
    levelUp: "Leveled up",
    unfollowUser: "Unfollowed",
    unfollowManga: "Unfollowed a manga",
    shareManga: "Shared a manga"
  },
  timeLabels: {
    today: "Today",
    thisWeek: "This week",
    thisMonth: "This month",
    older: "Earlier"
  },
  mangaStatus: {
    ongoing: "Ongoing",
    completed: "Completed",
    paused: "Paused"
  },
  empty: {
    activity: {
      title: "No activity",
      description: "This user has no public activity yet"
    },
    reading: {
      title: "No recent reading",
      description: "This user has no reading records"
    },
    achievements: {
      title: "No achievements",
      description: "This user hasn't unlocked any achievements yet"
    }
  },
  buttons: {
    editProfile: "Edit profile",
    createAnother: "Create another"
  },
  readingProgress: "Reading progress: {percentage}%",
  caps: "chapters",
  views: "views",
  newBadge: "New"
};

// ─── contact additions ──────────────────────────────────────────────────
en.contact.form.sendErrorGeneric = "Error sending";

// ─── report additions ──────────────────────────────────────────────────
en.report.notLoggedIn = {
  title: "Log in to report",
  description: "You need an account to submit reports and track their status.",
  login: "Log in"
};
en.report.form.whatToReport = "What do you want to report?";
en.report.form.reportReason = "Report reason";
en.report.form.maxLengthError = "Description cannot exceed 1000 characters";
en.report.form.invalidUrl = "The evidence URL is not valid";
en.report.form.connectionError = "Connection error. Please try again.";
en.report.form.submitError = "Error submitting report";
en.report.disclaimerFull = "False or malicious reports may result in actions against your account. Only report content that truly violates our {terms}. Copyright reports must follow our {dmca}.";
en.report.termsOfService = "terms of service";
en.report.dmcaProcess = "DMCA process";

// ─── events additions ──────────────────────────────────────────────────
en.events.typeLabel = {
  artChallenge: "Art Challenge",
  speedReading: "Speed Reading", 
  community: "Community"
};

// ─── Write ──────────────────────────────────────────────────────────────
writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf-8');
console.log('✅ en.json updated successfully');
console.log('Top-level keys:', Object.keys(en).join(', '));
console.log('help.faq categories:', Object.keys(en.help.faq).join(', '));
console.log('userProfile keys:', Object.keys(en.userProfile).join(', '));
