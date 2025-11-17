import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SessionDetails {
  id: number;
  story_title: string;
  story_text: string;
  accuracy: number;
  correct_words: number;
  total_words: number;
  created_at: string;
  mistakes: Array<{
    expected_word: string;
    spoken_word: string;
    position: number;
  }>;
}

export default function SessionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const response = await api.get(`/sessions/${id}`);
      setSession(response.data);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Session not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Session Details</h1>
          <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{session.story_title}</CardTitle>
            <CardDescription>
              Completed on {new Date(session.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span className="font-bold">{Number.parseFloat(session.accuracy.toString()).toFixed(1)}%</span>
              </div>
              <Progress value={session.accuracy} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-slate-900">{session.total_words}</p>
                <p className="text-sm text-slate-600">Total Words</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{session.correct_words}</p>
                <p className="text-sm text-green-600">Correct</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">{session.mistakes.length}</p>
                <p className="text-sm text-red-600">Mistakes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {session.mistakes && session.mistakes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Mistakes</CardTitle>
              <CardDescription>Words that need improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.mistakes.map((mistake, index) => (
                  <div key={index} className="bg-red-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">
                          Position #{mistake.position + 1}
                        </p>
                        <p className="mt-1">
                          <span className="text-sm text-red-700">Expected:</span>{' '}
                          <span className="font-medium text-red-900">{mistake.expected_word}</span>
                        </p>
                        <p>
                          <span className="text-sm text-red-700">You said:</span>{' '}
                          <span className="font-medium text-red-900">
                            {mistake.spoken_word || '(skipped)'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
