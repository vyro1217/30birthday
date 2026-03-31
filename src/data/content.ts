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
    after: Omit<BirthdayContent['story']['after'], 'image'> & { imagePath?: string };
    thirtySoft: BirthdayContent['story']['thirtySoft'];
    thirtyRace: BirthdayContent['story']['thirtyRace'];
  };
  closing: Omit<BirthdayContent['closing'], 'image'> & { imagePath?: string };
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
    bootLabel: 'A little note for you',
    litePromptEyebrow: 'A little note for you',
    openGiftAriaLabel: 'Open her birthday gift',
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
      'For your 30th, I want to open it with my own hands.',
    cardEyebrow: 'Tap to open',
    cardTitle: 'Open this gift first.',
    giftPrompt: {
      hint: 'Take your time with the card I made for you',
      transition: 'Just one more moment.\nI want to show you something.',
      bridgeText: 'The lid is open now.\nThe first note is already waiting just inside.',
    },
    revealCard: {
      eyebrow: 'A little note inside',
      title: 'Before anything else',
      body:
        'If this felt small from the outside, that was on purpose.\nI wanted it to feel like something you open slowly.\nSomething made just for you.\nHappy 30th, baby.',
      confirmLabel: 'Pull to open',
    },
    photoLockedEyebrow: 'My Rita',
    photoLockedText: 'Your birthday card is waiting inside.',
    photoUnlockedEyebrow: 'Only yours',
    photoUnlockedText: 'Made carefully, only for you.',
    faceIdIdleEyebrow: 'For your 30th',
    faceIdIdleText: 'Open this gift first. I want to be the one who opens it for you.',
    faceIdScanningEyebrow: 'Just a moment',
    faceIdScanningText: 'I am opening it gently, with both hands.',
    faceIdUnlockedEyebrow: 'Come in softly',
    faceIdUnlockedText: 'It is open now. The first note is waiting for you.',
    featuredPhotoPath: 'photos/rita.jpg',
    featuredPhotoAlt: 'A portrait of Rita',
  },
  story: {
    before: {
      text:
        'Thirty feels special to me because it feels like such a true age for you.\nNot because life suddenly changes, but because so much of who you are has come into focus.\nYou feel warmer, steadier, and more sure of yourself now.\nIt is beautiful to watch you grow into yourself.',
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
        pauseMs: 5200,
        imageAlt: 'A dinner date photo of us smiling together',
        caption:
          'I still love photos like this because they feel simple and happy.\nNo performance, no big scene.\nJust you, me, good food, and that feeling of wanting the night to last a little longer.',
      },
      {
        id: 'memory-2',
        imagePath: 'photos/photo-with-traditional-cloths.jpg',
        eyebrow: 'One I really love',
        pauseMs: 6400,
        imageAlt: 'A photo of us dressed in traditional clothes together',
        caption:
          'This one always makes me smile.\nWe look dressed up, but what I remember most is how easy it felt to share that day with you.\nThat is something I keep coming back to with us.\nEven special moments still feel comfortable when I am with you.',
      },
      {
        id: 'memory-3',
        imagePath: 'photos/run-the-firsst-half-marathon.jpg',
        eyebrow: 'And this one too',
        pauseMs: 7200,
        imageAlt: 'A race-day photo of us after the half marathon',
        caption:
          'I wanted to keep this one in here because it reminds me that we are not only good at the soft moments.\nWe are also good at showing up, pushing through, and cheering each other on.\nI feel proud of you, and honestly really lucky that I get to be on your side.',
      },
      {
        id: 'memory-4',
        imagePath: 'photos/run-together.jpg',
        eyebrow: 'Still us',
        pauseMs: 6800,
        imageAlt: 'A photo of us running together',
        caption:
          'I love this one because it feels like us in motion.\nNot trying too hard, not posing for anything.\nJust moving through something together and making it feel light.',
      },
      {
        id: 'memory-5',
        imagePath: 'photos/music-concert.jpg',
        eyebrow: 'One more page',
        pauseMs: 7000,
        imageAlt: 'A photo of us at a concert together',
        caption:
          'And I wanted one more page that feels a little louder.\nA night out, a crowd around us, and still somehow the part I remember most is just being there with you.',
      },
    ],
    after: {
      imagePath: 'photos/early-age.jpg',
      imageAlt: 'An early memory photo of Rita',
      text:
        'That is really what I wanted this little gift to hold.\nNot a big speech.\nJust a few real moments, and that quiet feeling I keep having with you.\nThat being beside you has become one of the most important parts of my life.',
    },
    thirtySoft: {
      text:
        'And for thirty, I just wanted to say this in the simplest way.\nYou are still my baby.\nStill the same clingy girl who wants hugs, gets emotional so easily, and makes me want to keep you close all the time.\nThat soft side of you still feels so completely you.\nAnd honestly, I still love it just as much as ever.',
    },
    thirtyRace: {
      text:
        'But this year, I also got to see another side of you more clearly.\nWatching you train for the Tainan Ancient Capital Half Marathon, seeing how diligent you were, and then seeing you reach the goal you set for yourself made me really proud of you.\nIt felt very you.\nSoft and affectionate, but also serious when something matters to you.\nThat is what makes thirty feel so right on you to me.\nYou are still the same baby I want to hold.\nI just get to love a steadier and stronger version of you now too.',
    },
  },
  blessing: {
    title: 'Happy 30th Birthday',
    subtitle: 'For the woman turning thirty, and becoming even more herself',
    reflection:
      'You make life feel calmer, softer, and more meaningful.\n\nI admire how thoughtful you are, how much care you carry, and how naturally you make the people around you feel at ease.\n\nBut this year, more than ever, I also admire your steadiness.\nThe way you are growing into yourself without needing to be loud about it.\nThat kind of quiet confidence is one of the things I love most about you.',
    wish:
      'I hope your thirties bring you more confidence, more peace, and more of the life that truly fits you.\n\nI hope there are many more moments that make you proud of yourself.\n\nAnd selfishly, I hope I get to stay beside you for a lot more of them.',
  },
  closing: {
    text: 'Happy 30th birthday, baby.\nI love you.\nAnd if you are done reading this, come let me hold you for a second.\nLove, always.',
    hint: 'Close the box gently when you are ready.',
    doneText: 'Everything is back in its place.',
    imagePath: 'photos/early-age.jpg',
    imageAlt: 'An early memory photo of Rita',
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
      after: {
        ...birthdayCardContentConfig.story.after,
        image: birthdayCardContentConfig.story.after.imagePath
          ? resolveAssetPath(birthdayCardContentConfig.story.after.imagePath)
          : undefined,
      },
    },
    closing: {
      ...birthdayCardContentConfig.closing,
      image: birthdayCardContentConfig.closing.imagePath
        ? resolveAssetPath(birthdayCardContentConfig.closing.imagePath)
        : undefined,
    },
  };
}

export const birthdayContent = createBirthdayContent(getPublicAssetPath);
