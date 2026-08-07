import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import '../shaders/RevealMaterial'; // Registers alpha-discard reveal shader
import { playBackgroundMusic } from '../../../utils/audioManager';
import { useAchievements } from '../../../context/AchievementsContext';
import { useBugs } from '../../../context/BugContext';
import { useAudio } from '../../../context/AudioManager';
import { isTouchDevice } from '../../../utils/deviceDetect';

// Use same font as App.jsx preload (Inter) - works reliably
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';



/**
 * EntranceDoors Component - 3D Entrance to the Corridor
 * 
 * Doors that open and camera flies through.
 * EmptyCorridor provides the surrounding corridor context.
 */
const EntranceDoors = ({
    position = [0, 0, 22],
    onComplete,
    onTransitionStart,
    corridorHeight = 8, // Taller wall
    corridorWidth = 15 // Wider wall
}) => {
    const leftDoorRef = useRef();
    const rightDoorRef = useRef();
    const leftHandleRef = useRef();
    const rightHandleRef = useRef();
    const rightDoorMaterialRef = useRef(); // GSAP shader control
    const leftDoorMaterialRef = useRef(); // Left door reveal control
    const leftHandleMaterialRef = useRef(); // Left handle reveal control
    const rightHandleMaterialRef = useRef(); // Right handle reveal control
    const leftHandlePaintedRef = useRef(); // Painted handle mesh visibility
    const rightHandlePaintedRef = useRef(); // Painted handle mesh visibility
    const groupRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isWindowHovered, setIsWindowHovered] = useState(false);
    const windowAvatarRef = useRef();
    const { camera, viewport } = useThree();
    const { unlockAchievement } = useAchievements();
    const { fixBug, fixedBugs } = useBugs();
    const { play } = useAudio();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(isTouchDevice() || window.innerWidth < 1000);
    }, []);

    // Dla hooków tekstur musimy obliczyć to raz na starcie
    const isMobileDevice = typeof window !== 'undefined' && (isTouchDevice() || window.innerWidth < 1000);
    const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // ─── Bug system ────────────────────────────────────────────────────────────
    // 5 bugs: wall, tree, window (original), cat, sign
    // positions are initial spawn points; useFrame applies wander offsets
    const BUG_CONFIGS = [
        { id: 'wall',   baseX: -5.5,  baseY: 2.5,  z: 0.16 },
        { id: 'tree',   baseX: -3.4,  baseY: 3.8,  z: 1.05 },
        { id: 'window', baseX:  4.35, baseY: 4.05, z: 0.18, hitbox: 0.58, wanderX: 0.08, wanderY: 0.08 },
        { id: 'cat',    baseX: -1.5,  baseY: 0.5,  z: 0.85 },
        { id: 'sign',   baseX:  5.3,  baseY: 1.95, z: 0.24, hitbox: 0.48, wanderX: 0.08, wanderY: 0.06 },
    ];

    // Per-bug refs (keyed by id)
    const bugRefs = useRef({});
    const inkSplashRefs = useRef({});
    const bugFixedTextRefs = useRef({});
    const bugClickPos = useRef({}); // Store click position per bug
    const [clipProgresses, setClipProgresses] = useState({}); // id → 0-1

    const handleHideDelayRef = useRef(); // Track pending gsap.delayedCall for handle visibility

    const frameTexture = useTexture('/textures/doors/frame_sketch.webp');
    const doorLeftTexture = useTexture('/textures/doors/door_left_sketch.webp');
    const doorRightTexture = useTexture('/textures/doors/door_right_sketch.webp');

    // Mobile optimization: Don't load painted textures or handles on phones
    const doorRightPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/door_right_painted.webp');
    const doorLeftPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/door_left_painted.webp');
    const handleLeftTexture = useTexture('/textures/doors/handle_left_sketch.webp');
    const handleLeftPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/handle_left_painted.webp');
    const handleRightTexture = useTexture('/textures/doors/handle_right_sketch.webp');
    const handleRightPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/handle_right_painted.webp');

    // Dynamic textures for mobile
    const doorBackTexture = useTexture(isMobileDevice ? '/textures/doors/door_back.webp' : '/textures/doors/door_back_left_sketch.webp');
    const edgeTexture = useTexture(isMobileDevice ? '/textures/doors/pien_sketch.webp' : '/textures/doors/pien.webp');

    const bricksTexture = useTexture('/textures/entrance/wall_bricks_2.webp');
    const stonePathTexture = useTexture('/textures/entrance/stone-path.webp');
    // const catTexture = useTexture('/textures/entrance/cat_sketch.webp'); // Old side cat
    const catFrontBodyTexture = useTexture('/textures/entrance/cat_front_body.webp');
    const windowSketchTexture = useTexture('/textures/entrance/window_sketch.webp');
    const avatarWindowTexture = useTexture('/textures/entrance/avatar_window.webp');
    const treeTexture = useTexture('/textures/entrance/tree_sketch.webp');
    const mouseTexture = useTexture('/textures/entrance/mouse_hanging.webp');
    const potTexture = useTexture('/textures/entrance/pot_with_duck.webp');
    const bugTexture = useTexture('/textures/entrance/bug_sketch.webp');
    const inkSplashTexture = useTexture('/images/ink-splash.webp');
    const speechBubbleTexture = useTexture('/textures/entrance/speech_bubble.webp');

    // Cat Ref
    const leftPupilRef = useRef();
    const rightPupilRef = useRef();
    const catGroupRef = useRef(); // To get world position for tracking

    // Duck Speech Bubble State (Rubber Duck Debugging)
    const [isDuckSpeaking, setIsDuckSpeaking] = useState(false);
    const [duckQuote, setDuckQuote] = useState('');
    const speechBubbleRef = useRef();

    useEffect(() => {
        console.log('[EntranceDoors] bug positions', BUG_CONFIGS.map((cfg) => ({
            id: cfg.id,
            x: cfg.baseX,
            y: floorY + cfg.baseY,
            z: cfg.z,
            hitbox: cfg.hitbox ?? 0.4,
        })));
        console.log('[EntranceDoors] viewport bounds', {
            width: viewport.width,
            height: viewport.height,
            distance: viewport.distance,
            cameraPosition: camera.position.toArray(),
        });
    }, [camera, viewport.width, viewport.height, viewport.distance]);

    // Rubber Duck Debugging Quotes
    const duckQuotes = [
        "Have you tried console.log()?",
        "Did you clear the cache?",
        "It works on my machine! 🤷",
        "Have you turned it off and on again?",
        "Maybe it's a CSS issue?",
        "Check for missing semicolons!",
        "Did you read the error message?",
        "Have you tried Stack Overflow?",
        "Is it plugged in?",
        "Works in production! 🚀",
    ];

    // ─── Per-Bug Click Handler ────────────────────────────────────────────────
    const handleBugClick = (e, bugId) => {
        e.stopPropagation();
        if (fixedBugs.includes(bugId)) return; // Already fixed

        // Play pop sound
        play('baloonpop', { volume: 0.6 });

        // Capture current wandered position
        const bugMesh = bugRefs.current[bugId];
        const clickX = bugMesh ? bugMesh.position.x : 0;
        const clickY = bugMesh ? bugMesh.position.y : 0;
        bugClickPos.current[bugId] = { x: clickX, y: clickY };

        document.body.style.cursor = 'auto';

        // Mark as fixed in context (updates DOM overlay)
        fixBug(bugId);

        // Animate ink splash scale up at bug's last position
        const splashMesh = inkSplashRefs.current[bugId];
        if (splashMesh) {
            splashMesh.position.x = clickX;
            splashMesh.position.y = clickY;
            splashMesh.scale.set(0, 0, 0);
            splashMesh.material.opacity = 1;

            gsap.to(splashMesh.scale, {
                x: 0.8,
                y: 0.8,
                z: 1,
                duration: 0.4,
                ease: 'back.out(1.7)'
            });
        }

        // Pencil drawing reveal for 'BUG FIXED!' text
        const textMesh = bugFixedTextRefs.current[bugId];
        if (textMesh) {
            textMesh.position.x = clickX;
            textMesh.position.y = clickY;
        }

        setClipProgresses(prev => ({ ...prev, [bugId]: 0 }));

        // Animate clip progress 0 → 1 (pencil-draw reveal)
        gsap.to({ progress: 0 }, {
            progress: 1,
            duration: 0.8,
            ease: 'power1.inOut',
            onUpdate: function () {
                setClipProgresses(prev => ({ ...prev, [bugId]: this.targets()[0].progress }));
            },
            onComplete: () => {
                // Fade out ink splash after 1.5s
                setTimeout(() => {
                    if (splashMesh) {
                        gsap.to(splashMesh.material, {
                            opacity: 0,
                            duration: 1,
                            ease: 'power2.out'
                        });
                    }
                }, 1500);
            }
        });
    };

    // Duck Click Handler (Rubber Duck Debugging)
    const handleDuckClick = (e) => {
        e.stopPropagation();
        if (isDuckSpeaking) return; // Already speaking

        // Pick random quote
        const randomQuote = duckQuotes[Math.floor(Math.random() * duckQuotes.length)];
        setDuckQuote(randomQuote);
        setIsDuckSpeaking(true);

        // Scale in animation for speech bubble
        if (speechBubbleRef.current) {
            speechBubbleRef.current.scale.set(0, 0, 0);
            gsap.to(speechBubbleRef.current.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.3,
                ease: 'back.out(1.7)'
            });
        }

        // Hide after 3 seconds
        setTimeout(() => {
            if (speechBubbleRef.current) {
                gsap.to(speechBubbleRef.current.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 0.2,
                    ease: 'power2.in',
                    onComplete: () => setIsDuckSpeaking(false)
                });
            } else {
                setIsDuckSpeaking(false);
            }
        }, 3000);
    };

    // ... (lines omitted)



    // Door dimensions - calculated from texture proportions (332x848 = 1:2.55)
    // Door dimensions - calculated from texture proportions (332x848 = 1:2.55)
    const doorWidth = 0.94;
    const doorHeight = 2.4;
    const doorOpeningWidth = doorWidth * 2; // Both doors together
    const wallThickness = 0.07;

    // Frame dimensions from texture (718x877 = 1:1.22)
    const frameWidth = doorOpeningWidth + 0.16; // Extra for frame borders
    const frameHeight = frameWidth * (877 / 718); // Maintain texture aspect ratio

    // Floor Y must remain at standard level (-1.75) regardless of wall height
    const floorY = -1.75;
    const doorBottomY = floorY;
    const doorCenterY = doorBottomY + doorHeight / 2;
    const wallCenterY = floorY + corridorHeight / 2;
    const topWallHeight = corridorHeight - doorHeight;
    const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;
    const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;



    // Cat Interaction State


    // Handle click
    const handleClick = (e) => {
        e.stopPropagation();
        if (isOpen || isAnimating) return;

        // Reset cursor immediately on transition start
        document.body.style.cursor = "auto";

        setIsOpen(true);
        setIsAnimating(true);
        onTransitionStart?.();
        playBackgroundMusic();
        unlockAchievement('corridor_enter');

        const tl = gsap.timeline({
            onComplete: () => {
                onComplete?.();
            }
        });

        // Press handles down fully (like really opening)
        if (leftHandleRef.current) {
            tl.to(leftHandleRef.current.rotation, {
                z: 0.4,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }
        if (rightHandleRef.current) {
            tl.to(rightHandleRef.current.rotation, {
                z: -0.4,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }

        // Open doors - smoother angle (matches SegmentDoors)
        tl.to(leftDoorRef.current.rotation, {
            y: -Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0.1);

        tl.to(rightDoorRef.current.rotation, {
            y: Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0.1);

        // Camera flies through - STOP CLOSER to avatar/ITOM
        tl.to(camera.position, {
            z: 11,  // Closer stop point (was 11)
            y: 0.2, // Match hook's base Y position
            duration: 1.8,
            ease: 'power2.inOut'
        }, 0.3);
    };

    // Handle hover - doors slightly open to indicate interactivity
    const handlePointerEnter = () => {
        if (isOpen || isAnimating || isMobile) return;
        setIsHovered(true);
        document.body.style.cursor = "pointer";

        // Slightly open doors on hover
        gsap.to(leftDoorRef.current.rotation, {
            y: -0.08,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });
        gsap.to(rightDoorRef.current.rotation, {
            y: 0.08,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });

        // Rotate handles down slightly (hint effect)
        if (leftHandleRef.current) {
            gsap.to(leftHandleRef.current.rotation, {
                z: 0.1,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (rightHandleRef.current) {
            gsap.to(rightHandleRef.current.rotation, {
                z: -0.1,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Brush-stroke reveal: discard sketch pixels to show painted door beneath
        if (rightDoorMaterialRef.current) {
            gsap.to(rightDoorMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (leftDoorMaterialRef.current) {
            gsap.to(leftDoorMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (leftHandleMaterialRef.current) {
            gsap.to(leftHandleMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (rightHandleMaterialRef.current) {
            gsap.to(rightHandleMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        // Show painted handles (kill any pending hide from previous leave)
        if (handleHideDelayRef.current) handleHideDelayRef.current.kill();
        if (leftHandlePaintedRef.current) leftHandlePaintedRef.current.visible = true;
        if (rightHandlePaintedRef.current) rightHandlePaintedRef.current.visible = true;
    };

    const handlePointerLeave = () => {
        if (isOpen || isAnimating || isMobile) return;
        setIsHovered(false);
        document.body.style.cursor = "auto";

        // Close doors back
        gsap.to(leftDoorRef.current.rotation, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });
        gsap.to(rightDoorRef.current.rotation, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });

        // Reset handles
        if (leftHandleRef.current) {
            gsap.to(leftHandleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (rightHandleRef.current) {
            gsap.to(rightHandleRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Reverse brush-stroke reveal
        if (rightDoorMaterialRef.current) {
            gsap.to(rightDoorMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (leftDoorMaterialRef.current) {
            gsap.to(leftDoorMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (leftHandleMaterialRef.current) {
            gsap.to(leftHandleMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (rightHandleMaterialRef.current) {
            gsap.to(rightHandleMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Hide painted handles after reverse animation completes
        handleHideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (leftHandlePaintedRef.current) leftHandlePaintedRef.current.visible = false;
            if (rightHandlePaintedRef.current) rightHandlePaintedRef.current.visible = false;
        });
    };



    // --- Cat Eye Tracking Logic ---
    useFrame((state) => {
        if (!leftPupilRef.current || !rightPupilRef.current) return;

        // Mouse position in normalized device reference (-1 to +1)
        const { x, y } = state.pointer;

        // Configuration
        const MAX_EYE_MOVEMENT = 0.015; // How far pupils can move from center

        // Simple mapping
        const targetX = x * MAX_EYE_MOVEMENT * 2;
        const targetY = y * MAX_EYE_MOVEMENT * 2;

        // Smoothly interpolate current pupil position to target
        // Left Eye Original: [-0.063, 0.27]
        leftPupilRef.current.position.x = THREE.MathUtils.lerp(leftPupilRef.current.position.x, -0.075 + targetX, 0.1);
        leftPupilRef.current.position.y = THREE.MathUtils.lerp(leftPupilRef.current.position.y, 0.28 + targetY, 0.1);

        // Right Eye Original: [0.0615, 0.27]
        rightPupilRef.current.position.x = THREE.MathUtils.lerp(rightPupilRef.current.position.x, 0.043 + targetX, 0.1);
        rightPupilRef.current.position.y = THREE.MathUtils.lerp(rightPupilRef.current.position.y, 0.28 + targetY, 0.1);
    });

    // --- Mouse Swinging Animation ---
    const mousePivotRef = useRef();
    useFrame(({ clock }) => {
        if (mousePivotRef.current) {
            // Gentle swing: sin wave
            // Amplitude: 0.05 radians (approx 3 degrees)
            // Speed: 1.5
            mousePivotRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.05;
        }

        // --- Bug Animation (5 bugs with unique phase offsets) ---
        const time = clock.elapsedTime;
        BUG_CONFIGS.forEach((cfg, i) => {
            const mesh = bugRefs.current[cfg.id];
            if (!mesh || fixedBugs.includes(cfg.id)) return;

            // Unique phase offsets per bug so they wander independently
            const phaseX = i * 1.2;
            const phaseY = i * 0.7;
            const wanderX = cfg.wanderX ?? 0.3;
            const wanderY = cfg.wanderY ?? 0.2;
            const xOffset = Math.sin(time * 0.8 + phaseX) * wanderX + Math.sin(time * 1.5 + phaseX) * (wanderX * 0.33);
            const yOffset = Math.cos(time * 0.6 + phaseY) * wanderY + Math.cos(time * 1.1 + phaseY) * (wanderY * 0.5);

            mesh.position.x = cfg.baseX + xOffset;
            mesh.position.y = (floorY + cfg.baseY) + yOffset;
            mesh.rotation.z = Math.sin(time * 5 + phaseX) * 0.1 + Math.atan2(yOffset, xOffset) * 0.2;
        });
    });



    // Helper for window hover
    const handleWindowEnter = (e) => {
        e.stopPropagation();
        setIsWindowHovered(true);
        document.body.style.cursor = "pointer";

        if (windowAvatarRef.current) {
            gsap.to(windowAvatarRef.current.position, {
                x: 2.5,
                duration: 0.5,
                ease: 'back.out(1.7)',
                overwrite: true
            });
            gsap.to(windowAvatarRef.current.rotation, {
                z: 0.1,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
    };

    const handleWindowLeave = (e) => {
        e.stopPropagation();
        setIsWindowHovered(false);
        document.body.style.cursor = "auto";

        if (windowAvatarRef.current) {
            gsap.to(windowAvatarRef.current.position, {
                x: 3.5,
                duration: 0.4,
                ease: 'power2.in',
                overwrite: true
            });
            gsap.to(windowAvatarRef.current.rotation, {
                z: 0,
                duration: 0.4,
                ease: 'power2.in',
                overwrite: true
            });
        }
    };

    // Frame center Y - aligned with doors
    const frameCenterY = doorBottomY + frameHeight / 2;

    const facadeYOffset = -1.65;


    const pathWidth = frameWidth + 0.4;
    // New texture is 1005x2317 (approx 1:2.3 ratio). 
    // Width 2.44 * 2.3 = ~5.6 height.
    const pathLength = 5.62;

    return (
        <group ref={groupRef} position={[position[0], 0, position[2]]}>

            {/* === STONE PATH FLOOR (On Top - in front of entrance) === */}
            {/* WYSOKOŚĆ STONE PATH: zmień 'floorY + 0.02' - większa liczba = wyżej */}
            <mesh
                position={[0, floorY + 0.02, pathLength / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[pathWidth, pathLength]} />
                <meshBasicMaterial color="#fcf3c6"
                    map={stonePathTexture}
                    transparent={true}
                />
            </mesh>


            {/* LEFT WALL PANEL */}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#fcf3c6" roughness={0.95} />
            </mesh>

            {/* RIGHT WALL PANEL */}
            <mesh position={[(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#fcf3c6" roughness={0.95} />
            </mesh>

            {/* TOP WALL PANEL */}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshBasicMaterial color="#fcf3c6" roughness={0.95} />
            </mesh>

            {/* === BRICK FACADE === */}
            {/* 
                DOSTOSOWANIE OBRAZKA (TEXTURE ADJUSTMENT):
                1. args={[Szerokość, Wysokość]} - Rozmiar obrazka
                2. facadeYOffset - Przesunięcie góra/dół (np. -1 obniży, 1 podwyższy)
            */}
            <mesh position={[0, wallCenterY + facadeYOffset + 1.65, 0.15]}>
                {/* args={[Szerokość, Wysokość]} - Zmieniaj te liczby (np. 7, 8) */}
                <planeGeometry args={[16., 8]} />
                <meshBasicMaterial color="#fcf3c6"
                    map={bricksTexture}
                    transparent={true}
                    alphaTest={0.01}
                    roughness={0.9}
                />
            </mesh>

            {/* === CAPABILITY SIGN BANNERS ABOVE GATE === */}
            {[
                { text: "Full Stack Dev", x: -1.8 },
                { text: "Web Developer", x: -0.6 },
                { text: "Website Developer", x: 0.6 },
                { text: "AI Integration", x: 1.8 }
            ].map((banner, index) => (
                <group key={index} position={[banner.x, frameCenterY + 1.65, 0.2]}>
                    {/* Shadow / Border plane */}
                    <mesh position={[0.015, -0.015, -0.002]}>
                        <planeGeometry args={[1.13, 0.38]} />
                        <meshBasicMaterial color="#311059" transparent opacity={0.8} />
                    </mesh>
                    {/* Card plane */}
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[1.1, 0.35]} />
                        <meshBasicMaterial color="#fcf3c6" />
                    </mesh>
                    {/* Text */}
                    <Text
                        position={[0, 0, 0.002]}
                        fontSize={0.11}
                        color="#311059"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Bold.ttf"
                    >
                        {banner.text}
                    </Text>
                </group>
            ))}

            {/* === TEXTURED FRAME === */}
            <mesh position={[0, frameCenterY, 0.12]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshBasicMaterial color="#fcf3c6"
                    map={frameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    roughness={0.9}
                    depthWrite={false}
                />
            </mesh>

            {/* LEFT DOOR */}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                {/* Custom Stickers to cover old tech stack stickers - LEFT DOOR */}
                <group position={[doorWidth / 2, 0.45, 0.091]}>
                    <mesh position={[0.01, -0.01, -0.002]}>
                        <planeGeometry args={[0.73, 0.38]} />
                        <meshBasicMaterial color="#311059" transparent opacity={0.7} />
                    </mesh>
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[0.7, 0.35]} />
                        <meshBasicMaterial color="#fcf3c6" />
                    </mesh>
                    <Text
                        position={[0, 0.02, 0.001]}
                        fontSize={0.075}
                        color="#311059"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Bold.ttf"
                    >
                        Full Stack 💻
                    </Text>
                </group>

                <group position={[doorWidth / 2, -0.45, 0.091]}>
                    <mesh position={[0.01, -0.01, -0.002]}>
                        <planeGeometry args={[0.73, 0.38]} />
                        <meshBasicMaterial color="#311059" transparent opacity={0.7} />
                    </mesh>
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[0.7, 0.35]} />
                        <meshBasicMaterial color="#fcf3c6" />
                    </mesh>
                    <Text
                        position={[0, 0.02, 0.001]}
                        fontSize={0.07}
                        color="#311059"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Bold.ttf"
                    >
                        @Nikita-1414
                    </Text>
                </group>

                {/* Solid 3D Door Body with edge texture */}
                <mesh
                    position={[doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#fcf3c6" map={edgeTexture} roughness={0.9} />
                </mesh>

                {/* Painted layer (behind sketch) - left door */}
                {!isMobile && (
                    <mesh position={[doorWidth / 2, 0, 0.088]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#fcf3c6"
                            map={doorLeftPaintedTexture}
                            transparent={true}
                            alphaTest={0.5}
                            roughness={0.8}
                        />
                    </mesh>
                )}

                {/* Sketch overlay (front) - left door brush-stroke reveal */}
                <mesh position={[doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <revealMaterial color="#fcf3c6"
                        ref={leftDoorMaterialRef}
                        map={doorLeftTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        depthWrite={false}
                        uProgress={0.0}
                    />
                </mesh>

                {/* Back Texture Face (mirrored) */}
                <mesh position={[doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#fcf3c6"
                        map={doorBackTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        side={2}
                    />
                </mesh>

                {/* Handle Layer (animated) - pivot at screw center (292,459 on 332x848 texture) */}
                <group ref={leftHandleRef} position={[doorWidth / 2 + 0.357, -0.099, 0.10]}>
                    {/* Painted handle (behind) - hidden until hover */}
                    {!isMobile && (
                        <mesh ref={leftHandlePaintedRef} position={[-0.357, 0.09, -0.001]} visible={false}>
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#fcf3c6"
                                map={handleLeftPaintedTexture}
                                transparent={true}
                                alphaTest={0.5}
                                depthWrite={false}
                            />
                        </mesh>
                    )}
                    {/* Sketch handle overlay (front) */}
                    <mesh position={[-0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <revealMaterial color="#fcf3c6"
                            ref={leftHandleMaterialRef}
                            map={handleLeftTexture}
                            transparent={true}
                            alphaTest={0.5}
                            depthWrite={false}
                            uProgress={0.0}
                        />
                    </mesh>
                </group>
            </group>

            {/* RIGHT DOOR */}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                {/* Custom Stickers to cover old tech stack stickers - RIGHT DOOR */}
                <group position={[-doorWidth / 2, 0.45, 0.091]}>
                    <mesh position={[0.01, -0.01, -0.002]}>
                        <planeGeometry args={[0.73, 0.38]} />
                        <meshBasicMaterial color="#311059" transparent opacity={0.7} />
                    </mesh>
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[0.7, 0.35]} />
                        <meshBasicMaterial color="#fcf3c6" />
                    </mesh>
                    <Text
                        position={[0, 0.02, 0.001]}
                        fontSize={0.075}
                        color="#311059"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Bold.ttf"
                    >
                        AI/ML 🤖
                    </Text>
                </group>

                <group position={[-doorWidth / 2, -0.45, 0.091]}>
                    <mesh position={[0.01, -0.01, -0.002]}>
                        <planeGeometry args={[0.73, 0.38]} />
                        <meshBasicMaterial color="#311059" transparent opacity={0.7} />
                    </mesh>
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[0.7, 0.35]} />
                        <meshBasicMaterial color="#fcf3c6" />
                    </mesh>
                    <Text
                        position={[0, 0.02, 0.001]}
                        fontSize={0.07}
                        color="#311059"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/CabinSketch-Bold.ttf"
                    >
                        Web Dev 💻
                    </Text>
                </group>

                {/* Solid 3D Door Body with edge texture */}
                <mesh
                    position={[-doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#fcf3c6" map={edgeTexture} roughness={0.9} />
                </mesh>

                {/* Painted layer (behind sketch) - revealed when sketch fades out on hover */}
                {!isMobile && (
                    <mesh position={[-doorWidth / 2, 0, 0.088]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#fcf3c6"
                            map={doorRightPaintedTexture}
                            transparent={true}
                            alphaTest={0.5}
                            roughness={0.8}
                        />
                    </mesh>
                )}

                {/* Sketch overlay (front) - brush-stroke discard reveals painted beneath */}
                <mesh position={[-doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <revealMaterial color="#fcf3c6"
                        ref={rightDoorMaterialRef}
                        map={doorRightTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        depthWrite={false}
                        uProgress={0.0}
                    />
                </mesh>

                {/* Back Texture Face */}
                <mesh position={[-doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#fcf3c6"
                        map={doorBackTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                    />
                </mesh>

                {/* Handle Layer (animated) - pivot at screw center (40,459 on 332x848 texture) */}
                <group ref={rightHandleRef} position={[-doorWidth / 2 - 0.357, -0.099, 0.10]}>
                    {/* Painted handle (behind) - hidden until hover */}
                    {!isMobile && (
                        <mesh ref={rightHandlePaintedRef} position={[0.357, 0.09, -0.001]} visible={false}>
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#fcf3c6"
                                map={handleRightPaintedTexture}
                                transparent={true}
                                alphaTest={0.5}
                                depthWrite={false}
                            />
                        </mesh>
                    )}
                    {/* Sketch handle overlay (front) */}
                    <mesh position={[0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <revealMaterial color="#fcf3c6"
                            ref={rightHandleMaterialRef}
                            map={handleRightTexture}
                            transparent={true}
                            alphaTest={0.5}
                            depthWrite={false}
                            uProgress={0.0}
                        />
                    </mesh>
                </group>
            </group>

            {/* Warm lighting - WYLACZONE */}
            {/* <pointLight
                position={[0, doorBottomY + doorHeight + 1, 1]}
                intensity={0.8}
                color="#fff8e8"
                distance={10}
            /> */}
            {/* AVATAR - separate from window group, behind bricks */}
            <mesh
                ref={windowAvatarRef}
                position={[3.5, 0, 0.04]}
                rotation={[0, 0, 0]}
            >
                <planeGeometry args={[1.5, 1.5]} />
                <meshBasicMaterial color="#fcf3c6"
                    map={avatarWindowTexture}
                    transparent={true}
                />
            </mesh>

            {/* WINDOW - positioned to the right of doors */}
            <group
                position={[2.5, 0, 0.1]}
                onPointerEnter={handleWindowEnter}
                onPointerLeave={handleWindowLeave}
            >
                {/* Window Frame Sketch - in front of bricks */}
                <mesh position={[0, 0, 0.2]}>
                    <planeGeometry args={[1.5, 1.5]} />
                    <meshBasicMaterial color="#fcf3c6"
                        map={windowSketchTexture}
                        transparent={true}
                    />
                </mesh>
            </group>

            {/* DUCK POT (Right Side - Under Window) */}
            <group position={[2.5, floorY + 0.45, 0.4]}>
                {/* Pot texture */}
                <mesh>
                    <planeGeometry args={[3, 1.8]} />
                    <meshBasicMaterial color="#fcf3c6"
                        map={potTexture}
                        transparent={true}
                        alphaTest={0.01}
                        depthWrite={false}
                    />
                </mesh>

                {/* Invisible hitbox just for the duck (right side of pot) */}
                <mesh
                    position={[0.38, 0.1, 0.01]}
                    onClick={handleDuckClick}
                    onPointerEnter={() => { document.body.style.cursor = "pointer"; }}
                    onPointerLeave={() => { document.body.style.cursor = "auto"; }}
                >
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshBasicMaterial color="#fcf3c6" transparent opacity={0} />
                </mesh>

                {/* Speech Bubble */}
                <group
                    ref={speechBubbleRef}
                    position={[0.9, 0.8, 0.1]}
                    scale={[0, 0, 0]}
                >
                    <mesh>
                        <planeGeometry args={[1.8, 1.2]} />
                        <meshBasicMaterial color="#fcf3c6"
                            map={speechBubbleTexture}
                            transparent={true}
                            alphaTest={0.01}
                            depthWrite={false}
                        />
                    </mesh>

                    {/* Quote Text */}
                    {/* ROZMIAR TEKSTU: fontSize - mniejsza = mniejszy tekst */}
                    {/* ZAWIJANIE: maxWidth - mniejsza = wcześniejsze zawijanie */}
                    <Text
                        position={[0, 0.1, 0.01]}
                        fontSize={0.07}
                        color="#1a1a1a"
                        anchorX="center"
                        anchorY="middle"
                        font={FONT_URL}
                        maxWidth={1.4}
                        textAlign="center"
                        visible={isDuckSpeaking} // Toggle visibility instead of mounting/unmounting
                    >
                        {duckQuote || " "}
                    </Text>
                </group>
            </group>

            {/* === ANIMATED BUGS (5 total) === */}
            {BUG_CONFIGS.map((cfg) => {
                const isFixed = fixedBugs.includes(cfg.id);
                const clipProg = clipProgresses[cfg.id] || 0;
                return (
                    <group key={cfg.id}>
                        {/* Bug mesh — hidden when fixed */}
                        {!isFixed && (
                            <mesh
                                ref={(el) => { bugRefs.current[cfg.id] = el; }}
                                position={[cfg.baseX, floorY + cfg.baseY, cfg.z]}
                                onClick={(e) => handleBugClick(e, cfg.id)}
                                onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
                                onPointerLeave={() => { document.body.style.cursor = 'auto'; }}
                            >
                                <planeGeometry args={[cfg.hitbox ?? 0.4, cfg.hitbox ?? 0.4]} />
                                <meshBasicMaterial color="#fcf3c6"
                                    map={bugTexture}
                                    transparent={true}
                                    alphaTest={0.01}
                                    depthWrite={false}
                                />
                            </mesh>
                        )}

                        {/* Ink splash — always mounted (preloads texture); GSAP sets scale */}
                        <mesh
                            ref={(el) => { inkSplashRefs.current[cfg.id] = el; }}
                            position={[cfg.baseX, floorY + cfg.baseY, cfg.z + 0.01]}
                            scale={[0, 0, 0]}
                        >
                            <planeGeometry args={[2, 2]} />
                            <meshBasicMaterial color="#fcf3c6"
                                map={inkSplashTexture}
                                transparent={true}
                                alphaTest={0.01}
                                depthWrite={false}
                            />
                        </mesh>

                        {/* BUG FIXED! text — always mounted (preloads font); clip reveal via clipRect */}
                        <Text
                            ref={(el) => { bugFixedTextRefs.current[cfg.id] = el; }}
                            position={[cfg.baseX, floorY + cfg.baseY, cfg.z + 0.2]}
                            fontSize={0.25}
                            color="#1a1a1a"
                            anchorX="center"
                            anchorY="middle"
                            font="/fonts/CabinSketch-Bold.ttf"
                            outlineWidth={0.015}
                            outlineColor="#ffffff"
                            clipRect={[-1, -0.5, -1 + (clipProg * 2.5), 0.5]}
                        >
                            BUG FIXED!
                        </Text>
                    </group>
                );
            })}

            {/* TREE & MOUSE (Left Side) */}
            <group position={[-2.9, floorY + 2.7, 1]}>
                {/* Tree — original sketch texture only, no hover tint */}
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[6, 8]} />
                    <meshBasicMaterial color="#fcf3c6"
                        map={treeTexture}
                        transparent={true}
                        alphaTest={0.01}
                        depthWrite={false}
                    />
                </mesh>
                {/* Mouse Hanging - Pivot Group for swinging */}
                {/* Pivot is moved UP by ~2.0 to be near the top of the string/branch */}
                {/* Original Mesh Y was 0.02. New Pivot Y is 0.02 + 2.0 = 2.02 */}
                {/* Mouse Hanging - Pivot Group for swinging */}
                {/* Pivot: 421, 597px. Offset relative to center: X=0.351, Y=-0.456 */}
                {/* Group Position shift: (-0.01, 0.02) + (0.351, -0.456) = (0.341, -0.436) */}
                <group ref={mousePivotRef} position={[0.341, 0.02 - 0.456, 0]}>
                    {/* Mesh moves opposite to pivot offset to keep visual position */}
                    <mesh position={[-0.351, 0.456, 0]}>
                        <planeGeometry args={[6, 8]} />
                        <meshBasicMaterial color="#fcf3c6"
                            map={mouseTexture}
                            transparent={true}
                            alphaTest={0.01}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            </group>

            {/* CAT SKETCH (Front Facing) */}
            <group position={[-1.5, floorY + 0.6, 0.8]} ref={catGroupRef}>
                {/* Body */}
                <mesh>
                    <planeGeometry args={[1.5, 1.5]} />
                    <meshBasicMaterial color="#fcf3c6"
                        map={catFrontBodyTexture}
                        transparent={true}
                        alphaTest={0.01}
                        depthWrite={false}
                    />
                </mesh>

                {/* Left Pupil */}
                <mesh
                    ref={leftPupilRef}
                    position={[-0.063, 0.27, -0.02]} // Behind cat
                >
                    <circleGeometry args={[0.020, 32]} />
                    <meshBasicMaterial color="black" />
                    {/* Oval Scale */}
                    <group scale={[0.8, 1.2, 1]} />
                </mesh>

                {/* Right Pupil */}
                <mesh
                    ref={rightPupilRef}
                    position={[0.0615, 0.27, -0.02]} // Behind cat
                >
                    <circleGeometry args={[0.020, 32]} />
                    <meshBasicMaterial color="black" />
                </mesh>
            </group>

        </group>
    );
};

export default EntranceDoors;
