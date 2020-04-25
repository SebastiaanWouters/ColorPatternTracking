// Adapted conversion from: https://www.w3schools.com/colors/w3-nbs.txt

import { ILabColor, labDistanceSq } from "./bram/labTest";

export type ReducedColorsNames =
  | "Pink"
  | "White"
  | "Gray"
  | "Red"
  | "Black"
  | "Orange"
  | "Brown"
  | "Yellow"
  | "Green"
  | "Blue"
  | "Purple";

export function ISCC_NBS_COLORS_to_REDUCED_COLORS(
  ISCC_NBS_colorName: String
): ReducedColorsNames {
  //@ts-ignore
  return ISCC_NBS_colorName.substring(ISCC_NBS_colorName.lastIndexOf("_") + 1);
}

export const SIMPLE_COLORS_DICT = {
  Red: { l: 50, a: 128, b: 128 },
  Green: { l: 50, a: -128, b: 128 },
  Blue: { l: 50, a: 0, b: -128 },
};

export function closestSimpleColor(color: ILabColor): "Red" | "Green" | "Blue" {
  const r_d = labDistanceSq(color, SIMPLE_COLORS_DICT.Red);
  const g_d = labDistanceSq(color, SIMPLE_COLORS_DICT.Green);
  const b_d = labDistanceSq(color, SIMPLE_COLORS_DICT.Blue);
  const min_d = Math.min(r_d, g_d, b_d);
  if (r_d == min_d) return "Red";
  if (g_d == min_d) return "Green";
  if (b_d == min_d) return "Blue";
}

