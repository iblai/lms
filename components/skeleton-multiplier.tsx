interface SkeletonMultiplierProps {
  Skeleton: React.ElementType;
  multiplier: number;
}

export const SkeletonMultiplier = ({ Skeleton, multiplier }: SkeletonMultiplierProps) => {
  return Array.from({ length: multiplier }).map((_, index) => (
    <Skeleton data-testid="skeleton-multiplier" key={index} />
  ));
};
