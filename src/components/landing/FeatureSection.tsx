import { Check } from "lucide-react";

interface FeatureSectionProps {
  subtitle: string;
  title: string;
  description?: string;
  features: string[];
  reversed?: boolean;
}

export default function FeatureSection({ subtitle, title, description, features, reversed }: FeatureSectionProps) {
  return (
    <section className="py-24 px-6 bg-neuro-cream">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className={`space-y-8 ${reversed ? 'lg:order-2' : ''}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neuro-orange">{subtitle}</p>
          <h2 className="text-4xl md:text-6xl font-heading font-black text-neuro-navy leading-tight">{title}</h2>
          {description && (
            <p className="text-gray-500 text-lg font-medium leading-relaxed">{description}</p>
          )}
          <ul className="space-y-6">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-neuro-orange/10 rounded-xl flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-neuro-orange" />
                </div>
                <span className="font-bold text-neuro-navy">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`bg-neuro-navy rounded-2xl aspect-square flex items-center justify-center ${reversed ? 'lg:order-1' : ''}`}>
          <div className="text-6xl font-heading font-black text-white/10">NEURO</div>
        </div>
      </div>
    </section>
  );
}
