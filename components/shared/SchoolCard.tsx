import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, BookOpen, ArrowRight } from "lucide-react";
import { School } from "@/data/schools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SchoolCardProps {
  school: School;
}

export function SchoolCard({ school }: SchoolCardProps) {
  return (
    <div className="group rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={school.cardImage}
          alt={school.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60" />
        
        {/* Badges on top */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
          <Badge variant="default" className="bg-primary-800 text-white border-0 backdrop-blur-sm shadow-sm">
            {school.campusType}
          </Badge>
          <Badge variant="secondary" className="bg-white/95 text-slate-900 border-0 backdrop-blur-sm shadow-sm">
            {school.shift} Shift
          </Badge>
        </div>

        {/* Location banner */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white flex items-center gap-1.5 text-xs font-semibold drop-shadow-md">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{school.city}, {school.province}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
        <div>
          <h3 className="text-xl font-bold font-heading text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {school.name}
          </h3>
          <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {school.description}
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary-600" />
            <span>{school.classrooms} Classrooms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{school.currentStudents} Students</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">{school.city} Campus</span>
          <Link href={`/school/${school.slug}`} className="inline-block">
            <Button variant="primary" size="sm" className="gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm hover:shadow">
              View School
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
