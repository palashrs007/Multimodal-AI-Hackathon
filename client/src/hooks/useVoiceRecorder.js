import { useState, useRef, useEffect, useCallback } from 'react';

export function useVoiceRecorder({ maxDuration = 60 } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  const cleanupAudioAnalyser = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (_) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (_) {}
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    cleanupAudioAnalyser();
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mime type
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      // Web Audio API for audio meter visualization
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        console.warn('Audio visualization not available:', e);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all media tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // slices of 250ms
      setIsRecording(true);

      // Start 1-second interval timer
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else {
        setError(`Unable to record audio: ${err.message}`);
      }
    }
  }, [maxDuration, stopRecording]);

  const resetRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setAudioLevel(0);
    setError(null);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupAudioAnalyser();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return {
    isRecording,
    duration,
    maxDuration,
    audioBlob,
    audioUrl,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
