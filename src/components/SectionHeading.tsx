import { SectionIcon, type SectionIconName } from './SectionIcon';

interface SectionHeadingProps {
  icon: SectionIconName;
  title: string;
  description?: string;
}

export function SectionHeading({ icon, title, description }: SectionHeadingProps) {
  return (
    <div className={`section-heading${description ? '' : ' compact'}`}>
      <SectionIcon name={icon} />
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
