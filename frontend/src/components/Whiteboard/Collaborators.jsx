import { useCollabStore } from '../../stores/useCollabStore';
import { useCanvasStore } from '../../stores/useCanvasStore';

const Collaborators = () => {
  const { remoteCursors } = useCollabStore();
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Object.entries(remoteCursors).map(([socketId, cursor]) => {
        const screenX = cursor.x * zoom + pan.x;
        const screenY = cursor.y * zoom + pan.y;
        return (
          <div
            key={socketId}
            className="absolute flex flex-col items-center pointer-events-none transition-all duration-75 ease-linear will-change-transform"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
          >
          {/* SVG Cursor Pointer */}
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-indigo-400 drop-shadow-md"
          >
            <path d="M5.65376 21.2583L2.73032 3.12537C2.51177 1.76925 3.99222 0.72088 5.25301 1.33615L21.3653 9.19894C22.6568 9.82928 22.5694 11.7163 21.218 12.2217L14.0738 14.8931C13.6821 15.0396 13.3644 15.3341 13.1953 15.7197L10.2223 22.496C9.64506 23.8115 7.73359 23.6335 7.42436 22.2155L5.65376 21.2583Z" fill="currentColor" stroke="white" strokeWidth="1.5"/>
          </svg>

          {/* User Name Tag */}
          <div className="mt-1 px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-md shadow-lg whitespace-nowrap">
            {cursor.name || 'User'}
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default Collaborators;
