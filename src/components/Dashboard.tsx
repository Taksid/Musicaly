import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Trash2,
  Play,
  ArrowRight,
  Disc,
  Clock,
  Mic,
  Radio,
  Folder,
  Plus,
} from 'lucide-react';
import { User, SongProject, ProjectType } from '../types';
import { TranslationDict } from '../i18n/translations';

interface DashboardProps {
  t: TranslationDict;
  currentUser: User;
  projects: SongProject[];
  onOpenUpload: () => void;
  onOpenSongGenerator: () => void;
  onOpenSongStudio: () => void;
  onOpenVoiceCloner: () => void;
  onOpenUniverseModel: () => void;
  onOpenProject: (project: SongProject) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenPricing: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  t,
  currentUser,
  projects,
  onOpenUpload,
  onOpenSongGenerator,
  onOpenSongStudio,
  onOpenVoiceCloner,
  onOpenUniverseModel,
  onOpenProject,
  onDeleteProject,
  onOpenPricing,
}) => {
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');

  const filteredProjects = projects.filter((p) => {
    if (filterType === 'all') return true;
    return (p.projectType || 'song_generator') === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242630] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">My Projects</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access your saved compositions, studio recording takes, and multi-track remixes.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSongGenerator}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md shadow-pink-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Song</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all' as const, label: 'All Projects' },
          { id: 'song_generator' as const, label: 'Song Generator' },
          { id: 'song_studio' as const, label: 'Song Studio' },
          { id: 'universe_remix' as const, label: 'Universe Remixes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterType === tab.id
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200 border border-[#242630]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Folder className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-100">No projects saved yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Start creating with one of the studio tools below. Your saved audio tracks and video renders will appear here.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenSongGenerator}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Create Song</span>
            </button>
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Song</span>
            </button>
            <button
              type="button"
              onClick={onOpenSongStudio}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Song Studio</span>
            </button>
            <button
              type="button"
              onClick={onOpenVoiceCloner}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Cloner</span>
            </button>
            <button
              type="button"
              onClick={onOpenUniverseModel}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Universe</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const activeVer = project.versions.find((v) => v.id === project.activeVersionId) || project.versions[0];
            const dateStr = new Date(project.updatedAt).toLocaleDateString();

            return (
              <div
                key={project.id}
                className="rounded-xl bg-[#18191f] border border-[#262832] p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">{project.title}</h3>
                      <div className="text-[11px] text-zinc-400 capitalize">
                        {project.projectType?.replace('_', ' ') || 'Song'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {activeVer && (
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span>{activeVer.genre || 'Original'}</span>
                      <span>•</span>
                      <span>{activeVer.tempo || '88 BPM'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#242630] text-xs">
                  <span className="text-[10px] text-zinc-500">{dateStr}</span>
                  <button
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
