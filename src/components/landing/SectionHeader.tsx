interface SectionHeaderProps {
  subtitle: string;
  title: string;
  description?: string;
}

export default function SectionHeader({ subtitle, title, description }: SectionHeaderProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neuro-orange mb-4">{subtitle}</p>
      <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy leading-tight mb-6">{title}</h2>
      {description && (
        <p className="text-gray-500 text-lg font-medium leading-relaxed">{description}</p>
      )}
    </div>
  );
}
