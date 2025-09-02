import advertisment from '@/public/assets/ad_header.png';
import Image from 'next/image';

const AdHeader = () => {
  return (
    <div className="absolute flex w-full items-center justify-center bg-black">
      <Image src={advertisment} alt="advertisment" />
    </div>
  );
};

export default AdHeader;
