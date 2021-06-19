const MODEL_URL = './js/weights'
const SIZE = { height: 512, width: 512 };
const SHARINGAN = 'https://static.wikia.nocookie.net/naruto/images/5/56/Sharingan_Triple.svg';
const LEFT_EYE = './assets/left-googly-eye.png';
const RIGHT_EYE = './assets/right-googly-eye.png';


const loadModels = async () => {
    console.log(faceapi.nets)
    console.info('Loading models');
    await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
    await faceapi.loadFaceLandmarkModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);
}

const getCenterPointAndDiameter = (pointsArray) => {
    let totalX = 0;
    let totalY = 0;
    let minX = pointsArray[0].x;
    let maxX = pointsArray[pointsArray.length - 1].x;
    for (const point of pointsArray) {
        minX = point.x < minX ? point.x : minX;
        maxX = point.x > maxX ? point.x : maxX;
        totalX += point.x;
        totalY += point.y;
    }
    const resizingFactor = 1.25;
    const diameter = (maxX - minX) * resizingFactor;
    const averageX = (totalX / pointsArray.length) - diameter / 2;
    const averageY = (totalY / pointsArray.length) - diameter / 2;
    return { averageX, averageY, diameter };
}

const googlify = async () => {
    console.log('googlifying');
    const input = document.getElementById('inputImg');
    let detections = await faceapi.detectAllFaces(input).withFaceLandmarks().withFaceDescriptors();
    detections = faceapi.resizeResults(detections, SIZE)
    console.log('detected the following faces', detections);
    for (const face of detections) {
        console.log(face);
        const leftEye = face.landmarks.getLeftEye();
        const rightEye = face.landmarks.getRightEye();
        console.log('Center of left eye:', getCenterPointAndDiameter(leftEye));
        console.log('Center of right eye:', getCenterPointAndDiameter(rightEye));
        drawEyes(getCenterPointAndDiameter(leftEye), getCenterPointAndDiameter(rightEye));
    }

}

const drawEyes = (leftEye, rightEye) => {
    const canvas = document.getElementById('outputCanvas');
    const context = canvas.getContext('2d');
    const leftEyeImg = new Image;
    leftEyeImg.onload = () => {
        context.drawImage(leftEyeImg, leftEye.averageX, leftEye.averageY, leftEye.diameter, leftEye.diameter);
    }
    const rightEyeImg = new Image;
    rightEyeImg.onload = () => {
        context.drawImage(rightEyeImg, rightEye.averageX, rightEye.averageY, rightEye.diameter, rightEye.diameter);
    }
    rightEyeImg.src = RIGHT_EYE;
    leftEyeImg.src = LEFT_EYE;
}

const updateImage = (event) => {
    const imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onloadend = function (event) {
        const newImage = event.target.result;
        const input = document.getElementById('inputImg');
        input.src = newImage;
    }


}


window.onload = function () {
    loadModels();
    const inputImage = document.getElementById('inputImg');
    inputImage.onload = () => {
        const canvas = document.getElementById('outputCanvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(inputImage, 0, 0, canvas.width, canvas.height);
    }
    const canvas = document.getElementById('outputCanvas');
    const context = canvas.getContext('2d');

    context.drawImage(inputImage, 0, 0);
};



document.getElementById('submitButton').onclick = googlify;
