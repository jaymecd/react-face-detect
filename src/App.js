import React from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function App() {
  return (
    <>
      <Cam />
    </>
  );
}

const Cam = () => {
  const videoEl = React.useRef()
  const canvasEl = React.useRef()
  const [expressions, setExpressions] = React.useState([])

  React.useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      // faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      // faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      faceapi.nets.ageGenderNet.loadFromUri('/models')
    ])
    .then(() => {
      navigator.mediaDevices
        .getUserMedia({video:true})
          .then((stream) => {
            videoEl.current.srcObject = stream;
            videoEl.current.play();
          })
          .catch(console.error)
    })
    .catch(console.log)
  }, [])

  const onPlay = (event) => {
    const video = videoEl.current;
    const canvas = canvasEl.current;
    const displaySize = { width: video.width, height: video.height };

    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        // .withFaceLandmarks()
        .withAgeAndGender()
        .withFaceExpressions();

      // console.log(detections)
      canvas.getContext('2d').clearRect(0,0, canvas.width, canvas.height);

      if (!detections.length) {
        setExpressions([])
        return
      }

      setExpressions(detections.map((item) => {
        const exprs = item.expressions.asSortedArray().map(x => x.expression).slice(0,2).join('/')
        return `${exprs} - ${item.gender}/${item.age.toFixed()}`
      }))
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      faceapi.draw.drawDetections(canvas, resizedDetections);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      // faceapi.draw.drawFaceExpressions(canvas, resizedDetections, 0.8);

    }, 400)
  };

  const expressionsRender = expressions.map((expression, index) =>
    <li key={index.toString()} style={{float:'left'}}>{index}: {expression}</li>
  );

  return (
    <>
      <ul style={{position:'fixed', top:'10px', left:'10px'}}>{expressionsRender}</ul>
      <canvas ref={canvasEl} />
      <video ref={videoEl} width="480" height="360" onPlay={onPlay.bind(null)} />
    </>
  );
};


export default App;
