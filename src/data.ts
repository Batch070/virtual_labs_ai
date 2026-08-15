export type Category = 'Physics' | 'Chemistry' | 'Biology' | 'Computer Science';

export interface Lab {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  imagePlaceholder: string;
  featured?: boolean;
  estimatedTime: number; // in minutes
}

export const LABS: Lab[] = [
  {
    id: 'pendulum-01',
    title: 'Simple Pendulum Dynamics',
    description: 'Explore the relationship between string length, mass, and the period of a pendulum using real-time motion.',
    category: 'Physics',
    difficulty: 'Beginner',
    imagePlaceholder: 'bg-blue-600',
    featured: true,
    estimatedTime: 15,
  },
  {
    id: 'boyles-law-01',
    title: 'Boyle\'s Law: Pressure & Volume',
    description: 'Investigate the inverse relationship between the pressure and volume of a gas at constant temperature.',
    category: 'Chemistry',
    difficulty: 'Intermediate',
    imagePlaceholder: 'bg-emerald-600',
    featured: true,
    estimatedTime: 20,
  },
  {
    id: 'population-01',
    title: 'Bacterial Population Growth',
    description: 'Simulate logistic growth of a bacteria population under varying environmental carrying capacities and reproduction rates.',
    category: 'Biology',
    difficulty: 'Beginner',
    imagePlaceholder: 'bg-rose-600',
    featured: true,
    estimatedTime: 25,
  },
  {
    id: 'titration-01',
    title: 'Acid-Base Titration',
    description: 'Determine the concentration of an unknown acid solution using a strong base.',
    category: 'Chemistry',
    difficulty: 'Intermediate',
    imagePlaceholder: 'bg-emerald-600',
    estimatedTime: 30,
  },
  {
    id: 'cell-01',
    title: 'Mitosis Observation',
    description: 'Identify and analyze the stages of cell division in onion root tip cells under varied magnifications.',
    category: 'Biology',
    difficulty: 'Beginner',
    imagePlaceholder: 'bg-rose-600',
    estimatedTime: 20,
  },
  {
    id: 'circuit-01',
    title: 'Ohm’s Law in DC Circuits',
    description: 'Build basic circuits and measure voltage, current, and resistance to verify standard electrical models.',
    category: 'Physics',
    difficulty: 'Beginner',
    imagePlaceholder: 'bg-amber-500',
    estimatedTime: 25,
  },
  {
    id: 'algo-01',
    title: 'Sorting Algorithms Visualized',
    description: 'Visualize how Quick Sort, Merge Sort, and Bubble Sort operate on randomized data arrays.',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    imagePlaceholder: 'bg-indigo-600',
    estimatedTime: 40,
  },
  {
    id: 'projectile-01',
    title: 'Projectile Motion',
    description: 'Analyze the parabolic trajectory of a projectile under the influence of gravity.',
    category: 'Physics',
    difficulty: 'Intermediate',
    imagePlaceholder: 'bg-blue-800',
    estimatedTime: 30,
  },
  {
    id: 'enzyme-01',
    title: 'Enzyme Kinetics',
    description: 'Study how substrate concentration affects the rate of enzyme-catalyzed reactions.',
    category: 'Biology',
    difficulty: 'Advanced',
    imagePlaceholder: 'bg-rose-800',
    estimatedTime: 45,
  },
  {
    id: 'binary-01',
    title: 'Binary Numeral Systems',
    description: 'Learn base-2 numbering, flip bits, and observe real-time decimal conversions.',
    category: 'Computer Science',
    difficulty: 'Beginner',
    imagePlaceholder: 'bg-indigo-800',
    estimatedTime: 15,
  },
  {
    id: 'logic-01',
    title: 'Logic Gates Simulator',
    description: 'Build and simulate digital circuits by connecting basic logic gates.',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    imagePlaceholder: 'bg-emerald-800',
    estimatedTime: 30,
  },
  {
    id: 'memory-01',
    title: 'Computer RAM Architecture',
    description: 'Inspect memory addresses, write bytes, and explore hexadecimal storage.',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    imagePlaceholder: 'bg-zinc-800',
    estimatedTime: 20,
  },
  {
    id: 'os-01',
    title: 'Operating System Internals',
    description: 'Visualize CPU scheduling, process queues, and RAM allocation in real-time.',
    category: 'Computer Science',
    difficulty: 'Advanced',
    imagePlaceholder: 'bg-[#1A1A1A]',
    estimatedTime: 25,
  },
  {
    id: 'mmu-01',
    title: 'Memory Management Unit (MMU)',
    description: 'Explore virtual memory, page tables, and page faults dynamically.',
    category: 'Computer Science',
    difficulty: 'Advanced',
    imagePlaceholder: 'bg-purple-900',
    estimatedTime: 20,
  },
  {
    id: 'ds-01',
    title: 'Data Structures Explorer',
    description: 'Interactive visual guide to linear and non-linear data structures.',
    category: 'Computer Science',
    difficulty: 'Beginner',
    imagePlaceholder: 'bg-emerald-900',
    estimatedTime: 20,
  }
];
