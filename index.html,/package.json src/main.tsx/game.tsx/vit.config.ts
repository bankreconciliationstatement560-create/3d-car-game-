import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Trophy, Zap, Heart, Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface Obstacle {
id: number;
lane: number;
y: number;
type: 'car' | 'barrier' | 'truck';
}

interface PowerUp {
id: number;
lane: number;
y: number;
type: 'shield' | 'boost' | 'coin';
}

const LANES = [-1, 0, 1];
const LANE_WIDTH = 80;
const GAME_HEIGHT = 600;
const CAR_HEIGHT = 100;
const OBSTACLE_HEIGHT = 80;

export default function Game() {
const [, setLocation] = useLocation();
const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameover'>('playing');
const [playerLane, setPlayerLane] = useState(0);
const [score, setScore] = useState(0);
const [distance, setDistance] = useState(0);
const [lives, setLives] = useState(3);
const [speed, setSpeed] = useState(5);
const [obstacles, setObstacles] = useState<Obstacle[]>([]);
const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
const [hasShield, setHasShield] = useState(false);
const [boostActive, setBoostActive] = useState(false);
const [coins, setCoins] = useState(0);
const [combo, setCombo] = useState(0);
const [showCombo, setShowCombo] = useState(false);
const [soundEnabled, setSoundEnabled] = useState(true);
const [highScore, setHighScore] = useState(() => {
const saved = localStorage.getItem('neonRushHighScore');
return saved ? parseInt(saved) : 0;
});

const gameLoopRef = useRef<number | undefined>(undefined);
const lastObstacleRef = useRef(0);
const lastPowerUpRef = useRef(0);
const obstacleIdRef = useRef(0);

const restartGame = useCallback(() => {
setGameState('playing');
setPlayerLane(0);
setScore(0);
setDistance(0);
setLives(3);
setSpeed(5);
setObstacles([]);
setPowerUps([]);
setHasShield(false);
setBoostActive(false);
setCoins(0);
setCombo(0);
}, []);

const handleKeyDown = useCallback((e: KeyboardEvent) => {
if (gameState !== 'playing') {
if (e.key === ' ' || e.key === 'Enter') {
if (gameState === 'paused') setGameState('playing');
else if (gameState === 'gameover') restartGame();
}
return;
}

switch (e.key) {  
  case 'ArrowLeft':  
  case 'a':  
  case 'A':  
    setPlayerLane(prev => Math.max(-1, prev - 1));  
    break;  
  case 'ArrowRight':  
  case 'd':  
  case 'D':  
    setPlayerLane(prev => Math.min(1, prev + 1));  
    break;  
  case ' ':  
  case 'Escape':  
    setGameState('paused');  
    break;  
}

}, [gameState, restartGame]);

const handleTouch = useCallback((direction: 'left' | 'right') => {
if (gameState !== 'playing') return;
if (direction === 'left') {
setPlayerLane(prev => Math.max(-1, prev - 1));
} else {
setPlayerLane(prev => Math.min(1, prev + 1));
}
}, [gameState]);

useEffect(() => {
window.addEventListener('keydown', handleKeyDown);
return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleKeyDown]);

useEffect(() => {
if (gameState !== 'playing') return;

const gameLoop = () => {  
  const currentSpeed = boostActive ? speed * 1.5 : speed;  
    
  setDistance(prev => prev + currentSpeed);  
  setScore(prev => prev + Math.floor(currentSpeed * (combo > 0 ? combo * 0.5 + 1 : 1)));  
    
  if (distance > 0 && distance % 500 < currentSpeed) {  
    setSpeed(prev => Math.min(15, prev + 0.5));  
  }  

  setObstacles(prev => {  
    let newObstacles = prev  
      .map(obs => ({ ...obs, y: obs.y + currentSpeed }))  
      .filter(obs => obs.y < GAME_HEIGHT + 100);  

    if (Date.now() - lastObstacleRef.current > 1500 - speed * 50) {  
      const types: ('car' | 'barrier' | 'truck')[] = ['car', 'barrier', 'truck'];  
      const numObstacles = Math.random() > 0.7 ? 2 : 1;  
      const usedLanes: number[] = [];  
        
      for (let i = 0; i < numObstacles; i++) {  
        let lane;  
        do {  
          lane = LANES[Math.floor(Math.random() * LANES.length)];  
        } while (usedLanes.includes(lane));  
        usedLanes.push(lane);  
          
        newObstacles.push({  
          id: obstacleIdRef.current++,  
          lane,  
          y: -OBSTACLE_HEIGHT,  
          type: types[Math.floor(Math.random() * types.length)]  
        });  
      }  
      lastObstacleRef.current = Date.now();  
    }  

    return newObstacles;  
  });  

  setPowerUps(prev => {  
    let newPowerUps = prev  
      .map(pu => ({ ...pu, y: pu.y + currentSpeed }))  
      .filter(pu => pu.y < GAME_HEIGHT + 50);  

    if (Date.now() - lastPowerUpRef.current > 5000) {  
      const types: ('shield' | 'boost' | 'coin')[] = ['shield', 'boost', 'coin', 'coin', 'coin'];  
      newPowerUps.push({  
        id: obstacleIdRef.current++,  
        lane: LANES[Math.floor(Math.random() * LANES.length)],  
        y: -50,  
        type: types[Math.floor(Math.random() * types.length)]  
      });  
      lastPowerUpRef.current = Date.now();  
    }  

    return newPowerUps;  
  });  

  const playerX = playerLane * LANE_WIDTH;  
  const playerY = GAME_HEIGHT - CAR_HEIGHT - 20;  

  obstacles.forEach(obs => {  
    const obsX = obs.lane * LANE_WIDTH;  
    if (  
      Math.abs(obsX - playerX) < LANE_WIDTH * 0.7 &&  
      obs.y > playerY - OBSTACLE_HEIGHT &&  
      obs.y < playerY + CAR_HEIGHT  
    ) {  
      if (hasShield) {  
        setHasShield(false);  
        setObstacles(prev => prev.filter(o => o.id !== obs.id));  
        setCombo(prev => prev + 1);  
        setShowCombo(true);  
        setTimeout(() => setShowCombo(false), 500);  
      } else {  
        setLives(prev => {  
          const newLives = prev - 1;  
          if (newLives <= 0) {  
            setGameState('gameover');  
            if (score > highScore) {  
              setHighScore(score);  
              localStorage.setItem('neonRushHighScore', score.toString());  
            }  
          }  
          return newLives;  
        });  
        setObstacles(prev => prev.filter(o => o.id !== obs.id));  
        setCombo(0);  
      }  
    }  
  });  

  powerUps.forEach(pu => {  
    const puX = pu.lane * LANE_WIDTH;  
    if (  
      Math.abs(puX - playerX) < LANE_WIDTH * 0.7 &&  
      pu.y > playerY - 50 &&  
      pu.y < playerY + CAR_HEIGHT  
    ) {  
      setPowerUps(prev => prev.filter(p => p.id !== pu.id));  
      switch (pu.type) {  
        case 'shield':  
          setHasShield(true);  
          break;  
        case 'boost':  
          setBoostActive(true);  
          setTimeout(() => setBoostActive(false), 3000);  
          break;  
        case 'coin':  
          setCoins(prev => prev + 1);  
          setScore(prev => prev + 100);  
          break;  
      }  
    }  
  });  

  gameLoopRef.current = requestAnimationFrame(gameLoop);  
};  

gameLoopRef.current = requestAnimationFrame(gameLoop);  
return () => {  
  if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);  
};

}, [gameState, playerLane, obstacles, powerUps, speed, hasShield, boostActive, combo, score, highScore, distance]);

