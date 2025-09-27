import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { animals } from '../data/animals';
import { MapPin, Heart, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for pettable and non-pettable animals
const pettableIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const nonPettableIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapPage: React.FC = () => {
  // Filter animals that have location data
  const animalsWithLocation = animals.filter(animal => animal.location);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Animal <span className="text-blue-600">Map</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Explore where these animals can be found around the world.
          </p>
          
          {/* Legend */}
          {/* <div className="flex justify-center items-center gap-6 mb-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Heart className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Pettable Animals</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Non-Pettable Animals</span>
            </div>
          </div> */}
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-[600px] w-full">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {animalsWithLocation.map((animal) => (
                <Marker
                  key={animal.id}
                  position={[animal.location!.lat, animal.location!.lng]}
                  icon={animal.isPettable ? pettableIcon : nonPettableIcon}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={animal.image_url} 
                          alt={animal.name}
                          className="w-12 h-12 object-contain"
                        />
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{animal.name}</h3>
                          <div className="flex items-center gap-1">
                            {animal.isPettable ? (
                              <>
                                <Heart className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Pettable</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-600 font-medium">Not Pettable</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-300 pt-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-gray-500" />
                          <span className="text-sm text-gray-500 font-bold">Habitat</span>
                        </div>
                        <p className="text-sm text-gray-500 font-bold ps-1">{animal.location!.habitat}</p>
                      </div>
                      
                      {animal.gif_url && (
                        <div className="">
                          <img 
                            src={animal.gif_url} 
                            alt={`${animal.name} animation`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {animalsWithLocation.length}
            </div>
            <div className="text-gray-600">Animals</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {animalsWithLocation.filter(a => a.isPettable).length}
            </div>
            <div className="text-gray-600">Pettable Animals</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {animalsWithLocation.filter(a => !a.isPettable).length}
            </div>
            <div className="text-gray-600">Not Pettable Animals</div>
          </div>
        </div>
      </div>
    </div>
  );
};
