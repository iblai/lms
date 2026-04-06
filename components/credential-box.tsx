import Image from 'next/image';
//import { useRouter } from "next/router";

type CredentialBoxProps = {
  name: string;
  image: string;
  issuedOn: string;
  key?: string;
  onClose?: () => void;
};

export function CredentialBox({ name, image, issuedOn, ...rest }: CredentialBoxProps) {
  //const router = useRouter();

  return (
    <div
      {...rest}
      className="cursor-pointer rounded-sm bg-[var(--sidebar-hover-bg)] p-3 transition-colors duration-300 hover:bg-[var(--sidebar-hover-bg)]"
      /* onClick={() => {
                if (onClose) onClose()
                router.push("/profile/credentials")
            }} */
    >
      <div className="flex items-start space-x-3">
        <div className="h-8 w-8 overflow-hidden">
          <Image
            src={image}
            alt={name}
            width={32}
            height={32}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--sidebar-text)]">{name}</p>
          <p className="text-[10px] text-[var(--text-light)]">Earned on: {issuedOn}</p>
        </div>
      </div>
    </div>
  );
}
