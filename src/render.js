const { desktopCapturer, remote } = require('electron');
const { Menu, dialog } = remote;
const { writeFile } = require('fs');

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

stopBtn.onclick = e => {
    mediaRecorder.stop();
}

startBtn.onclick = e => {
    mediaRecorder.start();
}

videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
}

let mediaRecorder;
const recordedChunks = [];

async function selectSource(source) {
    
    videoSelectBtn.innerText = source.name;

    const contraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(contraints);

    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;


}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log('successful save!'));
}