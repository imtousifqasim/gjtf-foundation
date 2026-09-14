"use client";

import * as React from "react";
import Image from "next/image";
import { stories as initialStories, Story } from "@/data/stories";
import { StoryCard } from "@/components/shared/StoryCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function NewsStoriesPage() {
  const [storiesList, setStoriesList] = React.useState<Story[]>(initialStories);

  React.useEffect(() => {
    async function loadLiveStories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("stories")
          .select("*")
          .order("published_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Story[] = data.map((s: any) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            category: s.category || "Success Stories",
            excerpt: s.excerpt || "",
            publishedAt: s.published_at
              ? new Date(s.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
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
        // Fallback to static stories
      }
    }
    loadLiveStories();
  }, []);

  return (
    <div className="space-y-12 md:space-y-16 pb-20">
      {/* Hero Header - Proportionate & Elegant */}
      <section className="relative min-h-[35vh] sm:min-h-[38vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1920&auto=format&fit=crop"
            alt="Children in school"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/85 to-slate-950/85" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center text-white space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-blue-300 text-xs font-semibold tracking-wider uppercase border border-white/15 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Voices of Hope & Transformation
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-snug text-white">
            Success Stories & News
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-xl mx-auto font-normal">
            Inspiring journeys of our alumni, volunteer milestones, educational partnerships, and media features across Pakistan.
          </p>
        </div>
      </section>

      {/* Tabs and Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="text-xs sm:text-sm font-semibold">All Stories</TabsTrigger>
              <TabsTrigger value="Success Stories" className="text-xs sm:text-sm font-semibold">Success Stories</TabsTrigger>
              <TabsTrigger value="Blogs" className="text-xs sm:text-sm font-semibold">Blogs</TabsTrigger>
              <TabsTrigger value="Events" className="text-xs sm:text-sm font-semibold">Events</TabsTrigger>
              <TabsTrigger value="GJTF in Media" className="text-xs sm:text-sm font-semibold">GJTF in Media</TabsTrigger>
              <TabsTrigger value="Videos" className="text-xs sm:text-sm font-semibold">Videos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storiesList.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </TabsContent>

          {["Success Stories", "Blogs", "Events", "GJTF in Media", "Videos"].map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storiesList
                  .filter((s) => s.category === category)
                  .map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}
