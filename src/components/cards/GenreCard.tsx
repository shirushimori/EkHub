import { memo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface GenreCardProps {
  genre: string;
  className?: string;
  onClick?: () => void;
}

const genreColors: Record<string, string> = {
  Action: "from-red-600/40 to-red-900/40",
  Comedy: "from-yellow-600/40 to-yellow-900/40",
  Drama: "from-blue-600/40 to-blue-900/40",
  Horror: "from-purple-600/40 to-purple-900/40",
  "Sci-Fi": "from-cyan-600/40 to-cyan-900/40",
  Romance: "from-pink-600/40 to-pink-900/40",
  Thriller: "from-orange-600/40 to-orange-900/40",
  Animation: "from-green-600/40 to-green-900/40",
  Documentary: "from-teal-600/40 to-teal-900/40",
  Fantasy: "from-indigo-600/40 to-indigo-900/40",
  Adventure: "from-emerald-600/40 to-emerald-900/40",
  Crime: "from-slate-600/40 to-slate-900/40",
  Mystery: "from-violet-600/40 to-violet-900/40",
  War: "from-amber-600/40 to-amber-900/40",
  Western: "from-orange-700/40 to-yellow-900/40",
  Biography: "from-sky-600/40 to-sky-900/40",
  History: "from-stone-600/40 to-stone-900/40",
  Music: "from-fuchsia-600/40 to-fuchsia-900/40",
  "Sci Fi": "from-cyan-600/40 to-cyan-900/40",
  Sport: "from-lime-600/40 to-lime-900/40",
  Musical: "from-pink-500/40 to-pink-800/40",
  Family: "from-teal-500/40 to-teal-800/40",
  News: "from-blue-500/40 to-blue-800/40",
  TalkShow: "from-indigo-500/40 to-indigo-800/40",
  GameShow: "from-yellow-500/40 to-yellow-800/40",
  RealityTV: "from-rose-500/40 to-rose-800/40",
};

export const GenreCard = memo(function GenreCard({
  genre,
  className,
  onClick,
}: GenreCardProps) {
  const gradient = genreColors[genre] || "from-gray-600/40 to-gray-900/40";

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex h-[100px] min-w-[140px] items-end overflow-hidden rounded-xl p-3 text-left",
        className
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div className="absolute inset-0 bg-surface/60" />
      <span className="relative z-10 text-sm font-semibold text-primary">
        {genre}
      </span>
    </motion.button>
  );
});
