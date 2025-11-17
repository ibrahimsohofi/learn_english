import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Session {
  id: number;
  story_title: string;
  accuracy: number;
  correct_words: number;
  mistakes: number;
  created_at: string;
}

interface Stats {
  total_sessions: number;
  average_accuracy: number;
  total_correct_words: number;
  total_mistakes: number;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/sessions/stats')
      ]);
      setSessions(sessionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [isAuthenticated, navigate, fetchData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <Button onClick={() => navigate('/stories')} variant="outline" size="sm">
            Back to Stories
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Your Progress</h2>
          <p className="text-slate-400">Track your learning journey</p>
        </div>

        {loading ? (
          <div className="text-center text-white">Loading...</div>
        ) : (
          <>
            {stats && (
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Sessions</CardDescription>
                    <CardTitle className="text-3xl">{stats.total_sessions || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Average Accuracy</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.average_accuracy ? Number.parseFloat(stats.average_accuracy.toString()).toFixed(1) : 0}%
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Correct Words</CardDescription>
                    <CardTitle className="text-3xl text-green-600">{stats.total_correct_words || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Total Mistakes</CardDescription>
                    <CardTitle className="text-3xl text-red-600">{stats.total_mistakes || 0}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest reading practice sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No sessions yet. Start reading a story!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{session.story_title}</h3>
                          <p className="text-sm text-slate-500">
                            {new Date(session.created_at).toLocaleDateString()} at{' '}
                            {new Date(session.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">
                              {Number.parseFloat(session.accuracy.toString()).toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500">Accuracy</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium text-green-600">
                              {session.correct_words}
                            </p>
                            <p className="text-xs text-slate-500">Correct</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium text-red-600">
                              {session.mistakes}
                            </p>
                            <p className="text-xs text-slate-500">Mistakes</p>
                          </div>
                          <Button
                            onClick={() => navigate(`/sessions/${session.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
