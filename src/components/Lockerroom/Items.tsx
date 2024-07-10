import React from 'react';

const MyItemsComponent: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">My Items</h2>
      <div className="border p-4 rounded">
        <p className="text-center text-gray-500">Coming Soon</p>
      </div>
    </div>
  );
};

export default MyItemsComponent;