import { useState, useRef, useCallback, useEffect } from "react";

// Extend Window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  lang?: string;
  /** Auto-stop recording after this many ms of silence (no new speech). Set 0 to disable. */
  silenceTimeoutMs?: number;
}

export function useVoice({ onTranscript, lang = "en-US", silenceTimeoutMs = 1800 }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef<string>("");

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

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
    lastTranscriptRef.current = "";

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
      const combined = finalTranscript + interim;
      setTranscript(combined);
      lastTranscriptRef.current = combined;

      // Reset silence timer on every new speech token
      if (silenceTimeoutMs > 0) {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        }, silenceTimeoutMs);
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      const finalText = (finalTranscript || lastTranscriptRef.current).trim();
      if (finalText) {
        onTranscript?.(finalText);
      }
      setTranscript("");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      clearSilenceTimer();
      setIsListening(false);
      setTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supportsRecognition, voiceEnabled, lang, onTranscript, stopSpeaking, silenceTimeoutMs, clearSilenceTimer]);

  // Stop listening
  const stopListening = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
  }, [clearSilenceTimer]);

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
      clearSilenceTimer();
      recognitionRef.current?.stop();
      synthRef.current.cancel();
    };
  }, [clearSilenceTimer]);

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
