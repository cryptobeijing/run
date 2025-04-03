"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  DependencyList,
  useCallback,
} from "react";
import { type Address as AddressType } from "viem";
//import { useOpenUrl } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  ConnectWalletText,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  EthBalance,
  Address,
  Avatar,
} from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
//import ArrowSvg from "../svg/ArrowSvg";

//const MAX_SCORES = 8;
const FPS = 60;
const MS_PER_FRAME = 1000 / FPS;
const COLORS = {
  blue: "#0052FF",
  white: "#FFFFFF",
  black: "#000000",
  random: () =>
    `#${Math.floor(Math.random() * 12582912)
      .toString(16)
      .padStart(6, "0")}`,
};

// New game constants
const GAME_HEIGHT = 300;
const GROUND_Y = GAME_HEIGHT - 50 + 95 + 35;
const RUNNER_WIDTH = 30;
const RUNNER_HEIGHT = 50;
const RUNNER_X_POSITION = 100;
const RUNNER_Y_POSITION = GROUND_Y - RUNNER_HEIGHT;
const OBSTACLE_WIDTH = 25;
const OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPEED = 4;
const GRAVITY = 0.4;
const JUMP_FORCE = -10;

const GameState = {
  INTRO: 0,
  PAUSED: 1,
  RUNNING: 2,
  WON: 3,
  DEAD: 4,
  AWAITINGNEXTLEVEL: 5,
};

const MoveState = {
  NONE: 0,
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4,
};

export type Score = {
  attestationUid: string;
  transactionHash: string;
  address: AddressType;
  score: number;
};

/*type Attestation = {
  decodedDataJson: string;
  attester: string;
  time: string;
  id: string;
  txid: string;
};*/

/*async function fetchLastAttestations() {
  const query = `
    query GetAttestations {
      attestations(
        where: { schemaId: { equals: "${SCHEMA_UID}" } }
        orderBy: { time: desc }
        take: 8
      ) {
        decodedDataJson
        attester
        time
        id
        txid
      }
    }
  `;

  const response = await fetch(EAS_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  return (data?.attestations ?? [])
    .map((attestation: Attestation) => {
      const parsedData = JSON.parse(attestation?.decodedDataJson ?? "[]");
      const pattern = /(0x[a-fA-F0-9]{40}) scored (\d+) on minikit/;
      const match = parsedData[0].value?.value?.match(pattern);
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, address, score] = match;
        return {
          score: parseInt(score),
          address,
          attestationUid: attestation.id,
          transactionHash: attestation.txid,
        };
      }
      return null;
    })
    .sort((a: Score, b: Score) => b.score - a.score);
}*/

const LevelMaps: {
  [key: number]: { x1: number; y1: number; width: number; height: number }[];
} = {
  1: [
    { x1: 0, y1: 0, width: 10, height: 500 },
    { x1: 0, y1: 0, width: 500, height: 10 },
    { x1: 490, y1: 0, width: 10, height: 500 },
    { x1: 0, y1: 490, width: 500, height: 10 },
  ],
};

function useKonami(gameState: number) {
  const CODE = [
    MoveState.UP,
    MoveState.UP,
    MoveState.DOWN,
    MoveState.DOWN,
    MoveState.LEFT,
    MoveState.RIGHT,
    MoveState.LEFT,
    MoveState.RIGHT,
  ];
  const [konami, setKonami] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);

  const updateSequence = (input: number) => {
    if (!konami && gameState === GameState.INTRO) {
      const newSequence = sequence.concat(input);
      if (newSequence.length > CODE.length) {
        newSequence.shift();
      }
      if (newSequence.join(",") === CODE.join(",")) {
        setKonami(true);
        console.log("Slow motion activated!");
      } else {
        setSequence(newSequence);
      }
    }
  };

  return { konami, updateSequence };
}

type ControlButtonProps = {
  className?: string;
  children?: React.ReactNode;
  onClick: () => void;
};

