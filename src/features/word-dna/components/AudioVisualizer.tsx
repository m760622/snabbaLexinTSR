import React, { useState, useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive }) => {
    const [volumes, setVolumes] = useState<number[]>(Array(10).fill(5));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive) {
            const startAudio = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const context = new AudioContext();
                    const analyser = context.createAnalyser();
                    const source = context.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.fftSize = 64;

                    audioContextRef.current = context;
                    analyserRef.current = analyser;

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    const update = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const newVolumes = Array.from({ length: 10 }).map((_, i) => {
                            const val = dataArray[i + 2] || 0;
                            return Math.max(5, (val / 255) * 40);
                        });
                        setVolumes(newVolumes);
                        animationRef.current = requestAnimationFrame(update);
                    };
                    update();
                } catch (e) {
                    console.error('Audio fail', e);
                }
            };
            startAudio();
        } else {
            if (audioContextRef.current) audioContextRef.current.close();
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            setVolumes(Array(10).fill(5));
        }
    }, [isActive]);

    return (
        <div className="live-waves">
            {volumes.map((vol, i) => (
                <div key={i} className="wave-bar" style={{ height: `${vol}px`, background: isActive ? 'var(--story-cyan)' : 'white' }}></div>
            ))}
        </div>
    );
};
