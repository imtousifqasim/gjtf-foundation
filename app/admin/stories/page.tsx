"use client";

import * as React from "react";
import Image from "next/image";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  Eye,
  Video,
  Image as ImageIcon,
  Save,
  User,
} from "lucide-react";
import { stories as initialStories, Story, StoryCategory } from "@/data/stories";
import { saveStory, deleteStory } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function AdminStoriesPage() {
  const [storiesList, setStoriesList] = React.useState<Story[]>(initialStories);
  const [editingStory, setEditingStory] = React.useState<Partial<Story> | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Fetch live stories from Supabase on mount
  React.useEffect(() => {
    async function loadStories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("stories")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Story[] = data.map((s: any) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            category: (s.category || "Success Stories") as StoryCategory,
            excerpt: s.excerpt || "",
            publishedAt: s.published_at
              ? new Date(s.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "Recent",
            readTime: "4 min read",
            coverImage: s.cover_image_url || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900",
            videoUrl: s.video_url || undefined,
            author: {
              name: s.author_name || "GJTF Editorial",
              role: s.author_role || "Communications",
            },
            content: s.body ? s.body.split("\n\n") : [""],
          }));
          setStoriesList(mapped);
        }
      } catch (err) {
        console.error("Error loading stories from Supabase:", err);
      }
    }
    loadStories();
  }, []);

  const handleOpenNew = () => {
    setEditingStory({
      id: "story-" + Date.now(),
      slug: "",
      title: "",
      category: "Success Stories",
      excerpt: "",
      publishedAt: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      readTime: "3 min read",
      coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop",
      videoUrl: "",
      author: {
        name: "GJTF Communications Desk",
        role: "Editorial Team",
      },
      content: [""],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (story: Story) => {
    setEditingStory({ ...story });
    setIsModalOpen(true);
  };

  const [storyToDelete, setStoryToDelete] = React.useState<string | null>(null);

  const confirmDeleteStory = async () => {
    if (!storyToDelete) return;
    await deleteStory(storyToDelete);
    setStoriesList((prev) => prev.filter((s) => s.id !== storyToDelete));
    setStoryToDelete(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !editingStory.title) return;

    setSaving(true);
    const slug =
      editingStory.slug ||
      editingStory.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const fullStory: Story = {
      ...(editingStory as Story),
      slug,
      coverImage: editingStory.coverImage || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900",
      videoUrl: editingStory.videoUrl || undefined,
      author: {
        name: editingStory.author?.name || "GJTF Communications Desk",
        role: editingStory.author?.role || "Editorial Team",
      },
      publishedAt: editingStory.publishedAt || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      readTime: editingStory.readTime || "4 min read",
    };

    await saveStory(fullStory);

    setStoriesList((prev) => {
      const idx = prev.findIndex((s) => s.id === fullStory.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = fullStory;
        return copy;
      }
      return [fullStory, ...prev];
    });

    setSaving(false);
    setIsModalOpen(false);
    setEditingStory(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Success Stories CMS
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage student success stories, blogs, press articles, cover images, and video links.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenNew}
          className="gap-2 px-5 py-2.5 font-bold self-start sm:self-auto shadow-sm rounded-xl hover:shadow"
        >
          <Plus className="w-4 h-4" /> Add New Story
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storiesList.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                <Image
                  src={story.coverImage || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900"}
                  alt={story.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant="default" className="text-[10px] font-semibold bg-primary-700 text-white">
                    {story.category}
                  </Badge>
                  {story.videoUrl && (
                    <Badge variant="secondary" className="text-[10px] font-semibold bg-red-600 text-white flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> Video
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-600" />
                  <span>{story.publishedAt}</span>
                  <span className="text-slate-300">•</span>
                  <span>{story.readTime || "3 min read"}</span>
                </div>
                <h3 className="font-bold font-heading text-lg text-slate-900 line-clamp-2 leading-snug">
                  {story.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {story.excerpt}
                </p>
                {story.author?.name && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{story.author.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`/news-stories/${story.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Live
              </a>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(story)}
                  className="h-8 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200/70"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStoryToDelete(story.id)}
                  className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete Story"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {editingStory && (
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
                {editingStory.title ? `Edit Story: ${editingStory.title}` : "Publish New Story"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Updates will publish directly to the public Success Stories feed and database.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Story Title *
              </label>
              <Input
                required
                value={editingStory.title || ""}
                onChange={(e) =>
                  setEditingStory({ ...editingStory, title: e.target.value })
                }
                placeholder="e.g. Asad's Journey from Slum to University"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={editingStory.category || "Success Stories"}
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      category: e.target.value as StoryCategory,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Success Stories">Success Stories</option>
                  <option value="Blogs">Blogs</option>
                  <option value="Events">Events</option>
                  <option value="GJTF in Media">GJTF in Media</option>
                  <option value="Videos">Videos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Read Time
                </label>
                <Input
                  value={editingStory.readTime || ""}
                  onChange={(e) =>
                    setEditingStory({ ...editingStory, readTime: e.target.value })
                  }
                  placeholder="e.g. 4 min read"
                />
              </div>
            </div>

            {/* Media URLs Section */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary-600" /> Story Media Links
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cover Image URL *
                </label>
                <Input
                  required
                  value={editingStory.coverImage || ""}
                  onChange={(e) =>
                    setEditingStory({ ...editingStory, coverImage: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/... or /images/..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Video URL (Optional)
                </label>
                <Input
                  value={editingStory.videoUrl || ""}
                  onChange={(e) =>
                    setEditingStory({ ...editingStory, videoUrl: e.target.value })
                  }
                  placeholder="https://gjtfoundation.com/...mp4 or https://youtube.com/..."
                />
                <span className="text-[11px] text-slate-500">
                  Direct mp4 video link or YouTube embed link.
                </span>
              </div>
            </div>

            {/* Author Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author Name
                </label>
                <Input
                  value={editingStory.author?.name || ""}
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      author: {
                        name: e.target.value,
                        role: editingStory.author?.role || "Editorial Team",
                      },
                    })
                  }
                  placeholder="e.g. GJTF Communications Desk"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author Role / Desk
                </label>
                <Input
                  value={editingStory.author?.role || ""}
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      author: {
                        name: editingStory.author?.name || "GJTF Communications Desk",
                        role: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Field Reporter, Curriculum Lead"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Excerpt *
              </label>
              <Textarea
                required
                rows={2}
                value={editingStory.excerpt || ""}
                onChange={(e) =>
                  setEditingStory({ ...editingStory, excerpt: e.target.value })
                }
                placeholder="Brief 1-2 sentence preview..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Story Body Content *
              </label>
              <Textarea
                required
                rows={4}
                value={editingStory.content?.[0] || ""}
                onChange={(e) =>
                  setEditingStory({
                    ...editingStory,
                    content: [e.target.value, ...(editingStory.content?.slice(1) || [])],
                  })
                }
                placeholder="Write the story body text here..."
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300 rounded-xl w-auto shrink-0"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm rounded-xl w-auto shrink-0"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? "Publishing..." : "Save & Publish"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(storyToDelete)}
        onOpenChange={(open) => !open && setStoryToDelete(null)}
        title="Delete Success Story?"
        description="Are you sure you want to permanently delete this story? This action cannot be undone and will remove it from both the public website and the admin dashboard."
        onConfirm={confirmDeleteStory}
      />
    </div>
  );
}