function ControlButton({ children, onClick, className }: ControlButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
      className={`w-12 h-12 bg-[#0052FF] rounded-full cursor-pointer select-none
        transition-all duration-150 border-[1px] border-[#0052FF] ${className}
        ${
          isPressed
            ? "translate-y-1 [box-shadow:0_0px_0_0_#002299,0_0px_0_0_#0033cc33] border-b-[0px]"
            : "[box-shadow:0_5px_0_0_#002299,0_8px_0_0_#0033cc33]"
        }`}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function WalletControl() {
  return (
    <Wallet className="[&>div:nth-child(2)]:!opacity-20 md:[&>div:nth-child(2)]:!opacity-100">
      <ConnectWallet className="w-12 h-12 bg-[#0052FF] rounded-full hover:bg-[#0052FF] focus:bg-[#0052FF] cursor-pointer select-none transition-all duration-150 border-[1px] border-[#0052FF] min-w-12 [box-shadow:0_5px_0_0_#002299,0_8px_0_0_#0033cc33]">
        <ConnectWalletText>{""}</ConnectWalletText>
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}

type ControlButtonsProps = {
  gameState: number;
  handleMobileGameState: () => void;
};

function ControlButtons({
  gameState,
  handleMobileGameState,
}: ControlButtonsProps) {
  const { address } = useAccount();

  return (
    <>
      <div className="absolute left-8 top-16 w-24">
        <ControlButton className="block" onClick={handleMobileGameState} />
        <div className="ml-6 w-16 text-center -rotate-45 leading-[1.2]">
          {gameState === GameState.RUNNING ? "PAUSE" : "PLAY"}
        </div>
      </div>
      <div className="absolute right-0 top-4 w-24">
        <WalletControl />
        <div className="ml-4 w-20 text-center -rotate-45 leading-[1.2]">
          {address ? "LOGOUT" : "LOGIN"}
        </div>
      </div>
    </>
  );
}

type StatsProps = {
  score: number;
  level: number;
  width?: number;
};

function Stats({ score, level, width = 390 }: StatsProps) {
  return (
    <div className="grid grid-cols-2" style={{ width }}>
      <div className="text-lg mb-4 w-[200px]">LEVEL</div>
      <div className="text-lg mb-4 text-right">{level}</div>
      <div className="text-lg mb-4 w-[200px]">SCORE</div>
      <div className="text-lg mb-4 text-right">{score}</div>
    </div>
  );
}

type AwaitingNextLevelProps = {
  score: number;
  level: number;
};

function AwaitingNextLevel({ score, level }: AwaitingNextLevelProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-20 m-[10px] mb-[30px]">
      <h1 className="text-5xl mb-4">CONGRATULATION!</h1>
      <Stats score={score} level={level} />
      <p className="absolute bottom-4 text-lg">
        Press play or enter to play again
      </p>
    </div>
  );
}

type DeadProps = {
  score: number;
  level: number;
  isWin: boolean;
};

export function Dead({ score, level, isWin }: DeadProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-20 m-[10px] mb-[30px]">
      <h1 className="text-6xl mb-4">{isWin ? "YOU WON!" : "GAME OVER"}</h1>
      <Stats score={score} level={level} width={250} />
      <p className="text-lg mb-4 absolute bottom-0">
        Press play or enter to play again
      </p>
    </div>
  );
}

/*function HighScores() {
  const openUrl = useOpenUrl();

  const handleHighScoreClick = (score: Score) => {
    openUrl(`https://basescan.org/tx/${score.transactionHash}`);
  };

  return (
    <div className="flex flex-col items-center justify-center absolute top-32 w-[80%]">
      <h1 className="text-2xl mb-4">RECENT HIGH SCORES</h1>
      {fetchLastAttestations()
        .then(scores => scores?.sort((a: Score, b: Score) => b.score - a.score)
          .map((score: Score, index: number) => (
            <button
              type="button"
              key={score.attestationUid}
              className="flex items-center w-full"
              onClick={() => handleHighScoreClick(score)}
            >
              <span className="text-black w-8">{index + 1}.</span>
              <div className="flex items-center flex-grow">
                <Identity
                  className="!bg-inherit space-x-1 px-0 [&>div]:space-x-2"
                  address={score.address}
                >
                  <Name className="text-black" />
                </Identity>
                <div className="px-2">
                  <ArrowSvg />
                </div>
              </div>
              <div className="text-black text-right flex-grow">{score.score}</div>
            </button>
          )))}
    </div>
  );
}*/

type IntroProps = {
  konami: boolean;
};

function Intro({  }: IntroProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-white/70 z-20 m-[10px] mb-[30px] pb-6">
      <div className="absolute top-12 flex items-center justify-center w-full">
        <div className="flex items-center space-x-8">
          <h1 className="text-6xl font-bold text-[#0052FF]">R</h1>
          <h1 className="text-6xl font-bold text-[#0052FF]">U</h1>
          <h1 className="text-6xl font-bold text-[#0052FF]">N</h1>
        </div>
        <h2 className="text-2xl font-bold text-[#0052FF] text-center mt-2 absolute top-16 left-1/2 transform -translate-x-1/2">to the Base Home</h2>
      </div>
      <div className="absolute bottom-4">Press play or enter to start</div>
    </div>
  );
}

