/**
 * Bento Grid Layout Utilities
 * Enforces 4-column responsive grid, collision detection, and automatic compaction.
 */

export const GRID_COLUMNS = 4;
export const GRID_GAP = 24;
export const BASE_ROW_HEIGHT = 160;

/**
 * Get type-specific default block dimensions (w x h)
 */
export const getDefaultBlockSize = (type) => {
  const cleanType = (type || '').toLowerCase();
  switch (cleanType) {
    case 'emoji':
    case 'custom-emoji':
      return { w: 1, h: 1 };
    case 'instagram':
    case 'github':
    case 'youtube':
    case 'twitter':
    case 'linkedin':
      return { w: 2, h: 2 };
    case 'link':
    case 'custom-link':
    case 'text':
    case 'custom-text':
    case 'checklist':
    case 'custom-checklist':
    case 'image':
    default:
      return { w: 2, h: 1 };
  }
};

/**
 * Check if two grid blocks collide (overlap)
 */
export const collides = (b1, b2) => {
  if (b1.id === b2.id) return false;
  return (
    b1.x < b2.x + b2.w &&
    b1.x + b1.w > b2.x &&
    b1.y < b2.y + b2.h &&
    b1.y + b1.h > b2.y
  );
};

/**
 * Automatically compact layout by moving blocks up whenever possible
 * @param {Array} blocks 
 * @returns {Array} Compacted blocks
 */
export const compactLayout = (blocks) => {
  const sorted = [...blocks].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const compacted = [];

  for (const block of sorted) {
    let current = { ...block };
    // Move up row-by-row until collision occurs or top boundary (y=0) reached
    while (current.y > 0) {
      const candidate = { ...current, y: current.y - 1 };
      if (compacted.some(other => collides(other, candidate))) {
        break;
      }
      current.y -= 1;
    }
    compacted.push(current);
  }

  return compacted;
};

/**
 * Resolve layout collisions when moving or resizing a block.
 * Guarantees that the movingBlock remains locked at the user's requested {x, y, w, h} position
 * and sibling blocks reflow/push down if collisions occur.
 * Empty vertical space created by the user is fully preserved.
 * 
 * @param {Array} blocks 
 * @param {Object|null} movingBlock 
 * @returns {Array} Resolved collision-free blocks array
 */
export const resolveLayout = (blocks, movingBlock = null) => {
  if (!blocks || blocks.length === 0) return [];

  const movingId = movingBlock ? (movingBlock.id || movingBlock._id) : null;

  // 1. Separate the locked moving block from sibling blocks
  let fixedMovingBlock = null;
  if (movingId) {
    const found = blocks.find(b => (b.id || b._id) === movingId) || movingBlock;
    const targetX = movingBlock.x !== undefined ? movingBlock.x : found.x;
    const targetY = movingBlock.y !== undefined ? movingBlock.y : found.y;
    const targetW = movingBlock.w !== undefined ? movingBlock.w : found.w;
    const targetH = movingBlock.h !== undefined ? movingBlock.h : found.h;

    fixedMovingBlock = {
      ...found,
      x: targetX,
      y: targetY,
      w: targetW,
      h: targetH,
      layout: {
        ...(found.layout || {}),
        x: targetX,
        y: targetY,
        w: targetW,
        h: targetH
      }
    };
  }

  // 2. Placed blocks array. If movingBlock exists, place it FIRST as authoritative anchor.
  const placed = [];
  if (fixedMovingBlock) {
    placed.push(fixedMovingBlock);
  }

  // 3. Sort remaining sibling blocks by y, then x
  const siblings = blocks
    .filter(b => !movingId || (b.id || b._id) !== movingId)
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

  // 4. Place each sibling block. If it collides with placed blocks (including fixedMovingBlock), push down.
  for (const block of siblings) {
    let target = { ...block };
    while (placed.some(other => collides(other, target))) {
      target.y += 1;
    }
    placed.push({
      ...target,
      layout: {
        ...(target.layout || {}),
        x: target.x,
        y: target.y,
        w: target.w,
        h: target.h
      }
    });
  }

  return placed;
};

