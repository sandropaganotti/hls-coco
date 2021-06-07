import Hls from "hls.js";
import _1 from "@tensorflow/tfjs-backend-cpu";
import _2 from "@tensorflow/tfjs-backend-webgl";
import * as CocoSsd from "@tensorflow-models/coco-ssd";

const pace = window.requestIdleCallback || window.requestAnimationFrame;

function getStreamUrl() {
  const default_stream = "https://test-streams.mux.dev/test_001/stream.m3u8";
  const params = new URLSearchParams(document.location.search.substring(1));
  return params.get("m3u8") || default_stream;
}

function getClasses() {
  const default_classes = "person";
  const params = new URLSearchParams(document.location.search.substring(1));
  return (params.get("classes") || default_classes).split(",");
}

function createVideoStream(video, url) {
  video.setAttribute("crossOrigin", "anonymous");
  if (Hls.isSupported()) {
    var hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => video.play());
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.setAttribute("src", url);
    video.addEventListener("canplay", () => video.play());
  }
  return new Promise((resolve) =>
    video.addEventListener("loadeddata", () => {
      video.setAttribute("hidden", "hidden");
      resolve(video);
    })
  );
}

async function startDetection(model, video) {
  let detectionCallback = null;
  const callback = async () => {
    let predictions = [];
    try {
      predictions = await model.detect(video);
    } catch (error) {
      pace(callback);
    }
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
  const categories = getClasses();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  onDetection((predictions) => {
    context.drawImage(video, 0, 0);
    predictions.forEach(({ bbox: [x, y, w, h], class: category, score }) => {
      if (score > 0.5 && categories.includes(category)) {
        context.beginPath();
        context.rect(x, y, w, h);
        context.stroke();
      }
    });
  });
  return canvas;
}

function setLoadingContent(loading, text) {
  loading.textContent = text;
}

async function init() {
  const loadingNode = document.getElementById("loading");
  const videoNode = document.getElementById("video");
  setLoadingContent(loadingNode, "Loading Model...");
  const model = await CocoSsd.load();
  setLoadingContent(loadingNode, "Creating Video Stream...");
  const video = await createVideoStream(videoNode, getStreamUrl());
  setLoadingContent(loadingNode, "Starting Detection...");
  const onDetection = await startDetection(model, video);
  loadingNode.classList.add("hidden");
  const canvas = drawPredictions(video, onDetection);
  videoNode.parentNode.appendChild(canvas);
}

init();
