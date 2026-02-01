
export interface Course {
  id: string;
  name: string;
  sks: number;
  color: string;
  description?: string;
}

export interface Semester {
  id: string;
  title: string;
  courses: Course[];
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  pathType?: 'smooth' | 'grid' | 'straight';
  controlPoints?: { x: number; y: number }[];
}

export interface CurriculumState {
  semesters: Semester[];
  connections: Connection[];
}

export enum CourseColor {
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow',
  Red = 'red',
  Purple = 'purple',
  Gray = 'gray',
  White = 'white',
}
