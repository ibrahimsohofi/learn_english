import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Story {
  id: number;
  title: string;
  text: string;
  video_url: string;
  difficulty: string;
}

export default function AdminPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    video_url: '',
    difficulty: 'beginner'
  });
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'admin') {
      navigate('/stories');
    } else {
      fetchStories();
    }
  }, [isAuthenticated, user, navigate]);

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories');
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/stories', formData);
      setIsDialogOpen(false);
      setFormData({ title: '', text: '', video_url: '', difficulty: 'beginner' });
      fetchStories();
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this story?')) {
      try {
        await api.delete(`/stories/${id}`);
        fetchStories();
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <Button onClick={() => navigate('/stories')} variant="outline" size="sm">
            Back to Stories
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Manage Stories</h2>
            <p className="text-slate-400">Add, edit, or remove stories</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add New Story</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Story</DialogTitle>
                <DialogDescription>
                  Create a new story for students to practice
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">Story Text</Label>
                  <Textarea
                    id="text"
                    rows={8}
                    value={formData.text}
                    onChange={(e) => setFormData({...formData, text: e.target.value})}
                    required
                    placeholder="Enter the story text here..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL (Optional)</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://example.com/video.m3u8 or video.mp4"
                  />
                  <p className="text-xs text-slate-500">
                    HLS (.m3u8) or regular video URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({...formData, difficulty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">Create Story</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {stories.map((story) => (
            <Card key={story.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{story.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Difficulty: {story.difficulty}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleDelete(story.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Text Preview:</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{story.text}</p>
                  </div>
                  {story.video_url && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Video URL:</p>
                      <p className="text-sm text-slate-600 truncate">{story.video_url}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
