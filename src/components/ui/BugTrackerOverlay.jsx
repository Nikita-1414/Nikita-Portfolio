import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useBugs } from '../../context/BugContext';
import { useScene } from '../../context/SceneContext';

/**
 * BugTrackerOverlay — DOM overlay (outside Canvas)
 *
 * Shows "Bugs Fixed: X/5" in the top-right corner.
 * When all 5 bugs are fixed, shows a "🏆 Debug Master Unlocked" toast.
 * Styled consistent with the hand-drawn/sketch aesthetic.
 */
const BugTrackerOverlay = () => {
    const { fixedCount, totalBugs, allFixed } = useBugs();
    const { hasEntered, isEntering, isTeleporting } = useScene();
    const toastRef = useRef(null);
    const counterRef = useRef(null);
    const toastShownRef = useRef(false);
    const [isCounterMounted, setIsCounterMounted] = useState(true);

    // Show achievement toast when all bugs fixed
    useEffect(() => {
        if (allFixed && !toastShownRef.current && toastRef.current) {
            toastShownRef.current = true;

            // Animate in
            gsap.fromTo(toastRef.current,
                { opacity: 0, scale: 0.7, y: 20 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'back.out(1.7)',
                    onComplete: () => {
                        // Auto-dismiss after 3.5s
                        gsap.to(toastRef.current, {
                            opacity: 0,
                            scale: 0.85,
                            y: -12,
                            duration: 0.4,
                            ease: 'power2.in',
                            delay: 3.5,
                        });
                    }
                }
            );
        }
    }, [allFixed]);

    const shouldShowCounter = !hasEntered && !isEntering && !isTeleporting;

    useEffect(() => {
        if (!counterRef.current) return;

        if (shouldShowCounter) {
            setIsCounterMounted(true);
            gsap.fromTo(counterRef.current,
                { opacity: 0, y: -10, scale: 0.96 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                }
            );
        } else {
            gsap.to(counterRef.current, {
                opacity: 0,
                y: -10,
                scale: 0.96,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => setIsCounterMounted(false),
            });
        }
    }, [shouldShowCounter]);

    return (
        <>
            {/* Bug counter — top-right corner */}
            {isCounterMounted && (
                <div ref={counterRef} style={counterStyle}>
                    <span style={bugIconStyle}>🐛</span>
                    <span style={counterTextStyle}>
                        Bugs Fixed: <strong>{fixedCount}</strong>/{totalBugs}
                    </span>
                    {/* Progress dots */}
                    <div style={dotsRowStyle}>
                        {Array.from({ length: totalBugs }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    ...dotStyle,
                                    background: i < fixedCount ? '#311059' : 'transparent',
                                    border: `2px solid ${i < fixedCount ? '#311059' : '#311059aa'}`,
                                    transform: i < fixedCount ? 'scale(1.15)' : 'scale(1)',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Achievement Toast */}
            <div ref={toastRef} style={toastStyle}>
                <span style={toastTrophyStyle}>🏆</span>
                <div style={toastBodyStyle}>
                    <div style={toastTitleStyle}>Debug Master Unlocked</div>
                    <div style={toastSubStyle}>All 5 bugs squashed!</div>
                </div>
            </div>
        </>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const counterStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(252, 243, 198, 0.92)',
    border: '2px solid #311059',
    borderRadius: '4px',
    // Torn-paper clip edges
    clipPath: `polygon(
        0% 0%, 100% 0%,
        100% 0%, 98% 12%, 100% 25%, 97% 50%, 100% 75%, 98% 88%, 100% 100%,
        90% 97%, 80% 100%, 70% 97%, 60% 100%, 50% 97%, 40% 100%, 30% 97%, 20% 100%, 10% 97%, 0% 100%,
        2% 88%, 0% 75%, 3% 50%, 0% 25%, 2% 12%, 0% 0%
    )`,
    boxShadow: '3px 3px 0 #311059',
    pointerEvents: 'none',
};

const bugIconStyle = {
    fontSize: '1.1rem',
    alignSelf: 'flex-end',
};

const counterTextStyle = {
    fontFamily: "'Cabin Sketch', cursive",
    fontSize: '0.85rem',
    color: '#311059',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
};

const dotsRowStyle = {
    display: 'flex',
    gap: '5px',
};

const dotStyle = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
};

const toastStyle = {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 22px',
    background: 'rgba(252, 243, 198, 0.97)',
    border: '2.5px solid #311059',
    borderRadius: '4px',
    clipPath: `polygon(
        0% 0%, 100% 0%,
        100% 0%, 99% 15%, 100% 30%, 98% 55%, 100% 75%, 99% 90%, 100% 100%,
        85% 97%, 70% 100%, 55% 97%, 40% 100%, 25% 97%, 10% 100%, 0% 100%,
        1% 90%, 0% 75%, 2% 55%, 0% 30%, 1% 15%, 0% 0%
    )`,
    boxShadow: '4px 4px 0 #311059',
    opacity: 0,          // hidden initially — GSAP will animate in
    pointerEvents: 'none',
    minWidth: '240px',
};

const toastTrophyStyle = {
    fontSize: '2rem',
    lineHeight: 1,
    flexShrink: 0,
};

const toastBodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
};

const toastTitleStyle = {
    fontFamily: "'Cabin Sketch', cursive",
    fontSize: '1.05rem',
    fontWeight: 'bold',
    color: '#311059',
    letterSpacing: '0.5px',
};

const toastSubStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.78rem',
    color: '#555',
};

export default BugTrackerOverlay;
