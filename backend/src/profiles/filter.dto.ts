export class FilterDto {
  skills?: string; // comma-separated list
  experience?: number;
  location?: string;
  gender?: string;
  page?: number;
  limit?: number;
}