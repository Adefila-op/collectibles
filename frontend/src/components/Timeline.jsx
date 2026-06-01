import React from 'react';

const Timeline = ({ timeline }) => {
  const statusColors = {
    completed: 'bg-green-500',
    active: 'bg-orange-500',
    pending: 'bg-gray-300'
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-900 mb-4">Swap Progress</h3>
      <div className="space-y-4">
        {timeline?.map((item, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-300'}`}></div>
              {idx < timeline.length - 1 && <div className="w-0.5 h-12 bg-gray-300 mt-2"></div>}
            </div>
            <div className="pb-4">
              <p className="font-medium text-sm text-gray-900">{item.step}</p>
              <p className="text-xs text-gray-600">{item.description}</p>
              <p className="text-xs text-gray-500 mt-1">{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
