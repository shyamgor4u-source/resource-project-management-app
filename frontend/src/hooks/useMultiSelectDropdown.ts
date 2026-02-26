import { useState, useMemo } from 'react';

export const SKILL_OPTIONS = [
  'UI',
  'UX',
  'Automation Testing',
  'Java',
  'Jenkins',
  'Azure',
  'Adobe',
  'React',
  'Angular',
  'Vue',
  'Node.js',
  'Python',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Selenium',
  'Cypress',
  'TypeScript',
  'JavaScript',
  'C#',
  '.NET',
  'Spring Boot',
  'Microservices',
  'DevOps',
  'Agile/Scrum',
  'Power BI',
  'Tableau',
  'Salesforce',
  'SAP',
];

export interface UseMultiSelectDropdownOptions {
  initialSelected?: string[];
  options?: string[];
}

export function useMultiSelectDropdown({
  initialSelected = [],
  options = SKILL_OPTIONS,
}: UseMultiSelectDropdownOptions = {}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter(
      (opt) => opt.toLowerCase().includes(q) && !selected.includes(opt)
    );
  }, [search, options, selected]);

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
    }
    setSearch('');
    setCustomInput('');
  };

  const removeItem = (item: string) => {
    setSelected((prev) => prev.filter((s) => s !== item));
  };

  const reset = (newSelected: string[] = []) => {
    setSelected(newSelected);
    setSearch('');
    setCustomInput('');
    setIsOpen(false);
  };

  return {
    selected,
    setSelected,
    search,
    setSearch,
    customInput,
    setCustomInput,
    isOpen,
    setIsOpen,
    filteredOptions,
    addItem,
    removeItem,
    reset,
  };
}
