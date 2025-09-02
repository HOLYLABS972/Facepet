'use client';

// Assets - using public paths
const assets = {
  loadingLogo: '/loading_logo.svg'
};
import { Loader2Icon } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex w-full grow justify-center">
      <div className="flex flex-col items-center justify-center">
        <img src={assets.loadingLogo} alt="loadingLogo" className="w-55" />
        <Loader2Icon className="stroke-primary animate-spin" size={25} />
      </div>
    </div>
  );
};

export default Loading;