/**
 * Intelligent Spatial Swapping & Reorder Algorithm
 * 
 * When movingBlock is dragged onto a target position (targetX, targetY):
 * 1. movingBlock takes absolute priority at (targetX, targetY).
 * 2. If an existing sibling block occupies the target region, the algorithm attempts:
 *    a) Direct origin swap: Place the displaced block into movingBlock's original position (originalX, originalY) if it fits.
 *    b) Nearest Manhattan proximity search: Search grid coordinates around targetX, targetY and originalX, originalY
 *       for the closest available space fitting the displaced block's w x h.
 * 3. Recursively resolves any secondary collisions until all blocks are placed collision-free without overlaps.
 * 
 * @param {Array} blocks Current blocks list
 * @param {Object} movingBlock Currently dragged block with candidate {x, y, w, h}
 * @param {number} originalX Dragged block's origin X
 * @param {number} originalY Dragged block's origin Y
 * @param {number} activeColumns Active grid columns count
 * @returns {Array} Reordered collision-free blocks list
 */
export const resolveDragReorder = (
  blocks,
  movingBlock,
  originalX,
  originalY,
  activeColumns = GRID_COLUMNS
) => {
  if (!blocks || blocks.length === 0) return [];
  if (!movingBlock) return resolveLayout(blocks, null);

  const movingId = movingBlock.id || movingBlock._id;
  const targetX = Math.max(0, Math.min(activeColumns - movingBlock.w, movingBlock.x));
  const targetY = Math.max(0, movingBlock.y);

  // 1. Lock movingBlock at user's candidate position
  const fixedMovingBlock = {
    ...movingBlock,
    id: movingId,
    x: targetX,
    y: targetY,
    w: movingBlock.w,
    h: movingBlock.h,
    layout: {
      ...(movingBlock.layout || {}),
      x: targetX,
      y: targetY,
      w: movingBlock.w,
      h: movingBlock.h
    }
  };

  const placed = [fixedMovingBlock];
  const remainingSiblings = blocks
    .filter(b => (b.id || b._id) !== movingId)
    .map(b => ({ ...b }));

  // Helper to find best spatial position for a displaced block
  const findBestPositionForBlock = (blockToPlace) => {
    // Attempt 1: Direct Swap into movingBlock's origin (originalX, originalY)
    const origCandidate = {
      ...blockToPlace,
      x: originalX,
      y: originalY
    };

    if (
      originalX >= 0 &&
      originalY >= 0 &&
      originalX + blockToPlace.w <= activeColumns &&
      !placed.some(p => collides(p, origCandidate))
    ) {
      return { x: originalX, y: originalY };
    }

    // Attempt 2: Manhattan distance proximity search near (targetX, targetY) & (originalX, originalY)
    let bestPos = null;
    let minDistance = Infinity;

    const maxSearchY = Math.max(...blocks.map(b => (b.y || 0) + (b.h || 1)), targetY + 6) + 2;

    for (let candidateY = 0; candidateY <= maxSearchY; candidateY++) {
      for (let candidateX = 0; candidateX <= activeColumns - blockToPlace.w; candidateX++) {
        const testCandidate = { ...blockToPlace, x: candidateX, y: candidateY };

        if (!placed.some(p => collides(p, testCandidate))) {
          const distToTarget = Math.abs(candidateX - targetX) + Math.abs(candidateY - targetY);
          const distToOrigin = Math.abs(candidateX - originalX) + Math.abs(candidateY - originalY);
          const distanceScore = distToTarget * 1.5 + distToOrigin;

          if (distanceScore < minDistance) {
            minDistance = distanceScore;
            bestPos = { x: candidateX, y: candidateY };
          }
        }
      }
    }

    if (bestPos) return bestPos;

    // Fallback: Push down below placed blocks
    let fallbackY = 0;
    while (placed.some(p => collides(p, { ...blockToPlace, x: 0, y: fallbackY }))) {
      fallbackY += 1;
    }
    return { x: 0, y: fallbackY };
  };

  // Process siblings: Displaced blocks (colliding with placed) are reordered first
  while (remainingSiblings.length > 0) {
    const collidingIdx = remainingSiblings.findIndex(sib => placed.some(p => collides(p, sib)));

    if (collidingIdx !== -1) {
      const collidingBlock = remainingSiblings.splice(collidingIdx, 1)[0];
      const newPos = findBestPositionForBlock(collidingBlock);

      placed.push({
        ...collidingBlock,
        x: newPos.x,
        y: newPos.y,
        layout: {
          ...(collidingBlock.layout || {}),
          x: newPos.x,
          y: newPos.y,
          w: collidingBlock.w,
          h: collidingBlock.h
        }
      });
    } else {
      const nextSib = remainingSiblings.shift();
      placed.push({
        ...nextSib,
        layout: {
          ...(nextSib.layout || {}),
          x: nextSib.x,
          y: nextSib.y,
          w: nextSib.w,
          h: nextSib.h
        }
      });
    }
  }

  return placed;
};

