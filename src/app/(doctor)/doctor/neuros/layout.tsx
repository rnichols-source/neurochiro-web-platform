import FeatureGate from '../FeatureGate';
import NeurosFrame from './NeurosFrame';

export default function NeurOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="neuros">
      <NeurosFrame>{children}</NeurosFrame>
    </FeatureGate>
  );
}
