/**
 * Number Runner 3D - Ein 3D Endless Runner Game
 *
 * Spieler steuert eine Kugel durch Tore mit mathematischen Operationen.
 * Swipe links/rechts, um das gewünschte Tor zu wählen.
 */

import React, { useRef, useState, useMemo, useCallback, Suspense, useEffect } from 'react';
import { View, Text, PanResponder, StyleSheet, Pressable, Animated } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// TYPEN UND KONSTANTEN
// ============================================================================

type OperationType = 'multiply' | 'add' | 'subtract';

interface GateOption {
  type: OperationType;
  value: number;
  color: string;
  label: string;
}

interface ScorePopup {
  id: number;
  value: string;
  color: string;
  x: number;
  y: number;
}

interface GateData {
  id: number;
  zPosition: number;
  leftOption: GateOption;
  rightOption: GateOption;
}

const GAME_CONFIG = {
  playerSpeed: 0.1,           // Geschwindigkeit nach vorne
  playerLaneSpeed: 0.15,      // Geschwindigkeit beim Spurwechsel
  lanePositions: [-2, 2],     // X-Positionen für linke/rechte Spur
  gateSpacing: 15,            // Abstand zwischen Toren
  gateWidth: 3,               // Breite eines Tors
  gateHeight: 4,              // Höhe eines Tors
  totalGates: 10,             // Anzahl der Tore bis zum Ziel
  collisionThreshold: 2,      // Distanz für Kollisionserkennung
};

// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

// Generiert zufällige Gate-Optionen
const generateGateOptions = (): { left: GateOption; right: GateOption } => {
  const operations: Array<{ type: OperationType; range: [number, number] }> = [
    { type: 'multiply', range: [2, 4] },
    { type: 'add', range: [10, 100] },
    { type: 'subtract', range: [5, 50] },
  ];

  const getRandomOption = (): GateOption => {
    const op = operations[Math.floor(Math.random() * operations.length)];
    let value: number;

    if (op.type === 'multiply') {
      value = Math.floor(Math.random() * (op.range[1] - op.range[0] + 1)) + op.range[0];
    } else {
      value = Math.floor(Math.random() * (op.range[1] - op.range[0] + 1)) + op.range[0];
    }

    const isPositive = op.type === 'multiply' || op.type === 'add';
    const color = isPositive ? '#00ff88' : '#ff3366';
    const symbol = op.type === 'multiply' ? '×' : op.type === 'add' ? '+' : '−';
    const label = `${symbol}${value}`;

    return { type: op.type, value, color, label };
  };

  return {
    left: getRandomOption(),
    right: getRandomOption(),
  };
};

// Berechnet neuen Wert basierend auf Gate-Option
const calculateNewValue = (currentValue: number, option: GateOption): number => {
  switch (option.type) {
    case 'multiply':
      return currentValue * option.value;
    case 'add':
      return currentValue + option.value;
    case 'subtract':
      return Math.max(0, currentValue - option.value);
    default:
      return currentValue;
  }
};

// ============================================================================
// SPIELER-KOMPONENTE (Kugel mit Auto-Movement)
// ============================================================================

interface PlayerProps {
  targetLane: number;
  onPositionUpdate: (z: number) => void;
}

function Player({ targetLane, onPositionUpdate }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentX = useRef(0);
  const currentZ = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Bewegung nach vorne (Z-Achse) - frame-rate unabhängig
    currentZ.current += GAME_CONFIG.playerSpeed * (delta * 60);
    meshRef.current.position.z = currentZ.current;

    // Bewegung zu Ziel-Lane (X-Achse)
    const targetX = GAME_CONFIG.lanePositions[targetLane];
    currentX.current += (targetX - currentX.current) * GAME_CONFIG.playerLaneSpeed;
    meshRef.current.position.x = currentX.current;

    // Position an Game-Manager weitergeben
    onPositionUpdate(currentZ.current);

    // Leichte Rotation für visuellen Effekt
    meshRef.current.rotation.x += 0.02;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color="#4488ff"
        metalness={0.6}
        roughness={0.2}
        emissive="#2244aa"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ============================================================================
// TOR-KOMPONENTE (Einzelnes Tor mit Beschriftung)
// ============================================================================

interface GateProps {
  position: [number, number, number];
  option: GateOption;
  width: number;
  height: number;
}

function Gate({ position, option, width, height }: GateProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animiere das Tor leicht
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Tor-Rahmen */}
      <mesh ref={meshRef}>
        <boxGeometry args={[width, height, 0.3]} />
        <meshStandardMaterial
          color={option.color}
          opacity={0.6}
          transparent
          emissive={option.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Rahmen-Outline */}
      <lineSegments position={[0, 0, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, 0.3)]} />
        <lineBasicMaterial color="#ffffff" />
      </lineSegments>

      {/* Particles around gate für visuellen Effekt */}
      <mesh position={[0, 0, -0.5]}>
        <ringGeometry args={[width * 0.4, width * 0.5, 32]} />
        <meshBasicMaterial color={option.color} opacity={0.2} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================================================
