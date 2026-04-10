import { useState, useRef, useCallback, useEffect } from "react";

// Extend Window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  lang?: string;
}

export function useVoice({ onTranscript, lang = "en-US" }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef(window.speechSynthesis);

  const supportsRecognition = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const supportsSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;

  // Stop any ongoing speech
  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  // Speak text aloud
  const speak = useCallback((text: string) => {
    if (!supportsSynthesis || !voiceEnabled) return;
    stopSpeaking();

    // Clean markdown-style formatting for cleaner speech
    const clean = text
      .replace(/[*_~`#>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [supportsSynthesis, voiceEnabled, lang, stopSpeaking]);

  // Start listening
  const startListening = useCallback(() => {
    if (!supportsRecognition || !voiceEnabled) return;
    stopSpeaking(); // stop AI speech when user starts talking

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        onTranscript?.(finalTranscript.trim());
      }
      setTranscript("");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supportsRecognition, voiceEnabled, lang, onTranscript, stopSpeaking]);

  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      synthRef.current.cancel();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    voiceEnabled,
    setVoiceEnabled,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    toggleListening,
    supportsRecognition,
    supportsSynthesis,
  };
}