let msPrev = performance.now();
const useGameLoop = (callback: () => void, dependencies: DependencyList) => {
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      const msNow = performance.now();
      const delta = msNow - msPrev;
      if (delta > MS_PER_FRAME) {
        callback();
        msPrev = msNow - (delta % MS_PER_FRAME);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, callback]);
};

type Runner = {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
};

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  isSpecial?: boolean;
};

const Run = () => {
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const runnerCanvasRef = useRef<HTMLCanvasElement>(null);
  const scoreCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(1);
  const startTimeRef = useRef<number | null>(null);
  const lastObstacleTimeRef = useRef<number | null>(null);
  const nextObstacleIntervalRef = useRef<number>(1000);
  const runnerRef = useRef<Runner>({
    x: RUNNER_X_POSITION,
    y: RUNNER_Y_POSITION,
    velocityY: 0,
    isJumping: false,
  });
  const [gameState, setGameState] = useState(GameState.INTRO);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState({ total: 0, current: 0 });
  const [isWin, setIsWin] = useState(false);
  const [konami, setKonami] = useState(false);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const obstaclesRef = useRef<Obstacle[]>([]);

  const { konami: konamiFromUseKonami, updateSequence } = useKonami(gameState);

  const jump = useCallback(() => {
    if (!runnerRef.current.isJumping && gameState === GameState.RUNNING) {
      runnerRef.current.velocityY = JUMP_FORCE;
      runnerRef.current.isJumping = true;
    }
  }, [gameState]);

  const getStartingScore = useCallback(
    (level: number, adjust = false) => {
      const startingScore = 2000 + (level - 1) * 500;
      if (adjust) {
        return konami ? startingScore + 1 : startingScore + 2;
      }
      return startingScore;
    },
    [konami],
  );

  const updateGameState = useCallback(() => {
    setGameState((prev) => {
      switch (prev) {
        case GameState.RUNNING:
          return GameState.PAUSED;
        case GameState.PAUSED:
        case GameState.INTRO:
          startTimeRef.current = performance.now();
          lastObstacleTimeRef.current = null;
          nextObstacleIntervalRef.current = 1000;
          return GameState.RUNNING;
        case GameState.WON:
        case GameState.DEAD:
        case GameState.AWAITINGNEXTLEVEL:
          // Reset all game state
          runnerRef.current = {
            x: RUNNER_X_POSITION,
            y: RUNNER_Y_POSITION,
            velocityY: 0,
            isJumping: false
          };
          setScore({ total: getStartingScore(1), current: 0 });
          obstaclesRef.current = [];
          setLevel(1);
          startTimeRef.current = null;
          lastObstacleTimeRef.current = null;
          nextObstacleIntervalRef.current = 1000;
          // Force a clean restart by first going to intro state
          return GameState.INTRO;
        default:
          return prev;
      }
    });
  }, [getStartingScore, setGameState]);

  useEffect(() => {
    const handleResize = () => {
      setScale(
        Math.min(
          window.document.body.clientWidth / 520,
          window.document.body.clientHeight / 520,
          1,
        ),
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault(); // Prevent space from triggering any other actions
        // Make space key function exactly like the jump button
        if (!runnerRef.current.isJumping && gameState === GameState.RUNNING) {
          runnerRef.current.velocityY = JUMP_FORCE;
          runnerRef.current.isJumping = true;
        }
      } else if (e.code === "Enter") {
        e.preventDefault(); // Prevent enter from triggering any other actions
        // Make enter key function exactly like the play button
        updateGameState();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [updateGameState, gameState, runnerRef.current.isJumping]);

  const drawMap = useCallback(() => {
    const ctx = mapCanvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 500, 520);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, 0, 500, 520);
      
      // Draw ground
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(0, GROUND_Y, 500, 30);
      
      // Draw level obstacles
      LevelMaps[level].forEach((wall) => {
        ctx.fillStyle = COLORS.blue;
        ctx.fillRect(wall.x1, wall.y1, wall.width, wall.height);
      });
    }
  }, [level]);

  useEffect(() => {
    if (mapCanvasRef.current) {
      drawMap();
    }
  }, [drawMap, level, scale]);

  const updateGame = useCallback(() => {
    // Update runner position with gravity
    runnerRef.current.y = Math.min(GROUND_Y - RUNNER_HEIGHT, runnerRef.current.y + runnerRef.current.velocityY);
    runnerRef.current.velocityY += GRAVITY;
    runnerRef.current.isJumping = runnerRef.current.y < GROUND_Y - RUNNER_HEIGHT;

    // Move obstacles
    obstaclesRef.current = obstaclesRef.current.map(obstacle => ({
      ...obstacle,
      x: obstacle.x - OBSTACLE_SPEED
    })).filter(obstacle => obstacle.x + obstacle.width > 0);

    // Create new obstacles with random timing and width
    const currentTime = performance.now();
    if (!lastObstacleTimeRef.current) {
      lastObstacleTimeRef.current = currentTime;
    }
    
    // Only generate new obstacles if less than 13 seconds have passed
    if (startTimeRef.current) {
      const elapsedTime = (currentTime - startTimeRef.current) / 1000;
      
      // Additional blue obstacle at 13.5 seconds
      if (elapsedTime >= 13.5 && elapsedTime < 13.6 && !obstaclesRef.current.some(obs => obs.x === 500)) {
        obstaclesRef.current = [...obstaclesRef.current, {
          x: 500,
          y: GROUND_Y - OBSTACLE_HEIGHT,
          width: OBSTACLE_WIDTH * 2.5,  // Increased width
          height: OBSTACLE_HEIGHT,
          isSpecial: true // Mark this as a special blue obstacle
        }];
      }
      
      // Regular obstacle generation
      if (elapsedTime < 13) {
        if (currentTime - lastObstacleTimeRef.current >= nextObstacleIntervalRef.current) {
          // Randomly select obstacle width
          const randomValue = Math.random();
          let obstacleWidth;
          if (randomValue < 0.33) {
            obstacleWidth = OBSTACLE_WIDTH;  // Regular width
          } else if (randomValue < 0.66) {
            obstacleWidth = OBSTACLE_WIDTH * 1.5;  // 1.5x width
          } else {
            obstacleWidth = OBSTACLE_WIDTH * 2;  // 2x width
          }

          obstaclesRef.current = [...obstaclesRef.current, {
            x: 500,
            y: GROUND_Y - OBSTACLE_HEIGHT,
            width: obstacleWidth,
            height: OBSTACLE_HEIGHT
          }];
          
          lastObstacleTimeRef.current = currentTime;
          // Set next interval randomly between 800-1200ms
          nextObstacleIntervalRef.current = 800 + Math.random() * 400;
        }
      }
    }

    // Update score based on elapsed time
    if (startTimeRef.current) {
      const elapsedTime = (currentTime - startTimeRef.current) / 1000; // Convert to seconds
      const newScore = elapsedTime < 2 ? 0 : Math.floor((elapsedTime - 2) * 800); // Start counting after 2 seconds
      setScore(prev => ({
        ...prev,
        total: newScore
      }));

      if (elapsedTime >= 15) {  // 15 seconds
        setGameState(GameState.AWAITINGNEXTLEVEL);
      }
    }
  }, [setGameState]);

  const checkCollisions = useCallback(() => {
    // Check collision with obstacles
    const hasCollision = obstaclesRef.current.some(
      (obstacle) =>
        runnerRef.current.x < obstacle.x + obstacle.width &&
        runnerRef.current.x + RUNNER_WIDTH > obstacle.x &&
        runnerRef.current.y < obstacle.y + obstacle.height &&
        runnerRef.current.y + RUNNER_HEIGHT > obstacle.y
    );

    if (hasCollision) {
      setGameState(GameState.DEAD);
    }
  }, [obstaclesRef, runnerRef, setGameState]);

  const updateScore = useCallback(() => {
    const scoreCtx = scoreCanvasRef.current?.getContext("2d");
    if (scoreCtx) {
      scoreCtx.clearRect(0, 0, 500, 530);
      scoreCtx.font = "20px Pixelify Sans";
      scoreCtx.fillStyle = COLORS.black;
      scoreCtx.fillText(`Score: ${score.total}`, 10, 520);
      scoreCtx.fillText(`Level: ${level}`, 400, 520);
    }
  }, [level, score]);

  const drawGame = useCallback(() => {
    if (gameState !== GameState.RUNNING) {
      return;
    }

    const ctx = runnerCanvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 500, 520);

      // Draw runner (stick figure)
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 3;
      
      // Head
      ctx.beginPath();
      ctx.arc(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 10, 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // Body
      ctx.beginPath();
      ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 18);
      ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 35);
      ctx.stroke();
      
      // Arms - Different poses for jumping and standing
      if (runnerRef.current.isJumping) {
        // Jumping pose with wider arms
        ctx.beginPath();
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 25);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 - 20, runnerRef.current.y + 35);
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 25);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 + 20, runnerRef.current.y + 35);
        ctx.stroke();
      } else {
        // Standing pose with normal arms
        ctx.beginPath();
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 25);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 - 10, runnerRef.current.y + 35);
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 25);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 + 10, runnerRef.current.y + 35);
        ctx.stroke();
      }
      
      // Legs - Different poses for jumping and standing
      if (runnerRef.current.isJumping) {
        // Jumping pose with wider legs
        ctx.beginPath();
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 35);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 - 20, runnerRef.current.y + 50);
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 35);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 + 20, runnerRef.current.y + 50);
        ctx.stroke();
      } else {
        // Standing pose with normal legs
        ctx.beginPath();
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 35);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 - 12, runnerRef.current.y + 50);
        ctx.moveTo(runnerRef.current.x + RUNNER_WIDTH/2, runnerRef.current.y + 35);
        ctx.lineTo(runnerRef.current.x + RUNNER_WIDTH/2 + 12, runnerRef.current.y + 50);
        ctx.stroke();
      }

      // Draw obstacles
      ctx.fillStyle = COLORS.black;
      obstaclesRef.current.forEach(obstacle => {
        if (obstacle.isSpecial) {
          ctx.fillStyle = COLORS.blue; // Use blue for special obstacle
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          
          // Draw text on blue obstacle
          ctx.fillStyle = COLORS.white;
          ctx.font = "bold 20px Arial";
          ctx.textAlign = "center";
          // Draw "Base" on first line
          ctx.fillText("Base", obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 - 3);
          // Draw "Home" on second line
          ctx.fillText("Home", obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 17);
        } else {
          ctx.fillStyle = COLORS.black; // Use black for regular obstacles
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
      });
    }

    updateScore();
  }, [gameState, runnerRef, obstaclesRef, updateScore]);

  useGameLoop(() => {
    if (gameState === GameState.RUNNING) {
      updateGame();
      checkCollisions();
      drawGame();
      setScore((prev) => ({
        ...prev,
        current: Math.max(0, prev.current - (konami ? 1 : 2)),
      }));
    } else if (gameState === GameState.AWAITINGNEXTLEVEL) {
      updateScore();
    }
  }, [gameState, runnerRef, obstaclesRef, score]);

  const overlays = useMemo(() => {
    switch (gameState) {
      case GameState.INTRO:
      case GameState.PAUSED:
        return <Intro konami={konami} />;
      case GameState.WON:
      case GameState.DEAD:
        return (
          <Dead
            score={score.total}
            level={level}
            isWin={gameState === GameState.WON}
          />
        );
      case GameState.AWAITINGNEXTLEVEL:
        return <AwaitingNextLevel score={score.total} level={level} />;
      default:
        return null;
    }
  }, [gameState, konami, level, score.total, updateGameState]);

  if (!scale) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="mt-1 mx-2">
      <div
        ref={containerRef}
        className="relative origin-top-left w-[500px] h-[520px]"
        style={{
          transform: `scale(${scale})`,
          marginBottom: `${-520 * (1 - scale)}px`,
        }}
      >
        <canvas
          ref={gameCanvasRef}
          id="gamestate"
          width={500}
          height={500}
          className="absolute top-0 left-0 z-4"
        />
        <canvas
          ref={mapCanvasRef}
          id="map"
          width={500}
          height={500}
          className="absolute top-0 left-0 z-3"
        />
        <canvas
          ref={runnerCanvasRef}
          id="runner"
          width={500}
          height={500}
          className="absolute top-0 left-0 z-2"
        />
        <canvas
          ref={scoreCanvasRef}
          id="score"
          width={500}
          height={530}
          className="absolute top-0 left-0 z-1"
        />
        {overlays}
      </div>

      <div className="flex mt-6">
        <div className="flex flex-1 justify-center">
          <button
            className="h-12 w-24 bg-black rounded-lg hover:shadow-dpad-hover active:shadow-dpad-pressed active:translate-y-[1px] bg-dpad-gradient shadow-dpad"
            onClick={jump}
          >
            JUMP
          </button>
        </div>
        <div className="flex flex-1 relative">
          <ControlButtons
            gameState={gameState}
            handleMobileGameState={updateGameState}
          />
        </div>
      </div>
    </div>
  );
};

export default Run;