// GATE-MANAGER (Verwaltet alle Tore)
// ============================================================================

interface GateManagerProps {
  gates: GateData[];
  playerZ: number;
}

function GateManager({ gates, playerZ }: GateManagerProps) {
  return (
    <>
      {gates.map((gate) => {
        // Nur Tore rendern, die in Sichtweite sind
        const distanceToPlayer = gate.zPosition - playerZ;
        if (distanceToPlayer < -10 || distanceToPlayer > 50) return null;

        return (
          <group key={gate.id}>
            {/* Linkes Tor */}
            <Gate
              position={[GAME_CONFIG.lanePositions[0], GAME_CONFIG.gateHeight / 2, gate.zPosition]}
              option={gate.leftOption}
              width={GAME_CONFIG.gateWidth}
              height={GAME_CONFIG.gateHeight}
            />

            {/* Rechtes Tor */}
            <Gate
              position={[GAME_CONFIG.lanePositions[1], GAME_CONFIG.gateHeight / 2, gate.zPosition]}
              option={gate.rightOption}
              width={GAME_CONFIG.gateWidth}
              height={GAME_CONFIG.gateHeight}
            />

            {/* Verbindungslinie zwischen Toren */}
            <mesh position={[0, GAME_CONFIG.gateHeight + 0.5, gate.zPosition]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, Math.abs(GAME_CONFIG.lanePositions[1] - GAME_CONFIG.lanePositions[0]), 8]} />
              <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// ============================================================================
// BODEN-KOMPONENTE mit Grid-Effekt
// ============================================================================

function Ground() {
  const gridHelper = useRef<THREE.GridHelper>(null);

  useFrame(() => {
    // Optional: Animiere Grid
    if (gridHelper.current) {
      // gridHelper.current.position.z += 0.1;
      // if (gridHelper.current.position.z > 10) gridHelper.current.position.z = 0;
    }
  });

  return (
    <group>
      {/* Haupt-Boden */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Grid Helper für bessere Tiefenwahrnehmung */}
      <gridHelper ref={gridHelper} args={[200, 40, '#333333', '#222222']} position={[0, 0.01, 0]} />

      {/* Lane-Marker */}
      {GAME_CONFIG.lanePositions.map((xPos, idx) => (
        <mesh key={idx} position={[xPos, 0.02, 50]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 100]} />
          <meshBasicMaterial color="#2a2a3a" opacity={0.5} transparent />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// KAMERA-CONTROLLER (Third Person)
// ============================================================================

interface CameraControllerProps {
  playerZ: number;
}

function CameraController({ playerZ }: CameraControllerProps) {
  useFrame(({ camera }) => {
    // Kamera folgt dem Spieler mit Offset - smooth following
    const targetZ = playerZ - 8;
    const targetY = 5;
    const targetX = 0;

    camera.position.z += (targetZ - camera.position.z) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.position.x += (targetX - camera.position.x) * 0.1;

    // Schaue etwas vor den Spieler
    camera.lookAt(0, 1, playerZ + 5);
  });

  return null;
}

// ============================================================================
// LIGHTING SETUP
// ============================================================================

function Lights() {
  return (
    <>
      {/* Ambient Light für allgemeine Beleuchtung */}
      <ambientLight intensity={0.4} />

      {/* Main Directional Light mit Schatten */}
      <directionalLight
        position={[10, 15, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Zusätzliches Licht von vorne */}
      <pointLight position={[0, 5, 10]} intensity={0.5} color="#88aaff" />

      {/* Hintergrundlicht */}
      <pointLight position={[0, 3, -10]} intensity={0.3} color="#ff88aa" />
    </>
  );
}

// ============================================================================
// 3D-SZENE
// ============================================================================

interface Scene3DProps {
  targetLane: number;
  gates: GateData[];
  playerZ: number;
  onPositionUpdate: (z: number) => void;
}

function Scene3D({ targetLane, gates, playerZ, onPositionUpdate }: Scene3DProps) {
  return (
    <>
      {/* Lichter */}
      <Lights />

      {/* Spieler */}
      <Player targetLane={targetLane} onPositionUpdate={onPositionUpdate} />

      {/* Tore */}
      <GateManager gates={gates} playerZ={playerZ} />

      {/* Boden */}
      <Ground />

      {/* Kamera-Controller */}
      <CameraController playerZ={playerZ} />

      {/* Fog für Atmosphäre */}
      <fog attach="fog" args={['#0a0a0a', 30, 80]} />
    </>
  );
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading 3D Scene...</Text>
    </View>
  );
}

// ============================================================================
// END-SCREEN
// ============================================================================

interface EndScreenProps {
  score: number;
  onRestart: () => void;
}

function EndScreen({ score, onRestart }: EndScreenProps) {
  return (
    <View style={styles.endScreen}>
      <Text style={styles.endTitle}>🎉 Level Complete!</Text>
      <Text style={styles.endScore}>Final Score: {score}</Text>
      <Pressable style={styles.restartButton} onPress={onRestart}>
        <Text style={styles.restartButtonText}>Play Again</Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// SCORE POPUP COMPONENT
// ============================================================================

interface ScorePopupDisplayProps {
  popup: ScorePopup;
  onComplete: (id: number) => void;
}

function ScorePopupDisplay({ popup, onComplete }: ScorePopupDisplayProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animiere das Popup nach oben und fade out
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -80,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete(popup.id);
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.scorePopup,
        {
          left: popup.x,
          top: popup.y,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.scorePopupText, { color: popup.color }]}>
        {popup.value}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// HAUPTSPIEL-KOMPONENTE
// ============================================================================

export default function NumberRunner() {
  // Game State
  const [playerValue, setPlayerValue] = useState(10);
  const [targetLane, setTargetLane] = useState(0); // 0 = links, 1 = rechts
  const [playerZ, setPlayerZ] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const popupIdCounter = useRef(0);

  // Tore generieren (nur einmal beim Mount)
  const gates = useMemo<GateData[]>(() => {
    const generatedGates: GateData[] = [];
    for (let i = 0; i < GAME_CONFIG.totalGates; i++) {
      const options = generateGateOptions();
      generatedGates.push({
        id: i,
        zPosition: (i + 1) * GAME_CONFIG.gateSpacing,
        leftOption: options.left,
        rightOption: options.right,
      });
    }
    return generatedGates;
  }, []); // Leere Dependency-Array = nur einmal generieren

  // Verarbeitete Tore tracken
  const processedGates = useRef(new Set<number>());

  // Helper: Remove completed popup
  const removePopup = useCallback((id: number) => {
    setScorePopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Kollisionserkennung
  const checkCollision = useCallback(
    (currentZ: number) => {
      gates.forEach((gate) => {
        const distance = Math.abs(currentZ - gate.zPosition);

        if (distance < GAME_CONFIG.collisionThreshold && !processedGates.current.has(gate.id)) {
          processedGates.current.add(gate.id);

          // Gewählte Option basierend auf aktueller Lane
          const selectedOption = targetLane === 0 ? gate.leftOption : gate.rightOption;

          // Alten Wert speichern
          const oldValue = playerValue;

          // Neuen Wert berechnen
          const newValue = calculateNewValue(playerValue, selectedOption);
          setPlayerValue(newValue);

          // Score Popup erstellen - positioniert an der Gate-Position
          const scoreDiff = newValue - oldValue;
          const popupText = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;

          // Position: Links oder rechts je nach Lane, und etwa in der Mitte-oben des Bildschirms
          const screenX = targetLane === 0 ? 80 : window.innerWidth - 120;
          const screenY = window.innerHeight * 0.3;

          const newPopup: ScorePopup = {
            id: popupIdCounter.current++,
            value: popupText,
            color: selectedOption.color,
            x: screenX,
            y: screenY,
          };

          setScorePopups((prev) => [...prev, newPopup]);

          // Prüfen ob letztes Tor
          if (gate.id === GAME_CONFIG.totalGates - 1) {
            setTimeout(() => {
              setFinalScore(newValue);
              setGameOver(true);
            }, 1000);
          }
        }
      });
    },
    [gates, targetLane, playerValue]
  );

  // Player Position Update
  const handlePositionUpdate = useCallback(
    (z: number) => {
      setPlayerZ(z);
      checkCollision(z);
    },
    [checkCollision]
  );

  // Swipe-Steuerung mit PanResponder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, gestureState) => {
          // Swipe nach links oder rechts
          if (Math.abs(gestureState.dx) > 30) {
            if (gestureState.dx > 0) {
              setTargetLane(1); // Rechts
            } else {
              setTargetLane(0); // Links
            }
          }
        },
      }),
    []
  );

  // Spiel neu starten
  const handleRestart = () => {
    setPlayerValue(10);
    setTargetLane(0);
    setPlayerZ(0);
    setGameOver(false);
    setFinalScore(0);
    setScorePopups([]);
    processedGates.current.clear();
    popupIdCounter.current = 0;
    // Force re-render mit neuen Gates
    window.location.reload();
  };

  // Wenn Spiel vorbei, zeige End Screen
  if (gameOver) {
    return <EndScreen score={finalScore} onRestart={handleRestart} />;
  }

  // Nächstes Gate finden für Preview
  const nextGate = gates.find((gate) => gate.zPosition - playerZ > 0 && gate.zPosition - playerZ < GAME_CONFIG.gateSpacing + 5);

  return (
    <View style={styles.container}>
      {/* 3D Canvas */}
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, 5, -8], fov: 60 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        shadows
      >
        <color attach="background" args={['#0a0a0a']} />
        <Suspense fallback={null}>
          <Scene3D
            targetLane={targetLane}
            gates={gates}
            playerZ={playerZ}
            onPositionUpdate={handlePositionUpdate}
          />
        </Suspense>
      </Canvas>

      {/* Touchable Overlay for Swipe Gestures */}
      <View style={styles.touchOverlay} {...panResponder.panHandlers} />

      {/* UI Overlay */}
      <View style={styles.uiOverlay}>
        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>VALUE</Text>
          <Text style={styles.scoreValue}>{playerValue}</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Gate {processedGates.current.size + 1} / {GAME_CONFIG.totalGates}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(processedGates.current.size / GAME_CONFIG.totalGates) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            👆 Swipe left or right
          </Text>
          <Text style={styles.laneIndicator}>
            {targetLane === 0 ? '← LEFT LANE' : 'RIGHT LANE →'}
          </Text>
        </View>

        {/* Gate Preview - zeigt nächstes Tor */}
        {nextGate && (
          <View style={styles.gatePreview}>
            <View style={[styles.gateOption, {
              backgroundColor: nextGate.leftOption.color + '33',
              borderColor: targetLane === 0 ? '#fff' : '#555',
              borderWidth: targetLane === 0 ? 3 : 1,
            }]}>
              <Text style={styles.gateLabel}>{nextGate.leftOption.label}</Text>
              <Text style={styles.gateLabelSmall}>LEFT</Text>
            </View>
            <View style={[styles.gateOption, {
              backgroundColor: nextGate.rightOption.color + '33',
              borderColor: targetLane === 1 ? '#fff' : '#555',
              borderWidth: targetLane === 1 ? 3 : 1,
            }]}>
              <Text style={styles.gateLabel}>{nextGate.rightOption.label}</Text>
              <Text style={styles.gateLabelSmall}>RIGHT</Text>
            </View>
          </View>
        )}

        {/* Score Popups - erscheinen an den Tor-Positionen */}
        {scorePopups.map((popup) => (
          <ScorePopupDisplay
            key={popup.id}
            popup={popup}
            onComplete={removePopup}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 20,
  },
  scoreContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4488ff',
    minWidth: 100,
  },
  scoreLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4488ff',
    minWidth: 120,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4488ff',
    borderRadius: 3,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4488ff',
  },
  instructionsText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  laneIndicator: {
    color: '#4488ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
  },
  gatePreview: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  gateOption: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateLabel: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gateLabelSmall: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 1,
  },
  endScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  endScore: {
    fontSize: 36,
    color: '#4488ff',
    marginBottom: 50,
    fontWeight: '700',
  },
  restartButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#4488ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scorePopup: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  scorePopupText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
