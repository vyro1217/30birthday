export type BirthdayStep =
  | 'intro'
  | 'ready'
  | 'opening'
  | 'cosmic-core'
  | 'timeline-expand'
  | 'node-before'
  | 'node-us'
  | 'memory-1'
  | 'memory-2'
  | 'memory-3'
  | 'node-now'
  | 'title'
  | 'message'
  | 'message2'
  | 'final';

export interface BirthdayGiftPromptContent {
  hint: string;
  transition?: string;
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
  after: BirthdayStorySection;
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