const getObstacleColor = (type: string) => {
switch (type) {
case 'car': return 'from-red-500 to-red-700';
case 'barrier': return 'from-yellow-500 to-orange-600';
case 'truck': return 'from-gray-500 to-gray-700';
default: return 'from-red-500 to-red-700';
}
};

const getPowerUpColor = (type: string) => {
switch (type) {
case 'shield': return 'from-cyan-400 to-blue-500';
case 'boost': return 'from-yellow-400 to-orange-500';
case 'coin': return 'from-yellow-300 to-yellow-500';
default: return 'from-green-400 to-green-600';
}
};

return (
<div className="min-h-screen bg-gradient-to-b from-[#0a0015] via-[#1a0030] to-[#0a0015] flex flex-col items-center justify-center p-4 overflow-hidden scanlines">
<div className="absolute inset-0 overflow-hidden pointer-events-none">
<div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-fuchsia-500/20 to-transparent" />
<div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
{[...Array(20)].map((_, i) => (
<motion.div
key={i}
className="absolute w-1 h-1 bg-white rounded-full"
style={{
left: ${Math.random() * 100}%,
top: ${Math.random() * 100}%,
}}
animate={{
opacity: [0.2, 1, 0.2],
scale: [1, 1.5, 1],
}}
transition={{
duration: 2 + Math.random() * 2,
repeat: Infinity,
delay: Math.random() * 2,
}}
/>
))}
</div>

<div className="relative z-10 w-full max-w-md">  
    <div className="flex justify-between items-center mb-4 px-2">  
      <div className="flex items-center gap-4">  
        <div className="flex items-center gap-1">  
          {[...Array(3)].map((_, i) => (  
            <Heart  
              key={i}  
              className={`w-6 h-6 transition-all ${  
                i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'  
              }`}  
            />  
          ))}  
        </div>  
        <div className="flex items-center gap-1 text-yellow-400">  
          <span className="font-display text-lg">{coins}</span>  
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-2 border-yellow-200" />  
        </div>  
      </div>  
      <div className="flex gap-2">  
        <button  
          onClick={() => setSoundEnabled(!soundEnabled)}  
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"  
          data-testid="button-sound-toggle"  
        >  
          {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}  
        </button>  
        <button  
          onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}  
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"  
          data-testid="button-pause"  
        >  
          {gameState === 'paused' ? <Play className="w-5 h-5 text-green-400" /> : <Pause className="w-5 h-5 text-white" />}  
        </button>  
      </div>  
    </div>  

    <div className="text-center mb-4">  
      <div className="font-display text-4xl font-bold text-glow-pink text-fuchsia-400">  
        {score.toLocaleString()}  
      </div>  
      <div className="text-sm text-cyan-400 font-display">  
        DISTANCE: {Math.floor(distance)}m • SPEED: {speed.toFixed(1)}x  
      </div>  
      {hasShield && (  
        <div className="text-xs text-blue-400 animate-pulse mt-1">SHIELD ACTIVE</div>  
      )}  
      {boostActive && (  
        <div className="text-xs text-orange-400 animate-pulse mt-1">BOOST ACTIVE</div>  
      )}  
    </div>  

    <div   
      className="relative mx-auto overflow-hidden rounded-2xl border-4 border-fuchsia-500/50 box-glow-pink"  
      style={{ width: 320, height: GAME_HEIGHT }}  
      data-testid="game-canvas"  
    >  
      <div   
        className="absolute inset-0 animate-road"  
        style={{  
          background: `  
            linear-gradient(90deg, transparent 0%, transparent 30%, rgba(255,0,255,0.1) 30%, rgba(255,0,255,0.1) 32%, transparent 32%, transparent 68%, rgba(255,0,255,0.1) 68%, rgba(255,0,255,0.1) 70%, transparent 70%, transparent 100%),  
            linear-gradient(180deg, rgba(0,255,255,0.05) 0px, transparent 10px, transparent 90px, rgba(0,255,255,0.05) 100px),  
            repeating-linear-gradient(180deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 20px, transparent 20px, transparent 40px),  
            linear-gradient(180deg, #1a0030 0%, #0d001a 100%)  
          `,  
          backgroundSize: '100% 100%, 100% 100px, 10px 40px, 100% 100%',  
        }}  
      />  

      <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-fuchsia-900/50 to-transparent" />  
      <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-fuchsia-900/50 to-transparent" />  

      {obstacles.map(obs => (  
        <motion.div  
          key={obs.id}  
          className={`absolute w-16 rounded-lg bg-gradient-to-b ${getObstacleColor(obs.type)} shadow-lg`}  
          style={{  
            left: 160 + obs.lane * LANE_WIDTH - 32,  
            top: obs.y,  
            height: obs.type === 'truck' ? 100 : OBSTACLE_HEIGHT,  
          }}  
          initial={{ scale: 0.5, opacity: 0 }}  
          animate={{ scale: 1, opacity: 1 }}  
        >  
          <div className="absolute inset-1 rounded bg-black/30" />  
          <div className="absolute top-2 left-2 right-2 h-3 rounded bg-white/20" />  
          {obs.type === 'car' && (  
            <>  
              <div className="absolute bottom-2 left-1 w-3 h-3 rounded-full bg-yellow-300" />  
              <div className="absolute bottom-2 right-1 w-3 h-3 rounded-full bg-yellow-300" />  
            </>  
          )}  
        </motion.div>  
      ))}  

      {powerUps.map(pu => (  
        <motion.div  
          key={pu.id}  
          className={`absolute w-10 h-10 rounded-full bg-gradient-to-br ${getPowerUpColor(pu.type)} shadow-lg`}  
          style={{  
            left: 160 + pu.lane * LANE_WIDTH - 20,  
            top: pu.y,  
          }}  
          animate={{  
            scale: [1, 1.2, 1],  
            rotate: [0, 180, 360],  
          }}  
          transition={{  
            duration: 1,  
            repeat: Infinity,  
          }}  
        >  
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">  
            {pu.type === 'shield' && '🛡️'}  
            {pu.type === 'boost' && '⚡'}  
            {pu.type === 'coin' && '💰'}  
          </div>  
        </motion.div>  
      ))}  

      <motion.div  
        className="absolute bottom-5"  
        style={{  
          left: 160 + playerLane * LANE_WIDTH - 30,  
          width: 60,  
          height: CAR_HEIGHT,  
        }}  
        animate={{  
          left: 160 + playerLane * LANE_WIDTH - 30,  
        }}  
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}  
      >  
        <div className={`relative w-full h-full ${hasShield ? 'animate-pulse' : ''}`}>  
          {hasShield && (  
            <div className="absolute -inset-3 rounded-full bg-cyan-400/30 animate-pulse border-2 border-cyan-400" />  
          )}  
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-700 rounded-t-3xl rounded-b-lg shadow-2xl">  
            <div className="absolute top-3 left-2 right-2 h-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-xl" />  
            <div className="absolute top-4 left-3 right-3 h-4 bg-gradient-to-b from-cyan-300/50 to-transparent rounded-t-lg" />  
            <div className="absolute bottom-8 left-1 w-4 h-6 bg-gray-900 rounded" />  
            <div className="absolute bottom-8 right-1 w-4 h-6 bg-gray-900 rounded" />  
            <div className="absolute bottom-2 left-2 w-4 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />  
            <div className="absolute bottom-2 right-2 w-4 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />  
            {boostActive && (  
              <>  
                <div className="absolute -bottom-4 left-3 w-3 h-8 bg-gradient-to-b from-orange-500 via-yellow-400 to-transparent rounded-full animate-pulse" />  
                <div className="absolute -bottom-4 right-3 w-3 h-8 bg-gradient-to-b from-orange-500 via-yellow-400 to-transparent rounded-full animate-pulse" />  
              </>  
            )}  
          </div>  
        </div>  
      </motion.div>  

      <AnimatePresence>  
        {showCombo && combo > 0 && (  
          <motion.div  
            className="absolute top-1/3 left-1/2 -translate-x-1/2 font-display text-4xl font-bold text-yellow-400 text-glow-yellow"  
            initial={{ scale: 0, opacity: 0 }}  
            animate={{ scale: 1.5, opacity: 1 }}  
            exit={{ scale: 0, opacity: 0 }}  
          >  
            COMBO x{combo}!  
          </motion.div>  
        )}  
      </AnimatePresence>  

      <AnimatePresence>  
        {gameState === 'paused' && (  
          <motion.div  
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6"  
            initial={{ opacity: 0 }}  
            animate={{ opacity: 1 }}  
            exit={{ opacity: 0 }}  
          >  
            <h2 className="font-display text-4xl text-cyan-400 text-glow-cyan">PAUSED</h2>  
            <button  
              onClick={() => setGameState('playing')}  
              className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-display text-xl hover:scale-105 transition-transform box-glow-pink"  
              data-testid="button-resume"  
            >  
              RESUME  
            </button>  
            <button  
              onClick={() => setLocation('/')}  
              className="px-6 py-2 bg-white/10 rounded-lg font-display hover:bg-white/20 transition-colors flex items-center gap-2"  
              data-testid="button-menu"  
            >  
              <Home className="w-5 h-5" /> MENU  
            </button>  
          </motion.div>  
        )}  
      </AnimatePresence>  

      <AnimatePresence>  
        {gameState === 'gameover' && (  
          <motion.div  
            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 p-6"  
            initial={{ opacity: 0 }}  
            animate={{ opacity: 1 }}  
            exit={{ opacity: 0 }}  
          >  
            <h2 className="font-display text-3xl text-red-500 text-glow-pink animate-pulse">GAME OVER</h2>  
            <div className="text-center space-y-2">  
              <div className="font-display text-5xl text-white">{score.toLocaleString()}</div>  
              <div className="text-cyan-400">Distance: {Math.floor(distance)}m</div>  
              <div className="text-yellow-400">Coins: {coins}</div>  
            </div>  
            {score >= highScore && score > 0 && (  
              <div className="flex items-center gap-2 text-yellow-400 animate-bounce">  
                <Trophy className="w-6 h-6" />  
                <span className="font-display">NEW HIGH SCORE!</span>  
              </div>  
            )}  
            <div className="text-sm text-gray-400">High Score: {highScore.toLocaleString()}</div>  
            <div className="flex gap-4 mt-4">  
              <button  
                onClick={restartGame}  
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-display text-lg hover:scale-105 transition-transform flex items-center gap-2"  
                data-testid="button-restart"  
              >  
                <RotateCcw className="w-5 h-5" /> RETRY  
              </button>  
              <button  
                onClick={() => setLocation('/')}  
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-display text-lg hover:scale-105 transition-transform flex items-center gap-2"  
                data-testid="button-home"  
              >  
                <Home className="w-5 h-5" /> MENU  
              </button>  
            </div>  
          </motion.div>  
        )}  
      </AnimatePresence>  
    </div>  

    <div className="flex justify-center gap-8 mt-6 md:hidden">  
      <button  
        onTouchStart={() => handleTouch('left')}  
        onClick={() => handleTouch('left')}  
        className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center text-3xl font-bold active:scale-90 transition-transform box-glow-pink"  
        data-testid="button-left"  
      >  
        ←  
      </button>  
      <button  
        onTouchStart={() => handleTouch('right')}  
        onClick={() => handleTouch('right')}  
        className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold active:scale-90 transit
