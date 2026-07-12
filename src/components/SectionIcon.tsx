export type SectionIconName = 'data' | 'settings' | 'summary' | 'reports';

interface SectionIconProps {
  name: SectionIconName;
}

const paths: Record<SectionIconName, React.ReactNode> = {
  data: (
    <>
      <ellipse cx="10" cy="5" rx="6.5" ry="2.5" />
      <path d="M3.5 5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V5" />
      <path d="M3.5 10v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 5h12M7 10h9M4 15h12" />
      <circle cx="7" cy="5" r="1.5" />
      <circle cx="13" cy="10" r="1.5" />
      <circle cx="8" cy="15" r="1.5" />
    </>
  ),
  summary: (
    <>
      <path d="M4 5.5 6 7.5 9.5 4M11 6h5M4 11l2 2 3.5-3.5M11 11.5h5M4 16.5h12" />
    </>
  ),
  reports: (
    <>
      <path d="M6 2.5h6l3 3v12H6z" />
      <path d="M12 2.5v3h3M8.5 10h4M8.5 13h4" />
    </>
  ),
};

export function SectionIcon({ name }: SectionIconProps) {
  return (
    <span className="section-icon" aria-hidden="true">
      <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </svg>
    </span>
  );
}
