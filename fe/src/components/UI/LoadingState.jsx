import React from 'react';
import PropTypes from 'prop-types';
import BarLoader from 'react-spinners/BarLoader';

/**
 * Component for displaying loading and error states with a consistent UI 
 */
const LoadingState = ({ 
  type = 'loading', 
  title, 
  message, 
  buttons = [],
  color = '#3b82f6' // blue-500 default color
}) => {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img 
            src="/logo.png" 
            alt="Game Logo" 
            className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" 
          />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color={color} height={8} width={220} speedMultiplier={0.7} />
          
          {title && (
            <div className={`text-2xl font-semibold ${
              type === 'error' ? 'text-red-300' : 
              type === 'warning' ? 'text-yellow-200' : 
              'text-blue-200'
            } mt-4`}>
              {title}
            </div>
          )}
          
          {message && (
            <div className="text-gray-400 text-base mt-2">
              {message}
            </div>
          )}
          
          {buttons.length > 0 && (
            <div className="flex gap-4 mt-6">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  className={`${button.variant === 'primary' 
                    ? 'bg-blue-700 hover:bg-blue-800' 
                    : 'bg-gray-700 hover:bg-gray-800'} 
                    px-6 py-3 rounded-lg text-white font-bold shadow text-lg`}
                  onClick={button.onClick}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

LoadingState.propTypes = {
  type: PropTypes.oneOf(['loading', 'error', 'warning']),
  title: PropTypes.string,
  message: PropTypes.node,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.oneOf(['primary', 'secondary'])
    })
  ),
  color: PropTypes.string
};

export default LoadingState;
