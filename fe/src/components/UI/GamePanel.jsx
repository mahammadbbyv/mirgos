import React from 'react';
import PropTypes from 'prop-types';
import { FaExpandAlt } from 'react-icons/fa';

/**
 * Game panel component with expandable section
 */
const GamePanel = ({ 
  title, 
  onExpand, 
  expandLabel = 'Expand', 
  className = '', 
  children 
}) => {
  return (
    <section className={`bg-gray-800/90 rounded-2xl p-6 min-w-[320px] shadow-lg border border-gray-700 flex-1 hover:scale-105 transition-all ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-300">{title}</h2>
        {onExpand && (
          <button
            className="ml-4 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-full text-white text-lg font-semibold shadow focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
            onClick={onExpand}
            aria-label={expandLabel}
          >
            <FaExpandAlt />
          </button>
        )}
      </div>
      {children}
    </section>
  );
};

GamePanel.propTypes = {
  title: PropTypes.node.isRequired,
  onExpand: PropTypes.func,
  expandLabel: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default GamePanel;
