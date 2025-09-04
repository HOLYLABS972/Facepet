'use client';

import React from 'react';

// Define the props type for the component
interface GetStartedHeaderProps {
  title: string;
}

// Correctly declare the functional component with props
const GetStartedHeader: React.FC<GetStartedHeaderProps> = ({ title }) => {
  return (
    <div>
      <h1 className="p-3 text-center text-2xl font-semibold">{title}</h1>
    </div>
  );
};

export default GetStartedHeader;
