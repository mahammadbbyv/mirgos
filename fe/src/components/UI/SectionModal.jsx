import React from 'react';
import PropTypes from 'prop-types';

/**
 * Section modal wrapper component that displays content in a modal
 */
const SectionModal = ({ open, onClose, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-3xl shadow-2xl border-4 border-blue-700 p-14 max-w-6xl w-full min-h-[70vh] min-w-[70vw] relative">
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-white bg-gray-700 hover:bg-gray-800 rounded-full px-5 py-2 text-3xl font-bold z-10"
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

SectionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};

export default SectionModal;
