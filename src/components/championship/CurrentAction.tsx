import React from 'react';
import { Attempt } from '../../types/index';

interface CurrentActionProps {
  attempt: Attempt | null;
}

const CurrentAction: React.FC<CurrentActionProps> = ({ attempt }) => {
  if (!attempt) return null;

  return (
    <div className="bg-blue-100 border-2 border-blue-300 p-4 rounded-lg mt-8 mb-4 shadow-lg w-[700px]">
      <h3 className="text-l font-bold mb-2">Current Action</h3>
      <div className={`text-l ${attempt.result.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
        <span className="font-bold">{attempt.result.points} Points</span> - {attempt.result.description}
      </div>
    </div>
  );
};

export default CurrentAction;