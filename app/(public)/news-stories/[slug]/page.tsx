import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  ArrowLeft,
  Calendar,
  Share2,
  Bookmark,
  Heart,
  User,
} from "lucide-react";
import { stories, getStoryBySlug, Story } from "@/data/stories";
import { createAdminClient } from "@/lib/supabase/server";
import { StoryCard } from "@/components/shared/StoryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return stories.map((story) => ({
    slug: story.slug,
  }));
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let story: Story | undefined;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      story = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        category: (data.category || "Success Stories") as any,
        excerpt: data.excerpt || "",
        publishedAt: data.published_at
          ? new Date(data.published_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "Recent",
        readTime: "4 min read",
        coverImage: data.cover_image_url || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900",
        videoUrl: data.video_url || undefined,
        author: {
          name: data.author_name || "GJTF Editorial",
          role: data.author_role || "Communications",
        },
        content: data.body ? data.body.split("\n\n") : [""],
      };
    }
  } catch (err) {
    // Fallback
  }

  if (!story) {
    story = getStoryBySlug(slug);
  }

  if (!story) {
    notFound();
  }

  const relatedStories = stories
    .filter((s) => s.id !== story.id)
    .slice(0, 3);

  return (
    <article className="space-y-12 md:space-y-20 pb-20">
      {/* Top Banner */}
      <section className="bg-gradient-to-b from-warm-100 to-warm-50 py-12 md:py-16 border-b border-warm-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Link
            href="/news-stories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Stories
          </Link>

          <div className="flex items-center gap-3">
            <Badge variant="default">{story.category}</Badge>
            <span className="text-xs text-charcoal-muted flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {story.publishedAt}
            </span>
            <span className="text-xs text-charcoal-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {story.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-charcoal-deep tracking-tight leading-tight">
            {story.title}
          </h1>

          <p className="text-lg sm:text-xl text-charcoal-muted leading-relaxed font-light">
            {story.excerpt}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-warm-200 text-xs sm:text-sm text-charcoal-muted">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-charcoal-deep">{story.author.name}</div>
                <div className="text-xs text-charcoal-muted">{story.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image & Body Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-xl bg-warm-100">
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover"
          />
        </div>

        <div className="prose prose-lg max-w-none text-charcoal space-y-6 leading-relaxed">
          {story.content.map((paragraph, idx) => (
            <p key={idx} className="text-base sm:text-lg text-charcoal-muted leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Support CTA inside story */}
        <div className="p-8 rounded-3xl bg-primary-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold font-heading">
              Help us write more stories of triumph
            </h3>
            <p className="text-xs sm:text-sm text-primary-200">
              Your Zakat and donations enable out-of-school children to step into classrooms.
            </p>
          </div>
          <Link href="/donate-now">
            <Button variant="primary" size="md" className="gap-2 px-6 py-2.5 font-bold whitespace-nowrap rounded-xl shadow-sm bg-white text-primary-950 hover:bg-slate-100">
              <Heart className="w-4 h-4 fill-red-500 text-red-500 mr-1.5" />
              Donate Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Related Stories */}
      {relatedStories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-warm-200">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-charcoal-deep">
              Related Stories & Features
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedStories.map((rel) => (
              <StoryCard key={rel.id} story={rel} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
