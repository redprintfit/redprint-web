/**
 * Copy for /for-gyms. Kept out of the components so the pitch can be
 * revised without touching layout.
 */

export type HeadlineLine = { text: string; accent?: boolean };

export type PhoneScreenKey =
  | "community"
  | "groupChallenge"
  | "tierAchievement"
  | "aiChatbot"
  | "exerciseRedprint";

export type FeatureMedia =
  | { kind: "phone"; screen: PhoneScreenKey }
  | { kind: "dashboard"; variant: "usage" | "messages" | "maintenance" };

export type GymFeature = {
  id: string;
  /** Short uppercase eyebrow above the feature title. */
  label: string;
  title: string;
  description: string;
  media: FeatureMedia;
};

export const forGyms = {
  hero: {
    headline: [
      { text: "Engage every member." },
      { text: "Understand every machine." },
    ] as HeadlineLine[],
    subhead:
      "Redprint puts a branded tag on every machine in your gym. Members tap to train, and you get the engagement and equipment data behind it.",
  },

  features: {
    heading: "What your gym gets out of a tag.",
  },

  featureList: [
    {
      id: "videos",
      label: "Instruction",
      title: "Your trainers, on your equipment",
      description: "Film your trainers on your machines and attach the video to the tag.",
      media: { kind: "phone", screen: "exerciseRedprint" },
    },
    {
      id: "ai",
      label: "Gym-specific AI",
      title: "AI guidance that knows your gym",
      description:
        "Members get AI coaching built around your equipment and your floor, not a generic library.",
      media: { kind: "phone", screen: "aiChatbot" },
    },
    {
      id: "community",
      label: "Community",
      title: "Give members a reason to bring a friend",
      description: "Members form groups, train toward shared goals, and keep each other showing up.",
      media: { kind: "phone", screen: "groupChallenge" },
    },
    {
      id: "usage",
      label: "Equipment data",
      title: "See which machines earn their floor space",
      description: "Every tap is a data point: busiest hours, untouched equipment, your next purchase.",
      media: { kind: "dashboard", variant: "usage" },
    },
    {
      id: "challenges",
      label: "Challenges",
      title: "Run challenges your members actually finish",
      description: "Set the challenge and the reward. Redprint tracks it and tells you who is close.",
      media: { kind: "phone", screen: "tierAchievement" },
    },
    {
      id: "compete",
      label: "Competition",
      title: "Put your gym on the leaderboard",
      description: "Your gym competes against every other Redprint gym on total weight moved.",
      media: { kind: "phone", screen: "community" },
    },
    {
      id: "maintenance",
      label: "Maintenance",
      title: "Broken machines report themselves",
      description: "A member taps the tag and flags it. It lands in your queue with the machine identified.",
      media: { kind: "dashboard", variant: "maintenance" },
    },
    {
      id: "communicate",
      label: "Member communication",
      title: "Reach the whole floor without another email blast",
      description: "Announce closures, new equipment, and events inside the app members already open.",
      media: { kind: "dashboard", variant: "messages" },
    },
  ] as GymFeature[],
};
