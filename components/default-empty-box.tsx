import Image from 'next/image';
interface DefaultEmptyBoxProps {
  image?: string;
  message?: string;
  imageSize?: number;
  bordered?: boolean;
  className?: string;
}
export const DefaultEmptyBox = ({
  image = '/images/empty-data-icon.svg',
  message = 'No data available',
  imageSize = 40,
  bordered = true,
  className = '',
}: DefaultEmptyBoxProps) => {
  return (
    <div
      className={`border ${
        bordered ? 'border-gray-200' : 'border-none'
      } rounded-lg p-12 ${className}`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center">
          <Image
            src={image}
            alt={message}
            width={imageSize}
            height={imageSize}
            className="h-10 w-10"
          />
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};
