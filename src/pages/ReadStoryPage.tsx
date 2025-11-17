import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Story {
  id: number;
  title: string;
  text: string;
  video_url: string;
  difficulty: string;
}

interface AnalysisResult {
  session_id: number;
  accuracy: number;
  correct_words: number;
  total_words: number;
  mistakes: number;
  mistakes_details: Array<{
    position: number;
    expected: string;
    spoken: string;
  }>;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function ReadStoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const fetchStory = useCallback(async () => {
    try {
      const response = await api.get(`/stories/${id}`);
      setStory(response.data);
    } catch (error) {
      console.error('Error fetching story:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchStory();

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecognitionSupported(false);
    }
  }, [fetchStory]);

  useEffect(() => {
    if (story?.video_url && videoRef.current) {
      initializeVideo(story.video_url);
    }
  }, [story]);

  const initializeVideo = (videoUrl: string) => {
    if (!videoRef.current) return;

    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoUrl;
      }
    } else {
      videoRef.current.src = videoUrl;
    }
  };

  const startRecording = () => {
    if (!recognitionSupported) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setTranscript('');
    setResult(null);
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    if (transcript && story) {
      try {
        const response = await api.post('/sessions/analyze', {
          story_id: story.id,
          spoken_text: transcript
        });
        setResult(response.data);
      } catch (error) {
        console.error('Error analyzing reading:', error);
      }
    }
  };

  const highlightText = () => {
    if (!story || !transcript) return story?.text;

    const originalWords = story.text.toLowerCase().replace(/[.,!?;:"'()]/g, '').split(' ');
    const spokenWords = transcript.toLowerCase().replace(/[.,!?;:"'()]/g, '').split(' ');
    const storyWords = story.text.split(' ');

    return storyWords.map((word, index) => {
      const normalizedWord = word.toLowerCase().replace(/[.,!?;:"'()]/g, '');
      const spokenWord = spokenWords[index] || '';

      let className = 'px-1 rounded';
      if (spokenWord === normalizedWord) {
        className += ' bg-green-200 text-green-900';
      } else if (spokenWord && spokenWord !== normalizedWord) {
        className += ' bg-red-200 text-red-900';
      }

      return <span key={index} className={className}>{word} </span>;
    });
  };

  if (!story) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">{story.title}</h1>
          <Button onClick={() => navigate('/stories')} variant="outline" size="sm">
            Back to Stories
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {story.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Story Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    ref={videoRef}
                    controls
                    className="w-full rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Story Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg leading-relaxed">
                  {transcript ? highlightText() : story.text}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reading Practice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!recognitionSupported && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Speech recognition is not supported in your browser. Please use Chrome or Edge.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="flex-1"
                      disabled={!recognitionSupported}
                    >
                      Start Reading
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex-1"
                    >
                      Stop & Analyze
                    </Button>
                  )}
                </div>

                {isRecording && (
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 animate-pulse">
                    <p className="text-red-700 font-medium text-center">
                      Recording... Read the text aloud
                    </p>
                  </div>
                )}

                {transcript && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-2">Your Reading:</p>
                    <p className="text-slate-900">{transcript}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span className="font-bold">{result.accuracy}%</span>
                    </div>
                    <Progress value={result.accuracy} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-700">{result.correct_words}</p>
                      <p className="text-sm text-green-600">Correct Words</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-700">{result.mistakes}</p>
                      <p className="text-sm text-red-600">Mistakes</p>
                    </div>
                  </div>

                  {result.mistakes_details && result.mistakes_details.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Mistakes:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {result.mistakes_details.map((mistake, index) => (
                          <div key={index} className="bg-red-50 p-3 rounded text-sm">
                            <span className="font-medium">Expected:</span> {mistake.expected}
                            <br />
                            <span className="font-medium">You said:</span> {mistake.spoken || '(skipped)'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      setTranscript('');
                      setResult(null);
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
