import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Story {
  id: number;
  title: string;
  difficulty: string;
  created_at: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchStories();
    }
  }, [isAuthenticated, navigate]);

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories');
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">English Learner</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              Welcome, {user?.name}
            </span>
            <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
              Dashboard
            </Button>
            {user?.role === 'admin' && (
              <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
                Admin Panel
              </Button>
            )}
            <Button onClick={logout} variant="destructive" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Choose a Story</h2>
          <p className="text-slate-400">Select a story to practice your reading skills</p>
        </div>

        {loading ? (
          <div className="text-center text-white">Loading stories...</div>
        ) : stories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-slate-500">No stories available yet.</p>
              {user?.role === 'admin' && (
                <Button onClick={() => navigate('/admin')} className="mt-4">
                  Add Stories
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getDifficultyColor(story.difficulty)}>
                      {story.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {story.title}
                  </CardTitle>
                  <CardDescription>
                    Added {new Date(story.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate(`/read/${story.id}`)}
                    className="w-full"
                  >
                    Start Reading
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