export const ISCC_NBS_COLOR_DICT: { [color: string]: ILabColor } = {
  Vivid_Pink: {
    l: 80.66,
    a: 27.54,
    b: 8.23,
  },
  Strong_Pink: {
    l: 69.94,
    a: 33.52,
    b: 10.72,
  },
  Deep_Pink: {
    l: 61.4,
    a: 45.42,
    b: 16.16,
  },
  Light_Pink: {
    l: 85.8,
    a: 15.56,
    b: 6.97,
  },
  Moderate_Pink: {
    l: 72.97,
    a: 20.88,
    b: 8.76,
  },
  Dark_Pink: {
    l: 60.1,
    a: 24.91,
    b: 9.63,
  },
  Pale_Pink: {
    l: 87.73,
    a: 6.02,
    b: 2.72,
  },
  Grayish_Pink: {
    l: 72.91,
    a: 7.75,
    b: 3.4,
  },
  Pinkish_White: {
    l: 90.72,
    a: 2.02,
    b: 1.81,
  },
  Pinkish_Gray: {
    l: 74.86,
    a: 3.37,
    b: 2.91,
  },
  Vivid_Red: {
    l: 39.88,
    a: 65.26,
    b: 29.71,
  },
  Strong_Red: {
    l: 45.28,
    a: 50.81,
    b: 21.63,
  },
  Deep_Red: {
    l: 29.1,
    a: 44.59,
    b: 16.89,
  },
  Very_Deep_Red: {
    l: 18.33,
    a: 37.03,
    b: 7.9,
  },
  Moderate_Red: {
    l: 45.24,
    a: 38.5,
    b: 16.22,
  },
  Dark_Red: {
    l: 29.12,
    a: 30.37,
    b: 9.72,
  },
  Very_Dark_Red: {
    l: 14.53,
    a: 21.71,
    b: -1.96,
  },
  Light_Grayish_Red: {
    l: 60.03,
    a: 13.47,
    b: 7.53,
  },
  Grayish_Red: {
    l: 45.01,
    a: 20.89,
    b: 8.64,
  },
  Dark_Grayish_Red: {
    l: 28.33,
    a: 10.43,
    b: 2.72,
  },
  Blackish_Red: {
    l: 13.04,
    a: 9.09,
    b: 0.63,
  },
  Reddish_Gray: {
    l: 55.15,
    a: 4.95,
    b: 3.01,
  },
  Dark_Reddish_Gray: {
    l: 35.16,
    a: 4.78,
    b: 2.41,
  },
  Reddish_Black: {
    l: 13.23,
    a: 4.27,
    b: 0.08,
  },
  Vivid_Yellowish_Pink: {
    l: 80.65,
    a: 23.83,
    b: 19.52,
  },
  Strong_Yellowish_Pink: {
    l: 71.14,
    a: 35.83,
    b: 30.3,
  },
  Deep_Yellowish_Pink: {
    l: 58.63,
    a: 45.86,
    b: 59.07,
  },
  Light_Yellowish_Pink: {
    l: 82.76,
    a: 17.83,
    b: 6.81,
  },
  Moderate_Yellowish_Pink: {
    l: 72.82,
    a: 19.2,
    b: 5.73,
  },
  Dark_Yellowish_Pink: {
    l: 61.09,
    a: 23.81,
    b: 15.65,
  },
  Pale_Yellowish_Pink: {
    l: 86.73,
    a: 5.42,
    b: 10.79,
  },
  Grayish_Yellowish_Pink: {
    l: 72.68,
    a: 7.78,
    b: 8.59,
  },
  Brownish_Pink: {
    l: 71.74,
    a: 4.9,
    b: 12.68,
  },
  Vivid_Reddish_Orange: {
    l: 55.34,
    a: 51.36,
    b: 55.69,
  },
  Strong_Reddish_Orange: {
    l: 55.52,
    a: 45.24,
    b: 43.6,
  },
  Deep_Reddish_Orange: {
    l: 40.36,
    a: 45.41,
    b: 40.47,
  },
  Moderate_Reddish_Orange: {
    l: 56.32,
    a: 34.61,
    b: 32.11,
  },
  Dark_Reddish_Orange: {
    l: 41.23,
    a: 34.66,
    b: 29.81,
  },
  Grayish_Reddish_Orange: {
    l: 55.07,
    a: 22.69,
    b: 22.56,
  },
  Strong_Reddish_Brown: {
    l: 32.2,
    a: 37.72,
    b: 34.09,
  },
  Deep_Reddish_Brown: {
    l: 16.29,
    a: 34.45,
    b: 20.16,
  },
  Light_Reddish_Brown: {
    l: 55.93,
    a: 15.01,
    b: 14.88,
  },
  Moderate_Reddish_Brown: {
    l: 35.03,
    a: 21.77,
    b: 15.36,
  },
  Dark_Reddish_Brown: {
    l: 15.47,
    a: 16.17,
    b: 6.6,
  },
  Light_Grayish_Reddish_Brown: {
    l: 55.07,
    a: 7.25,
    b: 9.95,
  },
  Grayish_Reddish_Brown: {
    l: 35.02,
    a: 10.62,
    b: 7.42,
  },
  Dark_Grayish_Reddish_Brown: {
    l: 21.96,
    a: 8.31,
    b: 4.66,
  },
  Vivid_Orange: {
    l: 66.18,
    a: 36.09,
    b: 72.64,
  },
  Brilliant_Orange: {
    l: 71.16,
    a: 33.23,
    b: 59.59,
  },
  Strong_Orange: {
    l: 66.15,
    a: 32.87,
    b: 61.46,
  },
  Deep_Orange: {
    l: 52.19,
    a: 30.8,
    b: 55.16,
  },
  Light_Orange: {
    l: 78.99,
    a: 18.97,
    b: 37.31,
  },
  Moderate_Orange: {
    l: 66.06,
    a: 22.07,
    b: 40.69,
  },
  Brownish_Orange: {
    l: 51.14,
    a: 23.19,
    b: 38.56,
  },
  Strong_Brown: {
    l: 36.08,
    a: 21.31,
    b: 35.41,
  },
  Deep_Brown: {
    l: 25.45,
    a: 14.5,
    b: 23.4,
  },
  Light_Brown: {
    l: 55.1,
    a: 12.59,
    b: 24,
  },
  Moderate_Brown: {
    l: 36.18,
    a: 10.87,
    b: 19.09,
  },
  Dark_Brown: {
    l: 18.13,
    a: 12.17,
    b: 14.42,
  },
  Light_Grayish_Brown: {
    l: 55.07,
    a: 5.41,
    b: 11.65,
  },
  Grayish_Brown: {
    l: 35.97,
    a: 5.78,
    b: 8.69,
  },
  Dark_Grayish_Brown: {
    l: 21.9,
    a: 4.28,
    b: 5.84,
  },
  Light_Brownish_Gray: {
    l: 55.17,
    a: 2.94,
    b: 6.51,
  },
  Brownish_Gray: {
    l: 35.06,
    a: 4.35,
    b: 2.25,
  },
  Brownish_Black: {
    l: 13.03,
    a: 3.03,
    b: 4.15,
  },
  Vivid_Orange_Yellow: {
    l: 74.1,
    a: 19.62,
    b: 77.9,
  },
  Brilliant_Orange_Yellow: {
    l: 81.82,
    a: 11.35,
    b: 63.74,
  },
  Strong_Orange_Yellow: {
    l: 71.85,
    a: 17.06,
    b: 70.08,
  },
  Deep_Orange_Yellow: {
    l: 60.95,
    a: 17.86,
    b: 66.62,
  },
  Light_Orange_Yellow: {
    l: 83.87,
    a: 8.91,
    b: 43.51,
  },
  Moderate_Orange_Yellow: {
    l: 72.91,
    a: 13.29,
    b: 49.52,
  },
  Dark_Orange_Yellow: {
    l: 61.19,
    a: 12.09,
    b: 47.74,
  },
  Pale_Orange_Yellow: {
    l: 87.55,
    a: 5.76,
    b: 28.87,
  },
  Strong_Yellowish_Brown: {
    l: 47.15,
    a: 14.54,
    b: 49.3,
  },
  Deep_Yellowish_Brown: {
    l: 32.12,
    a: 9.72,
    b: 26.27,
  },
  Light_Yellowish_Brown: {
    l: 66.14,
    a: 8.37,
    b: 30.15,
  },
  Moderate_Yellowish_Brown: {
    l: 45.17,
    a: 6.53,
    b: 23.45,
  },
  Dark_Yellowish_Brown: {
    l: 24.46,
    a: 6.41,
    b: 16.81,
  },
  Light_Grayish_Yellowish_Brown: {
    l: 65,
    a: 2.99,
    b: 15.68,
  },
  Grayish_Yellowish_Brown: {
    l: 47.12,
    a: 3.54,
    b: 13.09,
  },
  Dark_Grayish_Yellowish_Brown: {
    l: 26.27,
    a: 3.42,
    b: 8.13,
  },
  Vivid_Yellow: {
    l: 80.79,
    a: 3.17,
    b: 82.29,
  },
  Brilliant_Yellow: {
    l: 87.62,
    a: -2.72,
    b: 63.39,
  },
  Strong_Yellow: {
    l: 72.85,
    a: 1.38,
    b: 62.91,
  },
  Deep_Yellow: {
    l: 60.08,
    a: 2.06,
    b: 61.41,
  },
  Light_Yellow: {
    l: 88.78,
    a: -3.15,
    b: 50.01,
  },
  Moderate_Yellow: {
    l: 71.88,
    a: -0.39,
    b: 44.72,
  },
  Dark_Yellow: {
    l: 61.07,
    a: 0.36,
    b: 43.69,
  },
  Pale_Yellow: {
    l: 90.8,
    a: -3.83,
    b: 30.06,
  },
  Grayish_Yellow: {
    l: 72.81,
    a: -1.75,
    b: 27.67,
  },
  Dark_Grayish_Yellow: {
    l: 59.95,
    a: -0.18,
    b: 27.47,
  },
  Yellowish_White: {
    l: 92.67,
    a: -1.32,
    b: 10.42,
  },
  Yellowish_Gray: {
    l: 74.87,
    a: -0.79,
    b: 10.53,
  },
  Light_Olive_Brown: {
    l: 49.93,
    a: 6.32,
    b: 50.86,
  },
  Moderate_Olive_Brown: {
    l: 37.16,
    a: 3.64,
    b: 34.2,
  },
  Dark_Olive_Brown: {
    l: 20.97,
    a: 1.72,
    b: 11.9,
  },
  Vivid_Greenish_Yellow: {
    l: 82.81,
    a: -14.85,
    b: 82.77,
  },
  Brilliant_Greenish_Yellow: {
    l: 88.63,
    a: -15.53,
    b: 69.74,
  },
  Strong_Greenish_Yellow: {
    l: 72.9,
    a: -12.72,
    b: 65.4,
  },
  Deep_Greenish_Yellow: {
    l: 60.02,
    a: -11.18,
    b: 63.7,
  },
  Light_Greenish_Yellow: {
    l: 89.61,
    a: -13.17,
    b: 53.12,
  },
  Moderate_Greenish_Yellow: {
    l: 72.01,
    a: -10.6,
    b: 46.49,
  },
  Dark_Greenish_Yellow: {
    l: 60.07,
    a: -10.08,
    b: 44.97,
  },
  Pale_Greenish_Yellow: {
    l: 90.81,
    a: -9.23,
    b: 33.53,
  },
  Grayish_Greenish_Yellow: {
    l: 72.79,
    a: -7.29,
    b: 29.1,
  },
  Light_Olive_Gray: {
    l: 56.13,
    a: -1.98,
    b: 9.55,
  },
  Olive_Gray: {
    l: 36.07,
    a: -0.99,
    b: 5.54,
  },
  Olive_Black: {
    l: 14.08,
    a: -1.1,
    b: 4.85,
  },
  Vivid_Yellow_Green: {
    l: 68.84,
    a: -34.13,
    b: 69.78,
  },
  Brilliant_Yellow_Green: {
    l: 82.73,
    a: -27.99,
    b: 59.65,
  },
  Strong_Yellow_Green: {
    l: 61.16,
    a: -27.95,
    b: 52.41,
  },
  Deep_Yellow_Green: {
    l: 43.17,
    a: -28.58,
    b: 34.47,
  },
  Light_Yellow_Green: {
    l: 84.69,
    a: -19.41,
    b: 38.68,
  },
  Moderate_Yellow_Green: {
    l: 61.02,
    a: -16.28,
    b: 31.16,
  },
  Pale_Yellow_Green: {
    l: 87.53,
    a: -8.37,
    b: 19.07,
  },
  Grayish_Yellow_Green: {
    l: 61.09,
    a: -8.36,
    b: 14.86,
  },
  Strong_Olive_Green: {
    l: 31.07,
    a: -16.67,
    b: 38.85,
  },
  Deep_Olive_Green: {
    l: 17.42,
    a: -13.02,
    b: 24.72,
  },
  Moderate_Olive_Green: {
    l: 36.75,
    a: -17.39,
    b: 30.32,
  },
  Dark_Olive_Green: {
    l: 23.64,
    a: -12.59,
    b: 11.92,
  },
  Grayish_Olive_Green: {
    l: 35.95,
    a: -6.23,
    b: 10.26,
  },
  Dark_Grayish_Olive_Green: {
    l: 21.82,
    a: -4.62,
    b: 6.21,
  },
  Vivid_Yellowish_Green: {
    l: 60.09,
    a: -53.19,
    b: 36.78,
  },
  Brilliant_Yellowish_Green: {
    l: 77.81,
    a: -41.41,
    b: 35.03,
  },
  Strong_Yellowish_Green: {
    l: 54.97,
    a: -40.54,
    b: 31.68,
  },
  Deep_Yellowish_Green: {
    l: 35.84,
    a: -38.1,
    b: 23.17,
  },
  Very_Deep_Yellowish_Green: {
    l: 16.81,
    a: -22.98,
    b: 11.64,
  },
  Very_Light_Yellowish_Green: {
    l: 86.54,
    a: -25.22,
    b: 21.49,
  },
  Light_Yellowish_Green: {
    l: 74.96,
    a: -26.36,
    b: 20.42,
  },
  Moderate_Yellowish_Green: {
    l: 56.51,
    a: -23.7,
    b: 18.21,
  },
  Dark_Yellowish_Green: {
    l: 36.13,
    a: -22.79,
    b: 15.69,
  },
  Very_Dark_Yellowish_Green: {
    l: 19.74,
    a: -17.57,
    b: 10.4,
  },
  Vivid_Green: {
    l: 49.83,
    a: -43.98,
    b: 18.21,
  },
  Brilliant_Green: {
    l: 66.12,
    a: -43.17,
    b: 12.44,
  },
  Strong_Green: {
    l: 44.8,
    a: -37.23,
    b: 9.54,
  },
  Deep_Green: {
    l: 31.06,
    a: -28.75,
    b: 7.24,
  },
  Very_Light_Green: {
    l: 78.79,
    a: -27.77,
    b: 8.68,
  },
  Light_Green: {
    l: 65.08,
    a: -27.45,
    b: 8.44,
  },
  Moderate_Green: {
    l: 45.94,
    a: -25.73,
    b: 6.61,
  },
  Dark_Green: {
    l: 29.13,
    a: -20.96,
    b: 3.95,
  },
  Very_Dark_Green: {
    l: 19.97,
    a: -12.01,
    b: 2.02,
  },
  Very_Pale_Green: {
    l: 88.75,
    a: -13.01,
    b: 3.88,
  },
  Pale_Green: {
    l: 65.09,
    a: -9.72,
    b: 2.6,
  },
  Grayish_Green: {
    l: 45.95,
    a: -8.6,
    b: 1.52,
  },
  Dark_Grayish_Green: {
    l: 30.37,
    a: -7.66,
    b: 0.17,
  },
  Blackish_Green: {
    l: 13.18,
    a: -5.23,
    b: 0.56,
  },
  Greenish_White: {
    l: 92.61,
    a: -5.54,
    b: 0.81,
  },
  Light_Greenish_Gray: {
    l: 75.84,
    a: -5.84,
    b: 3.11,
  },
  Greenish_Gray: {
    l: 56,
    a: -5.39,
    b: 1.17,
  },
  Dark_Greenish_Gray: {
    l: 36.16,
    a: -3.99,
    b: -0.05,
  },
  Greenish_Black: {
    l: 13.16,
    a: -2.79,
    b: 0.57,
  },
  Vivid_Bluish_Green: {
    l: 50.94,
    a: -32.04,
    b: -5.65,
  },
  Brilliant_Bluish_Green: {
    l: 61.11,
    a: -40.54,
    b: -0.4,
  },
  Strong_Bluish_Green: {
    l: 45.88,
    a: -29.8,
    b: -4.92,
  },
  Deep_Bluish_Green: {
    l: 25.24,
    a: -20.37,
    b: -2.44,
  },
  Very_Light_Bluish_Green: {
    l: 83.62,
    a: -25.19,
    b: -0.78,
  },
  Light_Bluish_Green: {
    l: 66.05,
    a: -24.49,
    b: -2.39,
  },
  Moderate_Bluish_Green: {
    l: 46.07,
    a: -23.33,
    b: -3.93,
  },
  Dark_Bluish_Green: {
    l: 28.15,
    a: -20.56,
    b: -4.65,
  },
  Very_Dark_Bluish_Green: {
    l: 14.49,
    a: -14.09,
    b: -3.38,
  },
  Vivid_Greenish_Blue: {
    l: 51.09,
    a: -20.07,
    b: -23.47,
  },
  Brilliant_Greenish_Blue: {
    l: 60.21,
    a: -22.51,
    b: -23.7,
  },
  Strong_Greenish_Blue: {
    l: 45.96,
    a: -18.28,
    b: -22.02,
  },
  Deep_Greenish_Blue: {
    l: 50.98,
    a: -19.7,
    b: -16.61,
  },
  Very_Light_Greenish_Blue: {
    l: 80.65,
    a: -14.5,
    b: -10.99,
  },
  Light_Greenish_Blue: {
    l: 65.91,
    a: -16.71,
    b: -15.95,
  },
  Moderate_Greenish_Blue: {
    l: 46.02,
    a: -14.25,
    b: -16.5,
  },
  Dark_Greenish_Blue: {
    l: 28.03,
    a: -13.82,
    b: -14.53,
  },
  Very_Dark_Greenish_Blue: {
    l: 16.84,
    a: -9.13,
    b: -12.43,
  },
  Vivid_Blue: {
    l: 61.12,
    a: -23.19,
    b: -26.82,
  },
  Brilliant_Blue: {
    l: 59.98,
    a: -6.3,
    b: -36.33,
  },
  Strong_Blue: {
    l: 41.87,
    a: -1.13,
    b: -40.26,
  },
  Deep_Blue: {
    l: 26.22,
    a: -1.21,
    b: -28.94,
  },
  Very_Light_Blue: {
    l: 79.71,
    a: -4.4,
    b: -23.6,
  },
  Light_Blue: {
    l: 64.96,
    a: -5.99,
    b: -26.25,
  },
  Moderate_Blue: {
    l: 44.06,
    a: -1.28,
    b: -27.21,
  },
  Dark_Blue: {
    l: 18.64,
    a: -1.99,
    b: -22.59,
  },
  Very_Pale_Blue: {
    l: 83.7,
    a: -4.27,
    b: -11.56,
  },
  Pale_Blue: {
    l: 66.02,
    a: -3.5,
    b: -8.85,
  },
  Grayish_Blue: {
    l: 42.91,
    a: -3.72,
    b: -11.5,
  },
  Dark_Grayish_Blue: {
    l: 28.39,
    a: -3.25,
    b: -7.96,
  },
  Blackish_Blue: {
    l: 15.69,
    a: -1.17,
    b: -6.38,
  },
  Bluish_White: {
    l: 92.45,
    a: 0.72,
    b: -1.95,
  },
  Light_Bluish_Gray: {
    l: 75.75,
    a: -1.99,
    b: -2.98,
  },
  Bluish_Gray: {
    l: 55.95,
    a: -1.37,
    b: -2.91,
  },
  Dark_Bluish_Gray: {
    l: 37,
    a: -1.36,
    b: -4.41,
  },
  Bluish_Black: {
    l: 13.96,
    a: -0.72,
    b: -3.28,
  },
  Vivid_Purplish_Blue: {
    l: 21.65,
    a: 30.22,
    b: -46.42,
  },
  Brilliant_Purplish_Blue: {
    l: 52.2,
    a: 11.5,
    b: -34.76,
  },
  Strong_Purplish_Blue: {
    l: 41.2,
    a: 19.32,
    b: -42.35,
  },
  Deep_Purplish_Blue: {
    l: 17.45,
    a: 17.76,
    b: -31.11,
  },
  Very_Light_Purplish_Blue: {
    l: 76.7,
    a: 4.85,
    b: -20,
  },
  Light_Purplish_Blue: {
    l: 60.93,
    a: 7.04,
    b: -25.06,
  },
  Moderate_Purplish_Blue: {
    l: 36.11,
    a: 11.3,
    b: -26.89,
  },
  Dark_Purplish_Blue: {
    l: 15.62,
    a: 8.73,
    b: -17.67,
  },
  Very_Pale_Purplish_Blue: {
    l: 80.71,
    a: 2.26,
    b: -13.33,
  },
  Pale_Purplish_Blue: {
    l: 60.88,
    a: 3.44,
    b: -14.35,
  },
  Grayish_Purplish_Blue: {
    l: 35.05,
    a: 5.13,
    b: -16.75,
  },
  Vivid_Purple: {
    l: 46.14,
    a: 46.81,
    b: -38.17,
  },
  Brilliant_Purple: {
    l: 71.11,
    a: 34.88,
    b: -30.49,
  },
  Strong_Purple: {
    l: 44.06,
    a: 30.91,
    b: -24.97,
  },
  Deep_Purple: {
    l: 28.33,
    a: 32.46,
    b: -25.79,
  },
  Very_Deep_Purple: {
    l: 17.23,
    a: 27.56,
    b: -23.18,
  },
  Very_Light_Purple: {
    l: 78.68,
    a: 15.46,
    b: -12.97,
  },
  Light_Purple: {
    l: 65.94,
    a: 20.11,
    b: -17.61,
  },
  Moderate_Purple: {
    l: 46.16,
    a: 23.89,
    b: -19.35,
  },
  Dark_Purple: {
    l: 29.37,
    a: 17.8,
    b: -14.62,
  },
  Very_Dark_Purple: {
    l: 13.06,
    a: 16.96,
    b: -13.11,
  },
  Very_Pale_Purple: {
    l: 82.78,
    a: 7.61,
    b: -7.92,
  },
  Pale_Purple: {
    l: 64.86,
    a: 9.75,
    b: -6.45,
  },
  Grayish_Purple: {
    l: 46.07,
    a: 9.82,
    b: -6.43,
  },
  Dark_Grayish_Purple: {
    l: 29.18,
    a: 9.53,
    b: -5.24,
  },
  Blackish_Purple: {
    l: 12.98,
    a: 7.82,
    b: -5.35,
  },
  Purplish_White: {
    l: 90.67,
    a: 2.05,
    b: -0.38,
  },
  Light_Purplish_Gray: {
    l: 75.73,
    a: 2.84,
    b: -1.28,
  },
  Purplish_Gray: {
    l: 56.16,
    a: 3.02,
    b: -1.35,
  },
  Dark_Purplish_Gray: {
    l: 37.08,
    a: 4.48,
    b: -2.3,
  },
  Purplish_Black: {
    l: 13.17,
    a: 2.14,
    b: -1.51,
  },
  Vivid_Reddish_Purple: {
    l: 30.43,
    a: 58.44,
    b: -27.79,
  },
  Strong_Reddish_Purple: {
    l: 45.14,
    a: 40.38,
    b: -17.05,
  },
  Deep_Reddish_Purple: {
    l: 29.24,
    a: 38.88,
    b: -19.04,
  },
  Very_Deep_Reddish_Purple: {
    l: 20.56,
    a: 34.39,
    b: -19.06,
  },
  Light_Reddish_Purple: {
    l: 61.1,
    a: 25.22,
    b: -10.78,
  },
  Moderate_Reddish_Purple: {
    l: 46.06,
    a: 27.91,
    b: -12.79,
  },
  Dark_Reddish_Purple: {
    l: 29.14,
    a: 20.62,
    b: -9.69,
  },
  Very_Dark_Reddish_Purple: {
    l: 13.01,
    a: 19.08,
    b: -10.97,
  },
  Pale_Reddish_Purple: {
    l: 60.95,
    a: 15.56,
    b: -6.01,
  },
  Grayish_Reddish_Purple: {
    l: 46.07,
    a: 16.19,
    b: -6.92,
  },
  Brilliant_Purplish_Pink: {
    l: 85.72,
    a: 21.6,
    b: 0.55,
  },
  Strong_Purplish_Pink: {
    l: 69.07,
    a: 36.67,
    b: -1.2,
  },
  Deep_Purplish_Pink: {
    l: 61.2,
    a: 48.83,
    b: -6.7,
  },
  Light_Purplish_Pink: {
    l: 80.88,
    a: 21.27,
    b: -1.36,
  },
  Moderate_Purplish_Pink: {
    l: 68.99,
    a: 26.63,
    b: -2.66,
  },
  Dark_Purplish_Pink: {
    l: 60.16,
    a: 28.6,
    b: 0.55,
  },
  Pale_Purplish_Pink: {
    l: 84.61,
    a: 11.62,
    b: -1.85,
  },
  Grayish_Purplish_Pink: {
    l: 70.9,
    a: 12.43,
    b: -1.73,
  },
  Vivid_Purplish_Red: {
    l: 50.46,
    a: 57.37,
    b: 2.56,
  },
  Strong_Purplish_Red: {
    l: 45.36,
    a: 48.73,
    b: 0.67,
  },
  Deep_Purplish_Red: {
    l: 27.13,
    a: 44.56,
    b: -5.68,
  },
  Very_Deep_Purplish_Red: {
    l: 18.65,
    a: 33.87,
    b: -8.91,
  },
  Moderate_Purplish_Red: {
    l: 46.09,
    a: 38.92,
    b: 0.3,
  },
  Dark_Purplish_Red: {
    l: 28.21,
    a: 27,
    b: -2.41,
  },
  Very_Dark_Purplish_Red: {
    l: 12.98,
    a: 20.83,
    b: -7.33,
  },
  Light_Grayish_Purplish_Red: {
    l: 59.99,
    a: 16.93,
    b: 1.79,
  },
  Grayish_Purplish_Red: {
    l: 46.05,
    a: 22.45,
    b: 0.48,
  },
  White: {
    l: 95.79,
    a: -0.15,
    b: -0.61,
  },
  Light_Gray: {
    l: 74.78,
    a: -0.2,
    b: 1.64,
  },
  Medium_Gray: {
    l: 55.09,
    a: -0.39,
    b: 1.07,
  },
  Dark_Gray: {
    l: 36.15,
    a: 0,
    b: 0,
  },
  Black: {
    l: 13.23,
    a: 0,
    b: 0,
  },
};
