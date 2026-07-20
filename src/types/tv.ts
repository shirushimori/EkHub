// TVMaze TV Types

export interface TvmazeShow {
  id: number;
  name: string;
  premiered: string | null;
  ended: string | null;
  status: string;
  rating: { average: number | null };
  image: { medium: string; original: string } | null;
  summary: string;
  genres: string[];
  runtime: number | null;
  averageRuntime: number | null;
  language: string;
  webChannel: { id: number; name: string; country: { name: string } | null } | null;
  network: { id: number; name: string; country: { name: string } | null } | null;
  schedule: { time: string; days: string[] };
  updated: number;
  externals?: { tvrage: number | null; thetvdb: number | null; imdb: string | null };
  links?: { self: { href: string }; previousepisode?: { href: string }; nextepisode?: { href: string } };
}

export interface TvmazeSearchResult {
  score: number;
  show: TvmazeShow;
}

export interface TvmazeSeason {
  id: number;
  url: string;
  name: string;
  number: number;
  episodeOrder: number | null;
  premiereDate: string | null;
  endDate: string | null;
  network: { id: number; name: string } | null;
  image: { medium: string; original: string } | null;
  summary: string | null;
}

export interface TvmazeEpisode {
  id: number;
  url: string;
  name: string;
  season: number;
  number: number;
  type: string;
  airdate: string | null;
  airtime: string | null;
  airstamp: string | null;
  runtime: number | null;
  rating: { average: number | null };
  image: { medium: string; original: string } | null;
  summary: string | null;
}

export interface TvmazeCastMember {
  person: {
    id: number;
    name: string;
    image: { medium: string; original: string } | null;
    country: { name: string } | null;
    birthday: string | null;
    deathday: string | null;
    gender: string | null;
  };
  character: {
    id: number;
    name: string;
    image: { medium: string; original: string } | null;
  };
  self: boolean;
  voice: boolean;
}

export interface TvmazeCrewMember {
  type: string;
  person: {
    id: number;
    name: string;
    image: { medium: string; original: string } | null;
  };
}

export interface TvmazeScheduleEntry {
  id: number;
  url: string;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  airstamp: string;
  runtime: number;
  rating: { average: number | null };
  show: {
    id: number;
    name: string;
    image: { medium: string; original: string } | null;
  };
}
