const changeSize = (target: number, ratio: number) => {
  return Math.floor(target * (10 * ratio)) / 10;
};

export default changeSize;
