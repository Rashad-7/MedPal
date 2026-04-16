import { DoctorDocument } from "src/DB/model/doctor.model";

interface SearchParams {
  fullName?: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  address?: string;
  rate?: number;
  page?: string;
  limit?: string;
}
 
interface PaginatedDoctorsResponse {
  doctors: DoctorDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}