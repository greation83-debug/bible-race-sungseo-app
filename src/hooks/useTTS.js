import { useState, useEffect, useRef } from 'react';
import { toSinoKorean } from '../utils/helpers';

const ENGLISH_WEIRD_VOICE_RE = /novelty|whisper|bubbles|zarvox|trinoids|boing|bells|organ|good news|bad news|cellos|pipe|bahh|hysterical|deranged|junior|princess|ralph|fred|kathy|vicki|victoria/i;
const ENGLISH_FEMALE_VOICE_RE = /samantha|ava|allison|susan|karen|moira|tessa|serena|zira|jenny|aria|emma|olivia|libby|natasha|joanna|salli|kimberly|amy|read/i;
const ENGLISH_MALE_VOICE_RE = /alex|daniel|tom|david|mark|guy|brian|ryan|eric|roger|matthew|justin|reed/i;

const getEnglishVoiceGender = (voice) => {
    const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
    if (ENGLISH_MALE_VOICE_RE.test(name)) return 'male';
    if (ENGLISH_FEMALE_VOICE_RE.test(name)) return 'female';
    return 'unknown';
};

const getVoiceQualityScore = (voice, ttsLanguage) => {
    const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
    const lang = (voice.lang || '').toLowerCase();
    const isEnglish = ttsLanguage && ttsLanguage.startsWith('en');

    if (isEnglish) {
        if (!lang.startsWith('en')) return -100;
        if (ENGLISH_WEIRD_VOICE_RE.test(name)) {
            return -20;
        }

        let score = 0;
        if (lang === 'en-us') score += 30;
        if (lang === 'en-gb') score += 20;
        if (/samantha|alex|ava|daniel|allison|susan|tom|karen|moira|tessa|serena|jenny|guy|david|mark/i.test(name)) score += 70;
        if (/\bread\b|\breed\b/i.test(name)) score += 55;
        if (/google.*english|microsoft.*natural|microsoft.*online|natural/i.test(name)) score += 45;
        if (/premium|enhanced|siri/i.test(name)) score += 15;
        return score;
    }

    if (!lang.startsWith('ko')) return -100;
    let score = 0;
    if (lang === 'ko-kr') score += 30;
    if (/yuna|google.*한국|google.*korean|microsoft.*sunhi|natural/i.test(name)) score += 35;
    return score;
};

const pickBestEnglishVoices = (voices, ttsLanguage) => {
    const usable = voices
        .map(voice => ({
            voice,
            gender: getEnglishVoiceGender(voice),
            score: getVoiceQualityScore(voice, ttsLanguage)
        }))
        .filter(item => item.score >= 30)
        .sort((a, b) => b.score - a.score);

    const female = usable.find(item => item.gender === 'female');
    const male = usable.find(item => item.gender === 'male');
    const selected = [];

    if (female) selected.push(female.voice);
    if (male && !selected.some(voice => voice.voiceURI === male.voice.voiceURI)) selected.push(male.voice);

    for (const item of usable) {
        if (selected.length >= 2) break;
        if (!selected.some(voice => voice.voiceURI === item.voice.voiceURI)) selected.push(item.voice);
    }

    return selected.slice(0, 2);
};

const filterVoicesForLanguage = (voices, ttsLanguage) => {
    const targetPrefix = ttsLanguage && ttsLanguage.startsWith('en') ? 'en' : 'ko';
    const languageVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(targetPrefix));

    if (!ttsLanguage.startsWith('en')) return languageVoices;

    const selected = pickBestEnglishVoices(languageVoices, ttsLanguage);
    return selected.length > 0 ? selected : languageVoices.slice(0, 2);
};