/**
 * Get responsive active columns based on container width
 * @param {number} containerWidth
 * @returns {number} activeColumns (1, 2, or 4)
 */
export const getActiveColumns = (containerWidth) => {
  if (!containerWidth || containerWidth >= 900) return GRID_COLUMNS;
  if (containerWidth >= 600) return 2;
  return 1;
};

/**
 * Get column width and row height for a given container width
 * @param {number} containerWidth
 * @param {number} columns
 * @returns {{ colWidth: number, rowHeight: number, gap: number }}
 */
export const getGridDimensions = (containerWidth, columns = GRID_COLUMNS) => {
  const gap = GRID_GAP;
  const colWidth = containerWidth > 0 ? (containerWidth + gap) / columns : 240;
  const rowHeight = BASE_ROW_HEIGHT + gap;
  return { colWidth, rowHeight, gap };
};

/**
 * Calculate drag snapped position with anchored hysteresis & deadband
 * @param {number} currentLeft Pixel left
 * @param {number} currentTop Pixel top
 * @param {number} colWidth Column width in px
 * @param {number} rowHeight Row height in px
 * @param {number} lastSnapX Currently committed grid x reference
 * @param {number} lastSnapY Currently committed grid y reference
 * @param {number} blockW Block width in grid units
 * @param {number} activeColumns Total active columns
 * @param {number} threshold Hysteresis activation threshold (default 0.55 = 55% cell distance)
 * @returns {{ snapX: number, snapY: number }}
 */
export const calculateDragSnapWithHysteresis = (
  currentLeft,
  currentTop,
  colWidth,
  rowHeight,
  lastSnapX,
  lastSnapY,
  blockW,
  activeColumns = GRID_COLUMNS,
  threshold = 0.55
) => {
  const floatingX = currentLeft / colWidth;
  const floatingY = currentTop / rowHeight;

  let snapX = lastSnapX;
  let snapY = lastSnapY;

  // Horizontal Anchored Hysteresis with Deadband
  const deltaX = floatingX - lastSnapX;
  if (deltaX >= threshold) {
    snapX = lastSnapX + Math.floor(deltaX + (1 - threshold));
  } else if (deltaX <= -threshold) {
    snapX = lastSnapX + Math.ceil(deltaX - (1 - threshold));
  }

  // Vertical Anchored Hysteresis with Deadband
  const deltaY = floatingY - lastSnapY;
  if (deltaY >= threshold) {
    snapY = lastSnapY + Math.floor(deltaY + (1 - threshold));
  } else if (deltaY <= -threshold) {
    snapY = lastSnapY + Math.ceil(deltaY - (1 - threshold));
  }

  // Clamping
  snapX = Math.max(0, Math.min(activeColumns - blockW, snapX));
  snapY = Math.max(0, snapY);

  return { snapX, snapY };
};

/**
 * Automatically position blocks into a grid layout
 * @param {Array} blocks 
 * @returns {Array} Positioned blocks
 */
export const placeBlocks = (blocks) => {
  const placed = [];

  for (const block of blocks) {
    const defaultSize = getDefaultBlockSize(block.blockType || block.type);

    let w = block.layout?.w !== undefined ? block.layout.w : (block.w !== undefined ? block.w : defaultSize.w);
    let h = block.layout?.h !== undefined ? block.layout.h : (block.h !== undefined ? block.h : defaultSize.h);
    let x = block.layout?.x !== undefined ? block.layout.x : (block.x !== undefined ? block.x : 0);
    let y = block.layout?.y !== undefined ? block.layout.y : (block.y !== undefined ? block.y : 0);

    w = Math.max(1, Math.min(GRID_COLUMNS, w));
    h = Math.max(1, h);

    const isUnplaced = block.x === undefined && (!block.layout || block.layout.x === undefined);

    if (isUnplaced) {
      x = 0;
      y = 0;
      let target = { id: block.id || block._id, x, y, w, h };
      while (true) {
        target.x = x;
        target.y = y;
        if (x + w <= GRID_COLUMNS && !placed.some(p => collides(p, target))) {
          break;
        }
        x += 1;
        if (x >= GRID_COLUMNS) {
          x = 0;
          y += 1;
        }
      }
    }

    placed.push({
      ...block,
      id: block.id || block._id,
      layout: { x, y, w, h },
      x,
      y,
      w,
      h
    });
  }

  return resolveLayout(placed, null);
};

