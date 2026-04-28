export type ResourceType = "DOCTOR" | "INTERPRETER";

export type DoctorRow = {
  id: string;
  type: "DOCTOR";
  name: string;
  specialty: string | null;
  languages: string[];
  phone: string | null;
  email: string | null;
  address: string | null;
  practiceName: string | null;
  notes: string | null;
  isActive: boolean;
  availability: "HIGH" | "MEDIUM" | "LOW" | null;
  acceptsNewPatients: boolean;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
};

export type InterpreterRow = {
  id: string;
  type: "INTERPRETER";
  name: string;
  languages: string[];
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  availability: "HIGH" | "MEDIUM" | "LOW" | null;
  hourlyRate: number | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
};

export type ResourceRow = DoctorRow | InterpreterRow;
