export interface Profile {
  id: number;
  name: string;
  skills: string[];
  experience: number;
  location: string;
  gender: string;
  linkedinUrl: string;
}

export interface ProfilesResponse {
  data: Profile[];
  total: number;
}