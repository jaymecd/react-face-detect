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
  const [faces, setFaces] = React.useState([])

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
    
    setInterval(async () => {
      // const dimensions = faceapi.matchDimensions(canvas, video, true)
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions(125))
        // .withFaceLandmarks()
        .withAgeAndGender()
        .withFaceExpressions();

      // console.log(detections)
      canvas.getContext('2d').clearRect(0,0, canvas.width, canvas.height);
      
      setExpressions(detections.map((item) => {
        const exprs = item.expressions.asSortedArray().map(x => x.expression).slice(0,2).join('/')
        return `${exprs} - ${item.gender}/${item.age.toFixed()}`
      }))

      // const resizedDetections = faceapi.resizeResults(detections, dimensions);

      const faceImages = await faceapi.extractFaces(video, detections.map(res => res.detection));

      setFaces(faceImages.map((face) => face.toDataURL()))
      
      
      
      // faceapi.draw.drawDetections(canvas, resizedDetections);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      // faceapi.draw.drawFaceExpressions(canvas, resizedDetections, 0.8);

    }, 500)
  };

  const expressionsRender = expressions.map((expression, index) =>
    <li key={index.toString()}>
      {index}: {expression}<br />
      <img src={faces[index]} alt={expression} width="160" />
    </li>
  );

  return (
    <>
      <ul style={{position:'fixed', top:'10px', left:'10px', width: '280px'}}>{expressionsRender}</ul>
      <canvas ref={canvasEl} />
      <video ref={videoEl} width="480" height="360" onPlay={onPlay.bind(null)} />
    </>
  );
};


export default App;
