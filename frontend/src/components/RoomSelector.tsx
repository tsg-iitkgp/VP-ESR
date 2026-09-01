import React from 'react';
import { Check } from 'lucide-react';

interface RoomSelectorProps {
  selectedRoom: string;
  onRoomSelect: (room: string) => void;
}

const rooms = [
  {
    id: 'ESR Room',
    name: 'ESR Room',
    description: 'Elected Students Representative - conference and meeting room',
  },
  {
    id: 'VP Room',
    name: 'VP Room',
    description: 'VP Room - Vice President meeting Room',
  }
];

export const RoomSelector: React.FC<RoomSelectorProps> = ({ selectedRoom, onRoomSelect }) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Select Room</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
        {rooms.map((room) => {
          const isSelected = selectedRoom === room.id;
          
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onRoomSelect(room.id)}
              className={`
                w-full p-3.5 sm:p-4 rounded-xl text-left transition-all relative flex items-start justify-between gap-3 border
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isSelected 
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary/30' 
                  : 'bg-secondary hover:bg-booking-hover text-secondary-foreground border-transparent'
                }
              `}
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm sm:text-base leading-tight">
                  {room.name}
                </div>
                <div className={`text-xs sm:text-sm mt-1 leading-relaxed ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                  {room.description}
                </div>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};