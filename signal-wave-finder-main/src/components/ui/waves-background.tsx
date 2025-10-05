const WavesBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-full h-full opacity-20"
        viewBox="0 0 1440 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,400 C360,300 720,500 1440,400 L1440,800 L0,800 Z"
          fill="url(#wave1)"
          className="animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <path
          d="M0,500 C360,400 720,600 1440,500 L1440,800 L0,800 Z"
          fill="url(#wave2)"
          className="animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(0, 70%, 50%)" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 70%, 50%)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default WavesBackground;
