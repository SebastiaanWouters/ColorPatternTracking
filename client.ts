import io from "socket.io-client";
import p5 from "p5";

const socket = io("https://penocw03.student.cs.kuleuven.be");

socket.on("connect", () => {
  console.log("CONNECTED");
  socket.emit("send-corner-size", {
    cornerBoxSize: innerWidth / 10,
    innerWidth,
    innerHeight,
  });
});

socket.on("display-white", () => {
  document.getElementsByTagName("body")[0].style.backgroundColor = "white";
});

socket.on("display-black", () => {
  document.getElementsByTagName("body")[0].style.backgroundColor =
    "rgb(0, 75, 75)";
  window.setTimeout(() => {
    socket.emit("notify-black");
  }, 1000);
});

socket.on("display-animation", () => {
  console.log("New animation");
  document.getElementsByTagName("body")[0].style.backgroundColor =
    "rgb(0, 0, 150)";
  let width = window.innerHeight / 2;
  let height = window.innerHeight;
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;
  let x1 = screenWidth / 2 - width / 2;
  let y1 = 0;
  // let x2 = screenWidth / 2 - width / 2;
  let x2 = -width;
  let y2 = 0;
  let eenheidsvector = 1;
  let distancePerFrame = 15;

  let countdownSketch = (p: p5) => {
    p.setup = () => {
      const fps = 30;
      p.frameRate(fps);
      const p5Canvas = p.createCanvas(window.innerWidth, window.innerHeight);
      p5Canvas.id("dagbram");
    };

    p.draw = () => {
      p.clear();
      p.fill(255, 255, 255);
      p.noStroke();
      p.rect(x1, y1, width, height);
      p.fill(255, 255, 255);
      p.noStroke();
      p.rect(x2, y2, width, height);
      x1 += distancePerFrame * eenheidsvector;
      x2 += distancePerFrame * eenheidsvector;
      if (x1 > screenWidth || x1 < width) {
        eenheidsvector *= -1;
      }
      if (x1 < window.innerWidth / 2 - width / 2) {
        p.noLoop();
        socket.emit("notify-animation-end");
      }
    };
  };
  new p5(countdownSketch);
});
