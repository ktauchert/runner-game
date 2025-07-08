// Sound manager for the game

// Use the Howler library for sound management
// We'll need to install it: npm install howler @types/howler

import { Howl } from 'howler';

// Sound definitions
const sounds = {
  // UI sounds
  buttonClick: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.5 }),
  
  // Game events
  gatePositive: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1346/1346-preview.mp3'], volume: 0.3 }),
  gateNegative: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], volume: 0.3 }),
  
  // Battle sounds
  battleStart: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3'], volume: 0.4 }),
  battleOngoing: new Howl({ 
    src: ['https://assets.mixkit.co/active_storage/sfx/169/169-preview.mp3'], 
    volume: 0.2,
    loop: true 
  }),
  
  // Results
  victory: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/220/220-preview.mp3'], volume: 0.5 }),
  defeat: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1082/1082-preview.mp3'], volume: 0.5 }),
  
  // Warnings
  warning: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/127/127-preview.mp3'], volume: 0.4 }),
};

// Sound manager
export const SoundManager = {
  // Play a specific sound
  play: (soundName: keyof typeof sounds): void => {
    sounds[soundName]?.play();
  },
  
  // Stop a specific sound
  stop: (soundName: keyof typeof sounds): void => {
    sounds[soundName]?.stop();
  },
  
  // Stop all sounds
  stopAll: (): void => {
    Object.values(sounds).forEach(sound => sound.stop());
  }
};
