// TMDB Movie Types

export interface TmdbMovieResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  media_type?: string;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: Array<{ id: number; name: string }>;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  homepage: string | null;
  imdb_id: string | null;
  original_language: string;
  popularity: number;
  adult: boolean;
  video: boolean;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  known_for_department: string;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TmdbVideoResponse {
  id: number;
  results: TmdbVideo[];
}

export interface TmdbImage {
  aspect_ratio: number;
  file_path: string;
  height: number;
  width: number;
  vote_average: number;
  vote_count: number;
}

export interface TmdbImageResponse {
  id: number;
  backdrops: TmdbImage[];
  logos: TmdbImage[];
  posters: TmdbImage[];
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbMovieResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreResponse {
  genres: TmdbGenre[];
}

export type TmdbTimeWindow = "day" | "week";
