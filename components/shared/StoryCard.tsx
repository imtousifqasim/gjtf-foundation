import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Play, ArrowRight } from "lucide-react";
import { Story } from "@/data/stories";
import { Badge } from "@/components/ui/badge";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const isVideo = story.category === "Videos" || Boolean(story.videoUrl);

  return (
    <article className="group rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={story.coverImage}
          alt={story.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-40" />

        {/* Category Badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <Badge
            variant={story.category === "Videos" ? "accent" : "default"}
            className="backdrop-blur-sm shadow-sm font-semibold"
          >
            {story.category}
          </Badge>
        </div>

        {/* Video Play Icon Overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/95 text-amber-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-amber-600 ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5">
            <span>{story.publishedAt}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {story.readTime}
            </span>
          </div>

          <h3 className="text-xl font-bold font-heading text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
            {story.title}
          </h3>

          <p className="mt-2.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {story.excerpt}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            href={`/news-stories/${story.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group/link"
          >
            Read Story
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
          </Link>
          <span className="text-xs text-slate-500 font-medium">
            {story.author.name}
          </span>
        </div>
      </div>
    </article>
  );
}
