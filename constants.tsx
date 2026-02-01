
import { Semester, CourseColor } from './types';

const REGULAR_SEMESTERS: Semester[] = Array.from({ length: 8 }, (_, i) => ({
  id: `semester-${i + 1}`,
  title: `Semester ${i + 1}`,
  courses: [],
}));

export const INITIAL_SEMESTERS: Semester[] = [
  ...REGULAR_SEMESTERS,
  {
    id: 'semester-elective',
    title: 'MK Pilihan',
    courses: [],
  }
];

export const COLOR_OPTIONS = [
  { label: 'MKU (Mata Kuliah Umum)', value: CourseColor.Blue },
  { label: 'MKDK (Mata Kuliah Dasar Kependidikan)', value: CourseColor.Green },
  { label: 'MKBK (Mata Kuliah Bidang Keahlian)', value: CourseColor.White },
  { label: 'MKKPB (MK Keterampilan Proses Pembelajaran)', value: CourseColor.Purple },
  { label: 'MKPP (Mata Kuliah Pengembangan Pendidikan)', value: CourseColor.Gray },
  { label: 'MK Pilihan', value: CourseColor.Yellow },
];
