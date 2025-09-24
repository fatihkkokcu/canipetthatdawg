export interface Animal {
    id: string;
    name: string;
    image_url: string;
    isPettable: boolean;
    gif_url: string;
    family: string;
    // Mark whether the user has petted this animal (bucket list UX)
    isPetted?: boolean;
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
