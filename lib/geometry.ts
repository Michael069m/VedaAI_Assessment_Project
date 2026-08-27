import { BoundingBox } from "@/types/assessment";

/**
 * Converts a BoundingBox (0-1000 scale or 0-100 scale)
 * to a CSS positioning style object with percentage strings.
 */
export function boundingBoxToStyle(box: BoundingBox): {
  top: string;
  left: string;
  height: string;
  width: string;
} {
  const is1000Scale =
    box.ymin > 100 || box.xmin > 100 || box.ymax > 100 || box.xmax > 100;
  const divisor = is1000Scale ? 10 : 1;

  const top = (box.ymin / divisor).toFixed(2);
  const left = (box.xmin / divisor).toFixed(2);
  const height = Math.max(0, (box.ymax - box.ymin) / divisor).toFixed(2);
  const width = Math.max(0, (box.xmax - box.xmin) / divisor).toFixed(2);

  return {
    top: `${top}%`,
    left: `${left}%`,
    height: `${height}%`,
    width: `${width}%`,
  };
}
