const MODEL_URL = './js/weights'
const SIZE = { height: 512, width: 512 };
const LEFT_EYE = './assets/left-googly-eye.png';
const RIGHT_EYE = './assets/right-googly-eye.png';


const loadModels = async () => {
    console.info('Loading models');
    // load models in parallel cause we have a need for speed
    await Promise.all([faceapi.loadTinyFaceDetectorModel(MODEL_URL), faceapi.loadFaceLandmarkTinyModel(MODEL_URL)])
}

var modelsLoaded = loadModels();

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
    // For the cartoony effect we want our googlified eyes to be bigger than natural eys
    const resizingFactor = 1.25;
    const diameter = (maxX - minX) * resizingFactor;
    // Adjust the center to the top left since that is the origin when drawing images to canvas
    const averageX = (totalX / pointsArray.length) - diameter / 2;
    const averageY = (totalY / pointsArray.length) - diameter / 2;
    return { averageX, averageY, diameter };
}

const googlify = async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    // We can't do any inference until our models are loaded
    await modelsLoaded;
    const input = document.getElementById('inputImg');
    const useTinyModel = true;
    let detections = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(useTinyModel);
    if (detections.length === 0) {
        alert("Sorry but we couldn't find any faces");
        loadingOverlay.style.display = 'none';
        return;
    }
    detections = faceapi.resizeResults(detections, SIZE)
    for (const face of detections) {
        const leftEye = face.landmarks.getLeftEye();
        const rightEye = face.landmarks.getRightEye();
        drawEyes(getCenterPointAndDiameter(leftEye), getCenterPointAndDiameter(rightEye));
    }
    loadingOverlay.style.display = 'none';
}

const drawEyes = (leftEye, rightEye) => {
    const canvas = document.getElementById('outputCanvas');
    const context = canvas.getContext('2d');
    // we use the onload method to ensure that we draw the eyes only when the images have loaded
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

const refreshCanvas = () => {
    const inputImage = document.getElementById('inputImg');
    const canvas = document.getElementById('outputCanvas');
    canvas.height = inputImage.height;
    canvas.width = inputImage.width;
    SIZE.height = inputImage.height;
    SIZE.width = inputImage.width;
    const context = canvas.getContext('2d');
    console.log("clearRect")
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(inputImage, 0, 0, canvas.width, canvas.height);
}
window.onload = () => {
    const inputImage = document.getElementById('inputImg');
    inputImage.onload = () => {
        refreshCanvas();
    }
    refreshCanvas();
    document.getElementById('submitButton').onclick = googlify;
};
