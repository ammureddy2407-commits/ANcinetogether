import { useState, useEffect, useRef, useCallback } from 'react';

export interface MediaDeviceState {
  stream: MediaStream | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  hasCameraPermission: boolean | null; // null = pending
  hasMicPermission: boolean | null;
  errorMessage: string | null;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  selectedVideoDevice: string;
  selectedAudioDevice: string;
  selectedAudioOutput: string;
  isSpeakerMuted: boolean;
  isSpeaking: boolean;
}

export function useMediaDevices(autoStart = false) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
      setAudioOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));
    } catch (e) {
      console.warn('Failed to enumerate devices', e);
    }
  }, []);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const monitorAudioLevel = useCallback((mediaStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // If average volume threshold is above 18, consider speaking
        setIsSpeaking(average > 18);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      // Audio level analysis is non-critical
    }
  }, []);

  const startMedia = useCallback(
    async (options?: { videoId?: string; audioId?: string }) => {
      stopTracks();
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage('Camera & microphone access are not supported by this browser.');
        setHasCameraPermission(false);
        setHasMicPermission(false);
        return null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: options?.videoId ? { deviceId: { exact: options.videoId } } : { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: options?.audioId ? { deviceId: { exact: options.audioId } } : true,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        setStream(newStream);
        setHasCameraPermission(true);
        setHasMicPermission(true);

        // Apply initial toggle state
        newStream.getVideoTracks().forEach((track) => {
          track.enabled = cameraEnabled;
        });
        newStream.getAudioTracks().forEach((track) => {
          track.enabled = micEnabled;
        });

        monitorAudioLevel(newStream);
        await enumerateDevices();
        return newStream;
      } catch (err: any) {
        console.warn('getUserMedia audio+video error, attempting audio-only fallback:', err);
        // Fallback: If combined video+audio fails, try audio only so live communication still works
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: options?.audioId ? { deviceId: { exact: options.audioId } } : true,
          });
          streamRef.current = audioOnlyStream;
          setStream(audioOnlyStream);
          setHasCameraPermission(false);
          setHasMicPermission(true);
          audioOnlyStream.getAudioTracks().forEach((track) => {
            track.enabled = micEnabled;
          });
          monitorAudioLevel(audioOnlyStream);
          await enumerateDevices();
          return audioOnlyStream;
        } catch (_) {
          // If both fail
        }

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Camera or microphone permission was denied. You can continue without video.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('No camera or microphone hardware found.');
        } else {
          setErrorMessage(err.message || 'Unable to access media devices.');
        }
        setHasCameraPermission(false);
        setHasMicPermission(false);
        return null;
      }
    },
    [cameraEnabled, micEnabled, stopTracks, monitorAudioLevel, enumerateDevices]
  );

  const toggleCamera = useCallback(() => {
    setCameraEnabled((prev) => {
      const next = !prev;
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = next;
        });
      }
      return next;
    });
  }, []);

  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const next = !prev;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = next;
        });
      }
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted((prev) => !prev);
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setErrorMessage('Screen sharing needs a supported browser on HTTPS or localhost.');
        return null;
      }
      setErrorMessage(null);
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = media;
      setScreenStream(media);
      setIsScreenSharing(true);

      const videoTrack = media.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
      return media;
    } catch (err: any) {
      console.warn('Screen share error or cancelled:', err);
      setErrorMessage(err.name === 'NotAllowedError'
        ? 'Screen sharing was cancelled or blocked. Allow screen capture in your browser, then try again.'
        : err.message || 'Unable to share screen.');
      stopScreenShare();
      return null;
    }
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  useEffect(() => {
    if (autoStart) {
      startMedia();
    }
    return () => {
      stopTracks();
    };
  }, [autoStart, startMedia, stopTracks]);

  return {
    stream,
    cameraEnabled,
    micEnabled,
    isSpeakerMuted,
    hasCameraPermission,
    hasMicPermission,
    errorMessage,
    videoDevices,
    audioDevices,
    audioOutputDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    selectedAudioOutput,
    isSpeaking,
    screenStream,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    startMedia,
    stopTracks,
    toggleCamera,
    toggleMic,
    toggleSpeaker,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedAudioOutput,
    enumerateDevices,
  };
}
