export type SearchMeta = {
  source?: string;
  requested?: number;
  returned?: number;
};

export type MatchStatus = 'Match' | 'No Match' | 'Neutral';

export type CompanyRow = {
  id: string;
  companyName: string;
  website: string;
  description: string;
  source: string;
  resultType: 'company';
  matchStatus: MatchStatus;
  significance: number;
  relevance: number;
  regionFocus?: string;
  segment?: string;
  tags?: string;
  date?: string;
};

export type PeopleRow = {
  id: string;
  personName: string;
  role: string;
  company: string;
  profileUrl: string;
  source: string;
  resultType: 'person';
  matchStatus: MatchStatus;
  significance: number;
  relevance: number;
  tags?: string;
  date?: string;
};

export type NewsRow = Record<string, string | number> & {
  id?: string;
};
