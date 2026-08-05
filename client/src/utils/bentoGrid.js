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
 * Resolve layout collisions when moving or resizing a block
 * @param {Array} blocks 
 * @param {Object|null} movingBlock 
 * @returns {Array} Resolved and compacted blocks
 */
export const resolveLayout = (blocks, movingBlock = null) => {
  const sorted = [...blocks].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const resolved = [];
  if (movingBlock) {
    resolved.push({ ...movingBlock });
  }

  for (const block of sorted) {
    if (movingBlock && (block.id === movingBlock.id || block._id === movingBlock._id)) continue;
    let target = { ...block };

    // Push down if colliding with already placed blocks
    while (resolved.some(r => collides(r, target))) {
      target.y += 1;
    }
    resolved.push(target);
  }

  return compactLayout(resolved);
};

/**
 * Automatically position blocks into a 4-column grid layout
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
