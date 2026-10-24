import type { SaveData } from './types';

export interface Line {
  /** Speaker's family id, for the portrait. */
  who: string;
  text: string;
}

/** Opening scene for each chapter, in order. Kept short so it never gets in the way. */
export const CHAPTER_SCENES: Line[][] = [
  [
    { who: 'kenji', text: 'So you are the boy who knocked over my training dummy. Again.' },
    { who: 'kairo', text: 'It started it! ...Teach me to fight properly, old man?' },
    { who: 'kenji', text: 'Climb the cliffs first. Then we talk.' },
  ],
  [
    { who: 'mei', text: 'Raiders took the oasis. You look strong enough to help.' },
    { who: 'kairo', text: 'Strong? I just ate. Let’s go!' },
  ],
  [
    { who: 'bruno', text: 'The Iron Legion marches on the valley. I will not let them pass.' },
    { who: 'kairo', text: 'Then I’ll stand next to you, big guy.' },
  ],
  [
    { who: 'vorg', text: 'A spark from a backwater world. How amusing.' },
    { who: 'varek', text: 'Stay out of my way, Kairo. Vorg is mine.' },
    { who: 'kairo', text: 'Then we’d better hurry, Varek.' },
  ],
  [
    { who: 'nyx', text: 'Target: Kairo. Threat level: rising. Commencing test.' },
    { who: 'lyra', text: 'The foundry builds more of them every hour. Shut it down!' },
  ],
  [
    { who: 'mogra', text: 'MOGRA SMASH MOUNTAIN. THEN MOGRA SMASH YOU.' },
    { who: 'tobi', text: 'Maybe smash in that order, please.' },
  ],
  [
    { who: 'orrin', text: 'The moon cracked when Vorg arrived. Its light is fading.' },
    { who: 'sora', text: 'Dad, I want to fight too. I can do it!' },
    { who: 'kairo', text: 'Stay close, Sora. Show me what you’ve got.' },
  ],
  [
    { who: 'vorg', text: 'You have climbed far, little spark. Kneel before your tyrant.' },
    { who: 'varek', text: 'I kneel to no one. Least of all you.' },
  ],
  [
    { who: 'zeno', text: 'The rift remembers every battle ever fought. Listen.' },
    { who: 'arden', text: 'I’m Kael, from an Earth a long way from yours. The rift pulled me through.' },
    { who: 'arden', text: 'Looks like you could use a hand, Kairo.' },
    { who: 'kairo', text: 'Ha! The more the merrier.' },
  ],
  [
    { who: 'grimm', text: 'The Demon Gate opens. Your world will feed my hunger.' },
    { who: 'kairo', text: 'Not while I’m standing. Everyone, with me!' },
  ],
  [
    { who: 'sylas', text: 'Larval stage complete. I need... more.' },
    { who: 'aya', text: 'Something is draining the life out of the swamp.' },
  ],
  [
    { who: 'sylas', text: 'The hive sings for me. Every fighter I absorb, I become.' },
    { who: 'jin', text: 'Then I will cut the song short.' },
  ],
  [
    { who: 'sylas', text: 'I have built an arena. Come prove which of us is perfect.' },
    { who: 'kenji', text: 'Arrogance is the first crack in any wall.' },
  ],
  [
    { who: 'aya', text: 'The valley is my home. Every petal here remembers my steps.' },
    { who: 'sora', text: 'Then let’s dance them out of here together!' },
  ],
  [
    { who: 'mei', text: 'Thunder Peaks. Where I learned to strike before the lightning.' },
    { who: 'kairo', text: 'Race you to the top?' },
  ],
  [
    { who: 'kenji', text: 'The Tournament of Masters. Every great fighter has stood here.' },
    { who: 'varek', text: 'And today, they all fall.' },
  ],
  [
    { who: 'kael', text: 'I am what you would become if you lost, Kairo. Your echo.' },
    { who: 'kairo', text: 'Then I just won’t lose.' },
  ],
  [
    { who: 'grimm', text: 'The Crimson Throne waits for its king. Sylas, Echo, come.' },
    { who: 'orrin', text: 'Three of them at once... we need everyone.' },
  ],
  [
    { who: 'lyra', text: 'Beyond the stars there are fighters who never stopped training.' },
    { who: 'kairo', text: 'Then that’s where I’m going next.' },
  ],
  [
    { who: 'nyx', text: 'Temperature: minus two hundred. Survival odds: low.' },
    { who: 'bruno', text: 'Odds have never stopped me.' },
  ],
  [
    { who: 'kenji', text: 'Gravity here is a hundred times stronger. Train or be crushed.' },
    { who: 'tobi', text: 'I can’t... lift... my arms...' },
  ],
  [
    { who: 'kenji', text: 'My old island. My old masters. Show them what I taught you.' },
    { who: 'kairo', text: 'I’ll make you proud, old man.' },
  ],
  [
    { who: 'kael', text: 'Every wave here is a fighter who gave up. Join them.' },
    { who: 'zeno', text: 'Do not listen to him. Keep moving.' },
  ],
  [
    { who: 'nyx', text: 'The Clockwork Empire is my origin. I will end it.' },
    { who: 'lyra', text: 'Then we fight beside you, Nyx.' },
  ],
  [
    { who: 'orrin', text: 'The Sky Temple keeps the oldest forms of power.' },
    { who: 'sora', text: 'Then let’s unlock them!' },
  ],
  [
    { who: 'mogra', text: 'ABYSS ARENA. MOGRA CHAMPION. YOU... CHALLENGER?' },
    { who: 'bruno', text: 'Finally, someone my size.' },
  ],
  [
    { who: 'aya', text: 'Two suns, no shade. Keep your guard up.' },
    { who: 'jin', text: 'A blade does not tire.' },
  ],
  [
    { who: 'grimm', text: 'Death was only a doorway. I have come back stronger.' },
    { who: 'kairo', text: 'So have we.' },
  ],
  [
    { who: 'zeno', text: 'The dimensions are tearing. The Vision Gate is waking.' },
    { who: 'kenji', text: 'This is the final road. No turning back.' },
  ],
  [
    { who: 'kael', text: 'In the Mirror Realm you will fight yourselves.' },
    { who: 'varek', text: 'Good. I’ve always wanted to beat me.' },
  ],
  [
    { who: 'vorg', text: 'The Hall of Fallen Kings. I will not fall twice.' },
    { who: 'varek', text: 'You will, Vorg. I promise.' },
  ],
  [
    { who: 'tobi', text: 'At these peaks, the body moves before the mind.' },
    { who: 'kairo', text: 'Then stop thinking and feel it.' },
  ],
  [
    { who: 'kael', text: 'The Eclipse Fortress swallows all light. Even yours.' },
    { who: 'orrin', text: 'Light always finds a way back.' },
  ],
  [
    { who: 'zeno', text: 'The Zenith Trial tests whether you deserve the gate.' },
    { who: 'kairo', text: 'Bring it on.' },
  ],
  [
    { who: 'lyra', text: 'The edge of creation. There’s nothing past here.' },
    { who: 'kael', text: 'Nothing but me.' },
  ],
  [
    { who: 'kenji', text: 'One last tournament, before the end. Fight with everything.' },
    { who: 'mei', text: 'We always do.' },
  ],
  [
    { who: 'grimm', text: 'We are the gate’s guardians now. None shall pass.' },
    { who: 'varek', text: 'Then we go through you.' },
  ],
  [
    { who: 'kael', text: 'The Vision Gate. Everything you are ends here, Kairo.' },
    { who: 'kairo', text: 'No, Echo. Everything starts here.' },
    { who: 'arden', text: 'And he isn’t facing you alone.' },
  ],
];

export const ENDING: Line[] = [
  { who: 'kael', text: 'So... the echo fades. You never once gave up.' },
  { who: 'kairo', text: 'Come with us, Echo. There’s always another fight to train for.' },
  { who: 'arden', text: 'The Gate opens onto the other Earths. Mine is one of them. Come and see it.' },
  { who: 'kenji', text: 'The Vision Gate is open. Whatever lies beyond, you are ready.' },
];

export function sceneSeen(save: SaveData, key: string): boolean {
  return save.seenScenes.includes(key);
}

export function markScene(save: SaveData, key: string): SaveData {
  return sceneSeen(save, key) ? save : { ...save, seenScenes: [...save.seenScenes, key] };
}
