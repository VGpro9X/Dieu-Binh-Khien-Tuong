import type { BoardConfig, GridPosition } from '../core/types';

export interface MovementNode {
  position: GridPosition;
  cost: number;
  previousKey: string | null;
}

interface ReachableOptions {
  start: GridPosition;
  movementPoints: number;
  board: BoardConfig;
  getMovementCost: (position: GridPosition) => number | null;
  isBlocked: (position: GridPosition) => boolean;
}

export function positionKey(position: GridPosition): string {
  return `${position.x}:${position.y}`;
}

export function calculateReachable(options: ReachableOptions): Map<string, MovementNode> {
  const { start, movementPoints, board, getMovementCost, isBlocked } = options;
  const reachable = new Map<string, MovementNode>();
  const open: MovementNode[] = [
    {
      position: { ...start },
      cost: 0,
      previousKey: null,
    },
  ];

  reachable.set(positionKey(start), open[0]);

  while (open.length > 0) {
    open.sort((a, b) => a.cost - b.cost);
    const current = open.shift();
    if (!current) break;

    const currentKey = positionKey(current.position);
    const bestKnown = reachable.get(currentKey);
    if (!bestKnown || current.cost !== bestKnown.cost) continue;

    for (const neighbor of getNeighbors(current.position, board)) {
      if (isBlocked(neighbor) && positionKey(neighbor) !== positionKey(start)) continue;

      const stepCost = getMovementCost(neighbor);
      if (stepCost === null) continue;

      const nextCost = current.cost + stepCost;
      if (nextCost > movementPoints) continue;

      const neighborKey = positionKey(neighbor);
      const previous = reachable.get(neighborKey);
      if (previous && previous.cost <= nextCost) continue;

      const node: MovementNode = {
        position: { ...neighbor },
        cost: nextCost,
        previousKey: currentKey,
      };

      reachable.set(neighborKey, node);
      open.push(node);
    }
  }

  return reachable;
}

export function buildPath(
  reachable: Map<string, MovementNode>,
  destination: GridPosition,
): GridPosition[] {
  const destinationKey = positionKey(destination);
  if (!reachable.has(destinationKey)) return [];

  const path: GridPosition[] = [];
  let cursorKey = destinationKey;

  while (true) {
    const node = reachable.get(cursorKey);
    if (!node) return [];
    if (node.previousKey === null) break;

    path.unshift({ ...node.position });
    cursorKey = node.previousKey;
  }

  return path;
}

function getNeighbors(position: GridPosition, board: BoardConfig): GridPosition[] {
  const candidates: GridPosition[] = [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 },
  ];

  return candidates.filter(
    (candidate) =>
      candidate.x >= 0 &&
      candidate.y >= 0 &&
      candidate.x < board.columns &&
      candidate.y < board.rows,
  );
}
