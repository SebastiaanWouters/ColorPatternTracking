// https://insa.nic.in/writereaddata/UpLoadedFiles/IJHS/Vol02_2_3_RCGupta.pdf
// Approx 6 times faster than Math.sin
export function approxSin(degrees: number) {
  if (degrees > 180) {
    degrees = 360 - degrees;
    return (
      -(4 * degrees * (180 - degrees)) / (40500 - degrees * (180 - degrees))
    );
  }
  return (4 * degrees * (180 - degrees)) / (40500 - degrees * (180 - degrees));
}

// https://insa.nic.in/writereaddata/UpLoadedFiles/IJHS/Vol02_2_3_RCGupta.pdf
// Approx 6 times faster than Math.sin
export function approxCos(degrees: number) {
  if (degrees < 180) {
    degrees = 360 - degrees;
  }
  return -approxSin(degrees - 90);
}
