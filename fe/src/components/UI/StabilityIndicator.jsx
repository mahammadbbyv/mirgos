import React from 'react';
import PropTypes from 'prop-types';

/**
 * Stability indicator with color coding based on stability level
 */
const StabilityIndicator = ({ stability, showText = true, height = 2, className = '' }) => {
  // Default to 0 if not defined
  const stab = typeof stability === 'number' ? stability : 0;
  
  // Determine color based on stability level
  const color = stab > 70 
    ? 'bg-green-500' 
    : stab > 40 
      ? 'bg-yellow-500' 
      : 'bg-red-500';
      
  const textColor = stab > 70 
    ? 'text-green-400' 
    : stab > 40 
      ? 'text-yellow-400' 
      : 'text-red-400';
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-full bg-gray-700 h-${height} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${color}`}
          style={{ width: `${stab}%` }}
        />
      </div>
      {showText && (
        <span className={`text-xs whitespace-nowrap ${textColor}`}>
          {stab}%
        </span>
      )}
    </div>
  );
};

StabilityIndicator.propTypes = {
  stability: PropTypes.number,
  showText: PropTypes.bool,
  height: PropTypes.number,
  className: PropTypes.string
};

export default StabilityIndicator;
