export const speakText = async (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find((voice) =>
        voice.name.includes("Microsoft Aria")
      ) ||
      voices.find((voice) =>
        voice.name.includes("Google UK English Female")
      ) ||
      voices.find((voice) =>
        voice.name.includes("Microsoft David")
      ) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve();

    speechSynthesis.speak(utterance);
  });
};