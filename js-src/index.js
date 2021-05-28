import Hls from "hls.js";
import _1 from "@tensorflow/tfjs-backend-cpu";
import _2 from "@tensorflow/tfjs-backend-webgl";
import * as CocoSsd from "@tensorflow-models/coco-ssd";

const pace = window.requestIdleCallback || window.requestAnimationFrame;

function getStreamUrl() {
  const default_stream = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  const params = new URLSearchParams(document.location.search.substring(1));
  return params.get("m3u8") || default_stream;
}

function createVideoStream(url) {
  const video = document.createElement("video");
  video.setAttribute("crossOrigin", "anonymous");
  if (Hls.isSupported()) {
    var hls = new Hls({
      debug: true,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => video.play());
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.setAttribute("src", url);
    video.addEventListener("canplay", () => video.play());
  }
  return new Promise((resolve) =>
    video.addEventListener("loadeddata", () => resolve(video))
  );
}

async function startDetection(video) {
  const model = await CocoSsd.load();
  let detectionCallback = null;
  const callback = async () => {
    const predictions = await model.detect(video);
    if (detectionCallback) {
      detectionCallback(predictions);
    }
    pace(callback);
  };
  return (onDetection) => {
    detectionCallback = onDetection;
    pace(callback);
  };
}

function drawPredictions(video, onDetection) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  onDetection((predictions) => {
    context.drawImage(video, 0, 0);
    console.log(predictions);
    predictions.forEach(({ bbox: [x, y, w, h], category, score }) => {
      context.beginPath();
      context.rect(x, y, w, h);
      context.stroke();
    });
  });
  return canvas;
}

async function init() {
  const video = await createVideoStream(getStreamUrl());
  const onDetection = await startDetection(video);
  const canvas = drawPredictions(video, onDetection);
  document.body.appendChild(canvas);
}

init();
