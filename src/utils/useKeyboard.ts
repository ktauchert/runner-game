import { useState, useEffect } from "react";

interface KeyboardState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export const useKeyboard = (): KeyboardState => {
  const [keys, setKeys] = useState<KeyboardState>({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          setKeys((keys) => ({ ...keys, left: true }));
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setKeys((keys) => ({ ...keys, right: true }));
          break;
        case "ArrowUp":
        case "w":
        case "W":
          setKeys((keys) => ({ ...keys, up: true }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setKeys((keys) => ({ ...keys, down: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          setKeys((keys) => ({ ...keys, left: false }));
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setKeys((keys) => ({ ...keys, right: false }));
          break;
        case "ArrowUp":
        case "w":
        case "W":
          setKeys((keys) => ({ ...keys, up: false }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setKeys((keys) => ({ ...keys, down: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
};
