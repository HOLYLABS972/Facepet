// Assets - using public paths
const assets = {
  advertisment: '/assets/ad_header.png'
};
import Image from 'next/image';

const AdHeader = () => {
  return (
    <div className="absolute flex w-full items-center justify-center bg-black">
      <Image src={assets.advertisment} alt="advertisment" />
    </div>
  );
};

export default AdHeader;
