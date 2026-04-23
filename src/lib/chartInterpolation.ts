/**
 * Chart Interpolation & Live Jitter Utility
 * Used for creating smooth trend lines between admin-defined checkpoints
 * and adding micro-volatility to make the chart feel "alive".
 */

export interface MarketCheckpoint {
    timestamp: number;
    value: number;
}

/**
 * Generates intermediate points between two checkpoints using a bounded random walk.
 * This simulates organic market volatility (ups and downs) that trends towards a specific target.
 */
export const interpolatePoints = (
    start: MarketCheckpoint,
    end: MarketCheckpoint,
    numPoints: number
): MarketCheckpoint[] => {
    const points: MarketCheckpoint[] = [];
    
    // Pseudo-random generator seeded by the specific trend properties
    // This ensures the jagged path stays consistent across re-renders
    let seed = (start.value + end.value + start.timestamp + end.timestamp) % 2147483647;
    const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed / 2147483647) * 2 - 1; // Returns -1 to 1
    };
    
    // 1. Generate the raw random walk
    let currentWalk = 0;
    const walkData: number[] = [];
    for (let i = 0; i <= numPoints; i++) {
        walkData.push(currentWalk);
        // Step size is random between -1 and 1
        currentWalk += rnd();
    }
    
    // 2. Calculate the baseline normalized wander
    const finalWalkValue = walkData[walkData.length - 1];
    const normalizedWanders: number[] = [];
    let maxAbsWander = 0.0001; // Avoid divide by zero
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const linearBaseline = finalWalkValue * t;
        const nw = walkData[i] - linearBaseline;
        normalizedWanders.push(nw);
        if (Math.abs(nw) > maxAbsWander) maxAbsWander = Math.abs(nw);
    }

    // 3. Assemble the final values ensuring extreme strict bounds
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        
        // This is the true linear trend
        const backbone = start.value + (end.value - start.value) * t;
        
        // Bounded wander is strictly locked between -1 and 1
        const boundedWander = normalizedWanders[i] / maxAbsWander;
        
        // Scale the volatility. MAX 1.5% deviation from backbone.
        const volatilityStrength = start.value * 0.015; 
        const dampening = Math.sin(t * Math.PI); 
        
        const finalAssetValue = backbone + (boundedWander * volatilityStrength * dampening);
        const interpolatedTime = start.timestamp + (end.timestamp - start.timestamp) * t;
        
        points.push({ timestamp: interpolatedTime, value: Math.max(0, finalAssetValue) }); // No sub-zero prices
    }
    
    return points;
};

/**
 * Applies a micro-wobble to all points, tied explicitly to the timestamp.
 * This guarantees it wobbles realistically without wildly swinging history.
 */
export const addJitter = (data: MarketCheckpoint[], intensity: number = 0.0015): MarketCheckpoint[] => {
    return data.map((point) => {
        // Tie wobble strictly to time components so it's consistent
        const tStamp = point.timestamp / 10000;
        
        // Compose multiple sine waves to create chaotic/unpredictable movement
        const wave1 = Math.sin(tStamp * 24.3) * Math.cos(tStamp * 11.2);
        const wave2 = Math.sin(tStamp * 5.1) * Math.cos(tStamp * 8.7);
        const wave3 = Math.cos(tStamp * 31.8);
        
        const totalWobble = (wave1 + wave2 + wave3) / 3; // -1 to 1
        
        return {
            ...point,
            value: point.value + (point.value * intensity * totalWobble)
        };
    });
};
