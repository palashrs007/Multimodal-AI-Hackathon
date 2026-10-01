import React from 'react';
import { Mic, Square, RotateCcw, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder.js';

export function VoiceRecorder({ onAudioReady, onResetAudio }) {
  const {
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
  } = useVoiceRecorder({ maxDuration: 60 });

  // Inform parent when recording completes
  React.useEffect(() => {
    if (audioBlob) {
      onAudioReady(audioBlob);
    }
  }, [audioBlob, onAudioReady]);

  const handleReset = () => {
    resetRecording();
    if (onResetAudio) onResetAudio();
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-coral-500" />
            <span>Voice Memo (Optional)</span>
          </h4>
          <p className="text-xs text-stone-500">
            Speak your budget, duration, or places you love (up to 60 seconds).
          </p>
        </div>

        {isRecording && (
          <div className="flex items-center space-x-2 text-rose-600 font-mono text-xs font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-rose-600" />
            <span>{formatTimer(duration)} / 01:00</span>
          </div>
        )}
      </div>

      {/* Recording in progress */}
      {isRecording && (
        <div className="space-y-3 pt-2">
          {/* Audio level meter */}
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-coral-500 flex-shrink-0" />
            <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-coral-500 to-amber-400 transition-all duration-75"
                style={{ width: `${Math.max(5, audioLevel)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition"
          >
            <Square className="w-4 h-4" />
            <span>Finish Recording</span>
          </button>
        </div>
      )}

      {/* Recording finished / playback */}
      {!isRecording && audioUrl && (
        <div className="space-y-3 pt-1">
          <audio controls src={audioUrl} className="w-full h-10 rounded-xl" />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Record Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Initial state: start recording */}
      {!isRecording && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:border-coral-400 hover:text-coral-600 shadow-sm transition active:scale-98"
        >
          <Mic className="w-3.5 h-3.5 text-coral-500" />
          <span>Record Voice Note</span>
        </button>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
