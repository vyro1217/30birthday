import { getPublicAssetPath } from '../lib/assetPaths';
import { BirthdayContent } from '../types/birthday';

type BirthdayContentConfig = Omit<BirthdayContent, 'opening' | 'story'> & {
  opening: Omit<BirthdayContent['opening'], 'featuredPhoto'> & {
    featuredPhotoPath: string;
    featuredPhotoAlt: string;
  };
  story: {
    before: BirthdayContent['story']['before'];
    us: Omit<BirthdayContent['story']['us'], 'image'> & { imagePath: string };
    memories: Array<Omit<BirthdayContent['story']['memories'][number], 'image'> & { imagePath: string }>;
    after: BirthdayContent['story']['after'];
  };
};

export const birthdayCardContentConfig: BirthdayContentConfig = {
  preview: {
    pageTitle: 'Happy 30th Birthday',
    appTitle: 'Happy 30th',
    description: 'A small birthday card I made for you.',
    ogTitle: 'Happy 30th Birthday',
    ogDescription: 'A small birthday card I made for you.',
    ogImageAlt: 'Birthday card cover with a gift box and the text Happy 30th Birthday.',
    linePreviewText: 'A small birthday card I made for you.',
  },
  ui: {
    bootLabel: 'For you',
    litePromptEyebrow: 'For you',
    openGiftAriaLabel: 'Open birthday card',
    previousLabel: 'Back',
    nextLabel: 'Next',
    musicOnLabel: 'Music on',
    musicOffLabel: 'Music off',
  },
  backgroundAudio: {
    mode: 'generated',
    title: 'Soft background music',
  },
  opening: {
    introText:
      'I made this for you.\nJust a small birthday card, with a few moments I wanted to keep for us.',
    cardEyebrow: 'A small card for you',
    cardTitle: 'Happy 30th Birthday',
    giftPrompt: {
      hint: 'Tap the gift to open it',
      transition: 'Just one more moment.\nI want to show you something.',
    },
    photoLockedEyebrow: 'My Rita',
    photoLockedText: 'A little birthday card I made for you',
    photoUnlockedEyebrow: 'Only yours',
    photoUnlockedText: 'Kept close, for you.',
    faceIdIdleEyebrow: 'Face ID',
    faceIdIdleText: 'Look here to open your card',
    faceIdScanningEyebrow: 'Scanning',
    faceIdScanningText: 'Gently opening your card',
    faceIdUnlockedEyebrow: 'Welcome, Rita',
    faceIdUnlockedText: 'Opening your card',
    featuredPhotoPath: 'photos/rita.jpg',
    featuredPhotoAlt: 'A portrait of Rita',
  },
  story: {
    before: {
      text:
        'Thirty feels special to me because it holds so much of who you already are.\nNot in a dramatic way, just in the real way.\nYou have become someone warm, thoughtful, steady, and quietly strong.',
    },
    us: {
      imagePath: 'photos/photo-in-mrt.jpg',
      imageAlt: 'A close photo of us together on the MRT',
      text:
        'I love that so much of us looks like this.\nJust being beside each other, going somewhere ordinary, and somehow it already feels like one of the best parts of my life.',
    },
    memories: [
      {
        id: 'memory-1',
        imagePath: "photos/valentine's-day.jpg",
        eyebrow: 'A warm night',
        pauseMs: 4600,
        imageAlt: 'A dinner date photo of us smiling together',
        caption:
          'I still love photos like this because they feel simple and happy.\nNo performance, no big scene.\nJust you, me, good food, and that feeling of wanting the night to last a little longer.',
      },
      {
        id: 'memory-2',
        imagePath: 'photos/photo-with-traditional-cloths.jpg',
        eyebrow: 'One I really love',
        pauseMs: 5600,
        imageAlt: 'A photo of us dressed in traditional clothes together',
        caption:
          'This one always makes me smile.\nWe look dressed up, but what I remember most is how easy it felt to share that day with you.\nThat is something I keep coming back to with us.\nEven special moments still feel comfortable when I am with you.',
      },
      {
        id: 'memory-3',
        imagePath: 'photos/run-the-firsst-half-marathon.jpg',
        eyebrow: 'And this one too',
        pauseMs: 6600,
        imageAlt: 'A race-day photo of us after the half marathon',
        caption:
          'I wanted to keep this one in here because it reminds me that we are not only good at the soft moments.\nWe are also good at showing up, pushing through, and cheering each other on.\nI feel proud of you, and honestly really lucky that I get to be on your side.',
      },
    ],
    after: {
      text:
        'That is really what I wanted this little gift to hold.\nNot a big speech.\nJust a few real moments, and the truth that loving you has become such an important part of my life.',
    },
  },
  blessing: {
    title: 'Happy 30th Birthday',
    subtitle: 'A small note for your birthday',
    reflection:
      'You make life feel calmer, softer, and more meaningful.\n\nI admire how thoughtful you are, how much care you carry, and how naturally you make the people around you feel at ease.\n\nBeing with you has changed my life in quiet ways that matter a lot to me.',
    wish:
      'I hope your thirties bring you more confidence, more peace, and more of the life that truly fits you.\n\nI hope there are many more moments that make you proud of yourself.\n\nAnd selfishly, I hope I get to stay beside you for a lot more of them.',
  },
  closing: {
    text: 'Happy 30th birthday, baby.\nI love you.\nLove, always.',
  },
};

function createBirthdayContent(resolveAssetPath: (path: string) => string): BirthdayContent {
  return {
    ...birthdayCardContentConfig,
    opening: {
      ...birthdayCardContentConfig.opening,
      featuredPhoto: {
        image: resolveAssetPath(birthdayCardContentConfig.opening.featuredPhotoPath),
        imageAlt: birthdayCardContentConfig.opening.featuredPhotoAlt,
      },
    },
    story: {
      ...birthdayCardContentConfig.story,
      us: {
        ...birthdayCardContentConfig.story.us,
        image: resolveAssetPath(birthdayCardContentConfig.story.us.imagePath),
      },
      memories: birthdayCardContentConfig.story.memories.map((memoryMoment) => ({
        ...memoryMoment,
        image: resolveAssetPath(memoryMoment.imagePath),
      })),
    },
  };
}

export const birthdayContent = createBirthdayContent(getPublicAssetPath);
