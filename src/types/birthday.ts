export type BirthdayStep =
  | 'intro'
  | 'ready'
  | 'opening'
  | 'opening-bridge'
  | 'gift-ribbon'
  | 'cosmic-core'
  | 'timeline-expand'
  | 'story-gift'
  | 'node-before'
  | 'node-us'
  | 'memory-1'
  | 'memory-2'
  | 'memory-3'
  | 'memory-4'
  | 'memory-5'
  | 'node-now'
  | 'node-thirty-soft'
  | 'node-thirty-race'
  | 'title'
  | 'message'
  | 'message2'
  | 'final'
  | 'closing-gift';

export interface BirthdayGiftPromptContent {
  hint: string;
  transition?: string;
  bridgeText?: string;
}

export interface BirthdayStorySection {
  text: string;
}

export interface BirthdayPhotoSection {
  caption?: string;
  image?: string;
  imageAlt?: string;
}

export interface BirthdayMemoryMoment extends BirthdayPhotoSection {
  id: string;
  eyebrow?: string;
  pauseMs?: number;
}

export interface BirthdayBlessingSection {
  title: string;
  subtitle: string;
  reflection: string;
  wish: string;
}

export interface BirthdayClosingSection {
  text: string;
  hint?: string;
  doneText?: string;
  image?: string;
  imageAlt?: string;
}

export interface BirthdayBackgroundAudio {
  mode: 'off' | 'generated' | 'file';
  title?: string;
  fileSrc?: string;
}

export interface BirthdayUiCopy {
  bootLabel: string;
  litePromptEyebrow: string;
  openGiftAriaLabel: string;
  previousLabel: string;
  nextLabel: string;
  musicOnLabel: string;
  musicOffLabel: string;
}

export interface BirthdayPreviewContent {
  pageTitle: string;
  appTitle: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImageAlt: string;
  linePreviewText: string;
}

export interface BirthdayOpeningContent {
  introText: string;
  cardEyebrow: string;
  cardTitle: string;
  giftPrompt: BirthdayGiftPromptContent;
  revealCard: {
    eyebrow: string;
    title: string;
    body: string;
    confirmLabel: string;
  };
  photoLockedEyebrow: string;
  photoLockedText: string;
  photoUnlockedEyebrow: string;
  photoUnlockedText: string;
  faceIdIdleEyebrow: string;
  faceIdIdleText: string;
  faceIdScanningEyebrow: string;
  faceIdScanningText: string;
  faceIdUnlockedEyebrow: string;
  faceIdUnlockedText: string;
  featuredPhoto: {
    image: string;
    imageAlt: string;
  };
}

export interface BirthdayStoryContent {
  before: BirthdayStorySection;
  us: BirthdayPhotoSection & { text: string };
  memories: BirthdayMemoryMoment[];
  after: BirthdayStorySection & BirthdayPhotoSection;
  thirtySoft: BirthdayStorySection;
  thirtyRace: BirthdayStorySection;
}

export interface BirthdayContent {
  preview: BirthdayPreviewContent;
  ui: BirthdayUiCopy;
  backgroundAudio: BirthdayBackgroundAudio;
  opening: BirthdayOpeningContent;
  story: BirthdayStoryContent;
  blessing: BirthdayBlessingSection;
  closing: BirthdayClosingSection;
}
