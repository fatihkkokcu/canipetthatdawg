export interface Animal {
    id: string;
    name: string;
    image_url: string;
    isPettable: boolean;
    gif_url: string;
    family: string;
    location?: {
      lat: number;
      lng: number;
      habitat: string;
    };
  }
  
  export interface GuessResult {
    animal: Animal;
    userGuess: boolean;
    isCorrect: boolean;
  }