export interface Job {
  id: number;
  role: string;
  company: string;
  industry: string[];
  location: string;
  jobType: string;
  locationType: string;
  experience: string;
  salary?: string;
  posted: string;
  isEarlyApplicant: boolean;
  matchScore: number;
  noH1B?: boolean;
  applicants: string;
}

export const jobs: Job[] = [
  {
    id: 1,
    role: "Senior Software Engineer (Full Stack)",
    company: "MaRe Head Spa System",
    industry: ["Health", "Wellness & Fitness", "Early Stage"],
    location: "United States",
    jobType: "Full-time",
    locationType: "Remote",
    experience: "Senior Level",
    posted: "1 hour ago",
    isEarlyApplicant: true,
    matchScore: 74,
    applicants: "Less than 25 applicants",
  },
  {
    id: 2,
    role: "Senior Full-Stack Engineer",
    company: "Clarity Pediatrics",
    industry: ["Healthcare", "Wellness", "Early Stage"],
    location: "United States",
    jobType: "Full-time",
    locationType: "Remote",
    experience: "7+ years exp",
    salary: "$150K/yr - $200K/yr",
    posted: "5 hours ago",
    isEarlyApplicant: false,
    matchScore: 74,
    noH1B: true,
    applicants: "71 applicants",
  },
  {
    id: 3,
    role: "Backend Engineer",
    company: "Airbnb",
    industry: ["Hospitality", "Technology"],
    location: "San Francisco, CA",
    jobType: "Full-time",
    locationType: "Hybrid",
    experience: "Mid Level",
    salary: "$160K/yr - $210K/yr",
    posted: "1 day ago",
    isEarlyApplicant: false,
    matchScore: 82,
    applicants: "Over 100 applicants",
  },
  {
    id: 4,
    role: "Frontend Engineer",
    company: "Neon Tech",
    industry: ["Cloud", "Developer Tools"],
    location: "San Francisco, CA",
    jobType: "Full-time",
    locationType: "Remote",
    experience: "Entry Level",
    salary: "$120K/yr",
    posted: "2 hours ago",
    isEarlyApplicant: true,
    matchScore: 90,
    applicants: "12 applicants",
  }
];
