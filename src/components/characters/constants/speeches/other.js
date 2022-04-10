export const OTHER_SPEECH = {
  skip: {
    propose: {
      text: "Would you like me to stop greeting you in the future unless you approach me first?",
      next: true,
      dismiss: true,
      skip: false,
    },
    restore: {
      text: "Would you like me to start approaching you to offer assistance again without prompting?",
      next: true,
      dismiss: true,
      skip: false,
    },
    agree: {
      text: 'Ok, no problem, I will let you explore by yourself. If you change your mind, just come talk to me and click the "Restore" icon any time.',
      next: true,
      dismiss: false,
      skip: false,
    },
    disagree: {
      text: "Great! Always glad to be of assistance. Just talk to me if you need more help.",
      next: true,
      dismiss: false,
      skip: false,
    },
  },
};

export const OTHER_BUTTONS = {
  skip: {
    propose: {
      next: "Yes please",
      alt: "No, I love talking to you!",
    },
    restore: {
      next: "Yes please!",
      alt: "No, thanks",
    },
    agree: {
      next: "OK",
      alt: false,
    },
    disagree: {
      next: "OK",
      alt: false,
    },
  },
};
