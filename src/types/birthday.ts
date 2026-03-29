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

export interface BirthdayIntroContent {
  message: string;
}

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

export interface BirthdayThirtySection {
  title: string;
  subtitle: string;
  reflection: string;
  wish: string;
}

export interface BirthdayFinalBlessing {
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

export interface BirthdayContent {
  ui: BirthdayUiCopy;
  backgroundAudio: BirthdayBackgroundAudio;
  intro: BirthdayIntroContent;
  giftPrompt: BirthdayGiftPromptContent;
  before: BirthdayStorySection;
  us: BirthdayPhotoSection & { text: string };
  memorySequence: BirthdayMemoryMoment[];
  afterMemory: BirthdayStorySection;
  thirtiethBirthday: BirthdayThirtySection;
  finalBlessing: BirthdayFinalBlessing;
}