export const useTTS = (verseText, ttsLanguage = 'ko-KR') => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [ttsSpeed, setTtsSpeed] = useState(() => {
        return parseFloat(localStorage.getItem('bible_ttsSpeed')) || 1.0;
    });
    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => {
        const initialLang = ttsLanguage && ttsLanguage.startsWith('en') ? 'en' : 'ko';
        const storageKey = initialLang === 'en' ? 'bible_selectedVoiceURI_en_v2' : 'bible_selectedVoiceURI_ko';
        return localStorage.getItem(storageKey) || '';
    });
    const [activeChunkIndex, setActiveChunkIndex] = useState(-1);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    const speakQueueRef = useRef([]);
    const currentChunkIndexRef = useRef(0);
    const isPausedRef = useRef(false);
    const speechRef = useRef(null);

    // 1. 목소리 목록 로드 및 업데이트 - 의존성 제거
    useEffect(() => {
        const loadVoices = () => {
            if (!window.speechSynthesis) return;
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return;

            console.log("Loaded voices:", voices.length);
            const languageVoices = filterVoicesForLanguage(voices, ttsLanguage);

            setAvailableVoices(prev => {
                // 부하 방지: 목록이 실제로 바뀌었을 때만 업데이트
                if (prev.length === languageVoices.length && prev.every((v, i) => v.voiceURI === languageVoices[i].voiceURI)) {
                    return prev;
                }
                return languageVoices;
            });
        };

        loadVoices();

        const ua = navigator.userAgent;
        if (ua.indexOf('NAVER') > -1 || ua.indexOf('KAKAOTALK') > -1) {
            setIsInAppBrowser(true);
        }

        if (window.speechSynthesis.addEventListener) {
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        } else {
            window.speechSynthesis.onvoiceschanged = loadVoices;
            return () => { window.speechSynthesis.onvoiceschanged = null; };
        }
    }, [ttsLanguage]);

    // 2. 기본 목소리 선택 - availableVoices가 채워졌을 때 한 번 실행
    useEffect(() => {
        if (availableVoices.length > 0) {
            const targetPrefix = ttsLanguage && ttsLanguage.startsWith('en') ? 'en' : 'ko';
            const savedKey = targetPrefix === 'en' ? 'bible_selectedVoiceURI_en_v2' : 'bible_selectedVoiceURI_ko';
            const savedURI = localStorage.getItem(savedKey);
            const voiceExists = savedURI && availableVoices.some(v => v.voiceURI === savedURI);

            if (voiceExists) {
                setSelectedVoiceURI(savedURI);
                return;
            }

            const preferredVoice = ttsLanguage && ttsLanguage.startsWith('en')
                ? availableVoices.find(voice => getEnglishVoiceGender(voice) === 'female') || availableVoices[0]
                : [...availableVoices].sort((a, b) => getVoiceQualityScore(b, ttsLanguage) - getVoiceQualityScore(a, ttsLanguage))[0] || availableVoices[0];

            setSelectedVoiceURI(preferredVoice.voiceURI);
            localStorage.setItem(savedKey, preferredVoice.voiceURI);
        }
    }, [availableVoices, ttsLanguage]);

    const handleSpeedChange = (delta) => {
        setTtsSpeed(prev => {
            const newSpeed = parseFloat((prev + delta).toFixed(1));
            const safeSpeed = Math.max(0.6, Math.min(2.0, newSpeed));
            localStorage.setItem('bible_ttsSpeed', safeSpeed);
            if (isSpeaking && !isPaused && speakQueueRef.current.length > 0) {
                handleStop();
                setTimeout(() => {
                    handleSpeak(verseText, currentChunkIndexRef.current, safeSpeed);
                }, 50);
            }
            return safeSpeed;
        });
    };

    const handleTogglePause = () => {
        if (isPaused) {
            setIsPaused(false);
            isPausedRef.current = false;
            playNextChunk();
        } else {
            setIsPaused(true);
            isPausedRef.current = true;
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    };

    const handleStop = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
        isPausedRef.current = false;
        setActiveChunkIndex(-1);
        speakQueueRef.current = [];
        currentChunkIndexRef.current = 0;
    };

    const playNextChunk = (forcedSpeed = null) => {
        if (!window.speechSynthesis) return;

        if (currentChunkIndexRef.current >= speakQueueRef.current.length) {
            setIsSpeaking(false);
            setActiveChunkIndex(-1);
            return;
        }

        setActiveChunkIndex(currentChunkIndexRef.current);
        const text = speakQueueRef.current[currentChunkIndexRef.current];
        if (!text || text.trim().length === 0) {
            currentChunkIndexRef.current++;
            playNextChunk(forcedSpeed);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoiceURI) {
            const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
            if (voice) utterance.voice = voice;
        }

        utterance.lang = ttsLanguage;
        utterance.rate = forcedSpeed !== null ? forcedSpeed : ttsSpeed;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            if (isPausedRef.current) return;
            currentChunkIndexRef.current++;
            playNextChunk(forcedSpeed);
        };

        utterance.onerror = (event) => {
            if (isPausedRef.current || event.error === 'interrupted' || event.error === 'canceled') {
                return;
            }
            console.error("TTS Error:", event);
            handleStop();
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleSpeak = (text, startFromIndex = 0, overrideSpeed = null) => {
        if (isInAppBrowser) {
            alert("네이버/카카오 앱에서는 읽기 기능이 지원되지 않습니다.\n\n화면 하단의 '외부 브라우저 열기'를 통해\n크롬이나 사파리로 접속해주세요.");
            return;
        }

        if (!window.speechSynthesis) {
            alert("이 브라우저는 음성 듣기를 지원하지 않습니다.");
            return;
        }

        const currentSpeed = overrideSpeed !== null ? overrideSpeed : ttsSpeed;

        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
        }

        const lines = text.split('\n');
        const chunks = [];
        lines.forEach(line => {
            // [[VERSE:n]] 패턴 제거
            const cleanLine = line.replace(/\[\[VERSE:\d+\]\]/g, '').trim();
            if (!cleanLine) return;

            let processedText = cleanLine;

            // 괄호 및 대괄호 내용 제거 (TTS에서 부가 정보/주석을 읽지 않도록)
            processedText = processedText.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');

            if (cleanLine.indexOf('#') === 0 && !ttsLanguage.startsWith('en')) {
                // 제목은 숫자를 한글 숫자로 변환 (예: 1 -> 일)
                processedText = processedText.replace(/[0-9]+/g, m => toSinoKorean(m));
            }

            processedText = processedText.replace(/^#+\s*/, '');
            // 따옴표 및 어퍼스트로피 제거
            processedText = processedText.replace(/['"‘’“”「」『』]/g, ' ');

            // 제목(#)은 문장 부호로 나누지 않고 통째로 한 구절로 처리 (UI와 싱크를 맞춤)
            if (cleanLine.indexOf('#') === 0) {
                if (processedText.trim().length > 0) chunks.push(processedText);
            } else {
                const subChunks = processedText.split(/([.?!])/g).reduce((acc, part) => {
                    if (['.', '?', '!'].indexOf(part) !== -1) {
                        if (acc.length > 0) acc[acc.length - 1] += part;
                        return acc;
                    }
                    if (part.trim().length > 0) acc.push(part);
                    return acc;
                }, []);
                chunks.push(...subChunks);
            }
        });

        if (chunks.length === 0) return;

        speakQueueRef.current = chunks;
        currentChunkIndexRef.current = startFromIndex;
        setIsSpeaking(true);
        setIsPaused(false);
        isPausedRef.current = false;
        setActiveChunkIndex(startFromIndex);

        setTimeout(() => {
            playNextChunk(currentSpeed);
        }, 50);
    };

    const jumpToChunk = (index) => {
        handleSpeak(verseText, index);
    };

    useEffect(() => {
        if (verseText) {
            handleStop();
        }
    }, [verseText]);

    useEffect(() => {
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, []);

    return {
        isSpeaking, isPaused, ttsSpeed, availableVoices, selectedVoiceURI, activeChunkIndex,
        handleSpeedChange, handleTogglePause, handleStop, handleSpeak, jumpToChunk,
        setSelectedVoiceURI
    };
};
