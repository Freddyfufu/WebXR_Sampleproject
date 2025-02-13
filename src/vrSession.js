// Beispielanwendung WebXR im Rahmen der Bachelorarbeit von Freddy Oexemann

import {MyXRButton} from "./MyXRButton.js";
import {renderer, scene, camera} from './scene.js';
import {controller1, controller2, controllerGrip1, controllerGrip2, setupControllers} from './controllers.js';
import * as ThreeMeshUI from "three-mesh-ui";
import * as THREE from "three";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import {interactableObjects, moveableObjects} from "./models";
import {io} from 'socket.io-client';
import {highlightShaderMaterial, shaderHighlightActiveQuiz} from "./shaders";
import {camera_y_offset} from "./global_config";
import fontFamily from "../assets/three-mesh-ui/assets/Roboto-msdf.json";
import fontTexture from "../assets/three-mesh-ui/assets/Roboto-msdf.png";
import {colors} from "./global_config";
import {loadHighResHelmet, loadGoat} from "./models";
import {FPSLogger} from "./fpsLogger";
import {ipv4} from "./global_config";

export let socket, mysession, referenceSpace, dolly, isVideoPlaying = false,
    playButtonMaterial, video, playTexture, playButtonGeometry, videoMesh, videoTexture, playButtonMesh, videoMaterial,
    videoGeometry;
let mixer;


let otherPlayers = {};
let isLongPress = false;
let pressTimer = null;
const fbxLoader = new FBXLoader();
const server_port = 3000;
let raycaster = new THREE.Raycaster();
let highlightRaycaster = new THREE.Raycaster();
const tempMatrixHighlight = new THREE.Matrix4();
let currentHighlightMesh = null;
let currentHighlightGroup = null;
let isARAvailable = false;
let isVRAvailable = false;
let current_question = null;
let question_container = null;
let character_url = 'assets/Idle.fbx';
const sessionOptions = {
    requiredFeatures: ['local'],
    optionalFeatures: [
        'hand-tracking',
    ],
};
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let moveableObject = null;
let isMobile = false;
let text_fps = new ThreeMeshUI.Text({
    content: "FPS: " + fps,
});
let panel_fps = new ThreeMeshUI.Block({
    width: 1.2,
    height: 0.7,
    padding: 0.2,
    fontFamily: fontFamily,
    fontTexture: fontTexture,
    backgroundColor: new THREE.Color(0xFF0000),
});
panel_fps.position.set(12, 3, -7);
panel_fps.add(text_fps);


function calculateFPS() {
    let now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) { // Alle 1000 ms aktualisieren
        fps = frameCount;
        frameCount = 0;
        lastTime = now;
        // console.log(`FPS: ${fps}`);
        initFPSText(fps);
        try {
            ThreeMeshUI.update();
        } catch (e) {
            console.log();
        }
    }
}


function initFPSText(fps) {
    panel_fps.remove(text_fps);
    text_fps = new ThreeMeshUI.Text({
        content: "FPS: " + fps,
        fontSize: 0.15,
    });
    panel_fps.add(text_fps);
}

function resetQuestionContainer() {
    try {
        if (question_container) {
            question_container.children.forEach((child) => {
                question_container.remove(child);
            });
            scene.remove(question_container);

            scene.remove(question_container.soundSource);
        }

        question_container = new ThreeMeshUI.Block({
            width: 2.5,
            height: 1.4,
            padding: 0.1,
            fontFamily: './assets/fonts/Roboto-msdf.json',
            fontTexture: './assets/fonts/Roboto-msdf.png',
            backgroundColor: new THREE.Color(colors.panelBack),
        });
        question_container.name = 'question_container';
        question_container.position.set(8, 3, -7); // Set the container's world position
        question_container.selectedOption = null;
        scene.add(question_container);


        ThreeMeshUI.update();
        renderer.renderLists.dispose();


        // Create the sound source
        const soundSource = new THREE.Object3D();
        question_container.add(soundSource);

        // Add the question container to the scene
        scene.add(question_container);

        // Update world position of the sound source after adding to the scene
        const worldPos = new THREE.Vector3();
        soundSource.getWorldPosition(worldPos);

        console.log('Sound source local position:', soundSource.position);
        console.log('Sound source world position:', worldPos);

        // Store sound source in the container
        question_container.soundSource = soundSource;
    } catch (e) {
        console.log(e);
    }
}

function updateArms() {
    try {
        if (dolly.leftArm && dolly.rightArm) {
            if (controller1) {
                if (dolly.leftArm) {
                    dolly.leftArm.quaternion.copy(controller1.quaternion);
                }
            }
            if (controller2) {
                if (dolly.rightArm) {
                    dolly.rightArm.quaternion.copy(controller2.quaternion);
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
}

window.addEventListener('blur', () => {
    console.log('Window lost focus');
});

let loadMeshButton = null;
let panel_model = null;

const fpsLogger = new FPSLogger();

const loggers = []
// Funktion an die ein Callback gebunden wird und ein Logging inittiert wird zur Messung
let leaveSessionButton = null;
let panel_exit = null;

function startProcedure(callback, title = null, seconds = 10) {
    let newLogger = new FPSLogger(title);
    loggers.push(newLogger);
    newLogger.startLogging();
    console.log('Start procedure');
    // callback();
    setTimeout(() => socket.emit("send_log", newLogger.getData()), seconds * 1000);
    setTimeout(() => loggers.pop(), seconds * 1000);
}

function initLoadMesh() {
    loadMeshButton = new ThreeMeshUI.Text({
        content: "Lade hochauflösendes Modell",
        fontSize: 0.1,
        width: 2.4,
        padding: 1,
        backgroundColor: new THREE.Color(0x000000),
    });
    panel_model = new ThreeMeshUI.Block({
        width: 1.2,
        height: 0.7,
        padding: 0.2,
        fontFamily: fontFamily,
        fontTexture: fontTexture,
        backgroundColor: new THREE.Color(0x000000),
    });
    panel_model.position.set(14, 3, -7);
    panel_model.add(loadMeshButton);
    scene.add(panel_model);
}

function initExitButton() {
    leaveSessionButton = new ThreeMeshUI.Text({
        content: "Verlasse Sitzung",
        fontSize: 0.1,
        width: 2.4,
        padding: 1,
        backgroundColor: new THREE.Color(0x000000),
    });
    panel_exit = new ThreeMeshUI.Block({
        width: 1.2,
        height: 0.7,
        padding: 0.2,
        fontFamily: fontFamily,
        fontTexture: fontTexture,
        backgroundColor: new THREE.Color(0x000000),
    });
    panel_exit.position.set(10, 3, -7);
    panel_exit.add(leaveSessionButton);
    scene.add(panel_exit);
}

function onSessionStart(session) {
    console.log('Session started onSessionStart');
    fpsLogger.startLogging();
    // startProcedure(() => console.log("Dummy function"), "Anwendung laden", 15);

    mysession = session;
    console.log('Session started');
    setupControllers(scene, renderer);
    initLoadMesh();
    initExitButton();
    isMobile = isMobileByScreenSize();
    scene.add(panel_fps);
    dolly = new THREE.Group();
    const cameraHolder = new THREE.Group();
    cameraHolder.position.set(0, camera_y_offset, 0); // Setze die Kamera-Höhe relativ zum Dolly
    cameraHolder.add(camera); // Füge die Kamera in den Container ein


    dolly.add(controller1);
    dolly.add(controller2);
    dolly.add(cameraHolder); // Füge die Kamera hinzu
    dolly.add(controllerGrip1);
    dolly.add(controllerGrip2);
    // lade eigenen Avatar
    (async () => {
        await spawnCharacterAt(socket.id, {x: 8, y: 2, z: 0}, true);
        renderer.setAnimationLoop(render); // Wird nur aufgerufen, nachdem das Modell geladen wurde
    })();

    socket.emit('player_added', {dolly: dolly});

    scene.background = new THREE.Color(0x808080);
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    createCinemaScreen();


    const colliderGeometry = new THREE.PlaneGeometry(100, 100);
    const colliderMaterial = new THREE.MeshBasicMaterial({visible: false}); // Unsichtbares Material
    const groundCollider = new THREE.Mesh(colliderGeometry, colliderMaterial);

    groundCollider.rotation.x = -Math.PI / 2; // Liegt flach auf dem Boden
    scene.add(groundCollider);

    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller2.matrixWorld);
    highlightRaycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
    highlightRaycaster.ray.direction.set(0, camera_y_offset, -1).applyMatrix4(tempMatrix);


    // Rufe regelmäßig `sendPlayerPosition` auf, um die eigene Position zu senden
    setInterval(sendCharacterState, 20);
    setInterval(highlightRay, 100);

}

function createCinemaScreen() {
    let cinemaScreenGroup = new THREE.Group();
    // Create a video element
    video = document.createElement('video');
    video.loop = true;
    video.src = '/assets/media/video/sample.mp4';
    video.crossOrigin = 'anonymous';
    video.muted = false;
    video.playsInline = true;
    video.load();
    video.name = 'video';
    video.addEventListener('loadeddata', () => {
        let aspect = video.videoWidth / video.videoHeight;
        if (aspect < 2.0) {
            videoMesh.scale.set(aspect * 1.1, 2.1, 1.0);
        } else {
            videoMesh.scale.set(2.1, 2.1 / aspect, 1.0);
        }
    });

    // Create a texture from the video
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    // Create a play button texture
    playTexture = new THREE.TextureLoader().load('/assets/media/textures/play-button.png');

// Create a plane for the play button
    playButtonGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    playButtonMaterial = new THREE.MeshBasicMaterial({
        map: playTexture,
        transparent: true,
    });
    playButtonMesh = new THREE.Mesh(playButtonGeometry, playButtonMaterial);
    playButtonMesh.name = 'playButton';

// Position and scale the play button

    // Create a material for the video plane
    videoMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
        side: THREE.FrontSide,
    });
    videoMaterial.name = 'videoMaterial';

// Create a plane geometry for the video screen
    videoGeometry = new THREE.PlaneGeometry(2.1, 1.1);
    videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    videoMesh.name = 'videoMesh';
    cinemaScreenGroup.add(videoMesh);

// Position the video mesh
    let videoMeshPosition = new THREE.Vector3(15.2, 2, -1);
    let rotation = new THREE.Euler(0, -1.6, 0, 'XYZ');
    videoMesh.position.set(videoMeshPosition.x, videoMeshPosition.y, videoMeshPosition.z);
    videoMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    playButtonMesh.position.set(videoMeshPosition.x - 0.1, videoMeshPosition.y, videoMeshPosition.z);
    playButtonMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    cinemaScreenGroup.add(playButtonMesh);
    scene.add(cinemaScreenGroup);
}

export function onSessionEnd() {
    console.log('Session ended');
    // cleanup
    renderer.xr.setSession(null); // Detach the session
    document.body.classList.remove('xr-active');
    // remove all player models
    for (let player in otherPlayers) {
        scene.remove(otherPlayers[player]);
    }
    // remove self
    scene.remove(dolly);
    otherPlayers = {};
    mysession = null;


}

let inputTimestamp; // Zur Messung der Eingabelatenz
export function onSelectStart(event) {
    inputTimestamp = performance.now();
    pressTimer = setTimeout(() => {
        isLongPress = true;
    }, 1000); // 1 Sekunde für langes Drücken
}

function onSelectEnd(event) {
    clearTimeout(pressTimer);

    if (isLongPress) {
        // Langes Drücken: Markierung (rechts), Gegenstand bewegen (links)
        if (event.inputSource === controller2.userData.inputSource) {
            // rechts, lange drücken (Markierung)
        } else if (event.inputSource === controller1.userData.inputSource) {// links, lange drücken (Gegenstand bewegen)
            induceControllerRay(controller1, true);
            console.log('Long press links');
        }
        console.log('Long press');
    } else { // Kurzes Drücken: Verschiedene Aktionen (links), teleportieren (rechts)
        if (event.inputSource === controller1.userData.inputSource) { // links, kurzes drücken
            induceControllerRay(controller1);
            if (isMobile) {
                console.log('Mobile device right');
            }
        } else if (event.inputSource === controller2.userData.inputSource) { // rechts, kurzes drücken (teleportieren)
            teleport(controller2);
            console.log('Rechts kurz gedrückt');
        }

    }

    isLongPress = false; // Zurücksetzen
}


function playAudioAt(soundSource, audioFile) {
    // Create an AudioListener and attach it to the camera
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // Create the PositionalAudio object
    const sound = new THREE.PositionalAudio(listener);

    // Add the PositionalAudio to the sound source
    soundSource.add(sound);

    // Debugging: Log the sound source world position
    const worldPos = new THREE.Vector3();
    soundSource.getWorldPosition(worldPos);
    console.log('Playing audio at (world position):', worldPos);
    console.log("Camera position:", camera.position);

    // Load and play the audio
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(audioFile, function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(2);// Distance at which the volume starts decreasing
        sound.setVolume(4);
        sound.play();
    });
}

resetQuestionContainer();

function teleport(controller) {
    if (!controller) {
        console.error('Controller ist nicht definiert');
        return;
    }
    const line = controller.getObjectByName('ray');
    if (!line) {
        console.error('Ray ist nicht definiert');
        return;
    }
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, camera_y_offset, -1).applyMatrix4(tempMatrix);
    // Prüfe auf Treffer
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        line.material.color.set(0xffff00); // Strahl färben
        for (let i = 0; i < intersects.length; i++) {
            // FIXME: szenen mesh baken und nur danach prüfen
            if (intersects[i].object.name === "MyGround" || intersects[i].object.name === "hall") { // Wenn der Boden getroffen wurde ...
                let point = intersects[i].point;
                point.y += 2;
                dolly.position.copy(point);
                dolly.updateMatrixWorld(true);
            }
        }
    } else {
        line.material.color.set(0x00ff00); // Strahl färben
    }
}

function highLightQuizObject(name) {
    interactableObjects.map((x) => x).map((child) => {
        if (child.name.toLowerCase() === name) {
            const boundingBox = new THREE.Box3().setFromObject(child);
            const boxSize = new THREE.Vector3();
            boundingBox.getSize(boxSize); // Größe der BoundingBox
            const boxCenter = new THREE.Vector3();
            boundingBox.getCenter(boxCenter); // Zentrum der BoundingBox
            const highlightGeometry = new THREE.SphereGeometry(boxSize.length() / 2.5, 32, 32);
            const highlight = new THREE.Mesh(highlightGeometry, shaderHighlightActiveQuiz);

            highlight.position.copy(boxCenter)
            highlight.renderOrder = 1; // So wird Text immer sichtbar
            scene.add(highlight);
            setInterval(() => {
                scene.remove(highlight);
            }, 10000);
            return child;
        }
    });


}

function startQuiz(data) {
    resetQuestionContainer();
    playAudioAt(question_container.soundSource, './assets/media/sound/quiz_bell.mp3');
    let counter = 10;
    highLightQuizObject(data.name);
    const timer = setInterval(() => {
        if (counter > 0) {
            console.log('Time remaining:', counter);
            counter--;
        } else {
            clearInterval(timer);
        }
    }, 1000);
    console.log('Quiz started:', data);
    const questionText = data.question;
    const options = data.options;
    current_question = new ThreeMeshUI.Text({
        content: questionText,
        fontSize: 0.2,
        width: 2.4,
        padding: 1,
        backgroundColor: new THREE.Color(0x000000),
    });
    current_question.position.set(0, 0.8, 0);
    question_container.add(current_question);
    options.forEach((option, index) => {
        const optionButton = new ThreeMeshUI.Block({
            width: 2,
            height: 0.3,
            padding: 0.1,
            fontFamily: './assets/fonts/Roboto-msdf.json',
            fontTexture: './assets/fonts/Roboto-msdf.png',
            backgroundColor: new THREE.Color(colors.button),
            borderRadius: 0.1,
        });
        const optionText = new ThreeMeshUI.Text({
            content: option,
            fontSize: 0.1,
        });
        optionButton.add(optionText);
        optionButton.name = 'option' + (index + 1);
        optionButton.state = 'idle';
        question_container.add(optionButton);
    });
}

function showAnimationFromPlayer(player_id, isCorrect) {
    let player_dolly;
    if (player_id !== socket.id) {
        player_dolly = otherPlayers[player_id];
    } else if (player_id === socket.id) {
        player_dolly = dolly;
    } else {
        console.error('No player found');
        return;
    }
    if (!player_dolly) {
        resetQuestionContainer();
        return;
    }
    let color;
    switch (isCorrect) {
        case true:
            color = colors.correct;
            break;
        case false:
            color = colors.wrong;
            break;
    }
    const animationEffect = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 0.8})
    );

    // destroy after 3 seconds
    setTimeout(() => {
        player_dolly.remove(animationEffect);
    }, 3000);
    player_dolly.add(animationEffect);
    animationEffect.position.set(0, 1, 0);
    resetQuestionContainer();

}

let btnDict;

export function initXR() {
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr')
            .then((supported) => {
                isVRAvailable = supported;
                if (supported) {
                    console.log('VR wird unterstützt')
                    const btnDict = MyXRButton.createButton(renderer, "immersive-vr", "VR", sessionOptions, onSelectStart, onSelectEnd, onSessionStart, onSessionEnd);
                    document.body.appendChild(btnDict.button);
                    referenceSpace = btnDict.referenceSpace;
                } else {
                    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                        if (supported) {
                            console.log('AR wird unterstützt');
                            isARAvailable = supported;
                            const btnDict = MyXRButton.createButton(renderer, "immersive-ar", "AR", sessionOptions, onSelectStart, onSelectEnd, onSessionStart, onSessionEnd);
                            document.body.appendChild(btnDict.button);
                            referenceSpace = btnDict.referenceSpace;
                        } else {
                            console.log('Weder AR noch VR wird unterstützt');
                            navigator.xr.isSessionSupported('inline').then((supported) => {
                                if (supported) {
                                    console.log('Inline wird unterstützt');
                                    isARAvailable = supported;
                                    btnDict = MyXRButton.createButton(renderer, "inline", "Inline", sessionOptions, onSelectStart, onSelectEnd, onSessionStart, onSessionEnd);
                                    document.body.appendChild(btnDict.button);
                                    referenceSpace = btnDict.referenceSpace;
                                    console.log('Inline wird unterstützt');
                                }
                            })
                        }
                    });
                }
            });


    }
    socket = io.connect('https://' + ipv4 + ':' + server_port, {
        secure: true,
        transports: ['websocket'],
        rejectUnauthorized: false
    });
    socket.on("init_moveable_object", (data) => {
        moveableObject = data;
        loadGoat(moveableObject.moveableObjectPos, moveableObject.moveableObjectScale, moveableObject.moveableObjectRot);
        console.log('Moveable object loaded:', moveableObject);
    });
    socket.on('update_moveable_object', (data) => {
        console.log('Moveable object updated CLIENTSIDE:', data);
        let moveableObjectMesh = moveableObjects[0];
        moveableObjectMesh.position.set(data.moveableObjectPos[0], data.moveableObjectPos[1], data.moveableObjectPos[2]);
    });
    socket.on('connect', () => {
        console.log('Verbunden mit dem WebSocket-Server!');
    });
    socket.on("start_quiz", (data) => {
        startQuiz(data);
    });
    socket.on("end_quiz", () => {
        // get last char of question_container.selectedOption.name
        let option = null;
        if (question_container.selectedOption) {
            option = parseInt(question_container.selectedOption.name.charAt(question_container.selectedOption.name.length - 1));
        }
        socket.emit('quiz_answer', {id: socket.id, option: option});
    });
    socket.on('eval_answer', (player_id, isCorrect) => {
        showAnimationFromPlayer(player_id, isCorrect);
    });
    socket.on('add_player', (new_player, all_players) => {
        if (new_player.id === socket.id) return;
        console.log('Other players:', otherPlayers);

        // Erstelle einen neuen Avatar für den Spieler
        const otherPlayerGroup = new THREE.Group();
        let player_dolly = all_players.find(player => player.id === socket.id);
        // Lade das FBX-Modell für den Spieler
        if (!player_dolly) {
            console.error('Player not found');
            return;
        }
        spawnCharacterAt(new_player, {x: 0, y: 0, z: 0});
        // Speichere die Gruppe im `otherPlayers`-Objekt
    });
    socket.on("update_character", (data) => {
        if (otherPlayers[data.id] && data.id !== socket.id) {
            otherPlayers[data.id].position.copy(data.state.position);
            otherPlayers[data.id].rotation.set(data.state.rotation.x, data.state.rotation.y, data.state.rotation.z);
            otherPlayers[data.id].currentAnimationName = data.state.animation;
            try {
                if (data.state.arms.leftArm) {
                    otherPlayers[data.id].leftArm.rotation.fromArray(data.state.arms.leftArm);
                }
                if (data.state.arms.rightArm) {
                    otherPlayers[data.id].rightArm.rotation.fromArray(data.state.arms.rightArm);
                }
            } catch (e) {
                console.log(e);
            }


        }
    });
    socket.on("remove_player", (socket_id) => {
        scene.remove(otherPlayers[socket_id]);
        delete otherPlayers[socket_id];
        console.log('Removed player:', socket_id);
    });
    socket.on('player_joined', (players) => {
        console.log('initialize_players:', players);
        players.forEach(player => {
            if (player.id === socket.id) return;
            spawnCharacterAt(player, {x: 0, y: 0, z: 0});
        });
    });


}

async function spawnCharacterAt(player, position, isSelf = false) {
    let currentGroup;
    if (isSelf) {
        currentGroup = dolly;
    } else {
        currentGroup = new THREE.Group();
    }

    // Wrap fbxLoader.load in a Promise
    await new Promise((resolve, reject) => {
        fbxLoader.load(
            character_url,
            (object) => {
                object.scale.set(0.01, 0.01, 0.01);
                object.rotation.set(0, Math.PI, 0);
                object.position.set(0, -1.6, 0);

                let arms = findArms(object);
                let leftArmBone = arms.leftArm;
                let rightArmBone = arms.rightArm;
                currentGroup.leftArm = leftArmBone;
                currentGroup.rightArm = rightArmBone;

                if (isSelf) {
                    object.visible = false;
                    mixer = new THREE.AnimationMixer(object);
                    const action = mixer.clipAction(object.animations[0]);
                    action.play();
                }

                currentGroup.add(object);
                currentGroup.position.set(position.x, position.y, position.z);
                scene.add(currentGroup);

                if (!isSelf) otherPlayers[player.id] = currentGroup;

                resolve(true); // Resolve the Promise when loading is complete
            },
            undefined,
            (error) => {
                console.error('Error loading FBX model:', error);
                reject(error); // Reject the Promise on error
            }
        );
    });
}

function findArms(object) {
    const armBones = {
        leftArm: null,
        rightArm: null,
    };

    object.traverse((child) => {
        if (child.isBone) {
            // if includes leftarm or rightarm
            if (child.name.toLowerCase().includes('leftarm')) {
                armBones.leftArm = child;
                console.log('Left arm:', child);
            }
            if (child.name.toLowerCase().includes('rightarm')) {
                armBones.rightArm = child;
            }
        }
    });
    return armBones;
}

function handleHighlightedObject(currentObject) {
    // Berechne die BoundingBox des Objekts
    const boundingBox = new THREE.Box3().setFromObject(currentObject);
    const boxSize = new THREE.Vector3();
    boundingBox.getSize(boxSize); // Größe der BoundingBox
    const boxCenter = new THREE.Vector3();
    boundingBox.getCenter(boxCenter); // Zentrum der BoundingBox
    // Erstelle die Highlight-Geometrie basierend auf der BoundingBox
    const highlightGeometry = new THREE.SphereGeometry(boxSize.length() / 2, 32, 32);
    currentHighlightMesh = new THREE.Mesh(highlightGeometry, highlightShaderMaterial);
    currentHighlightMesh.position.copy(boxCenter)
    currentHighlightMesh.renderOrder = 1; // So wird Text immer sichtbar
    currentHighlightGroup = new THREE.Group();
    currentHighlightGroup.currentObject = currentObject.name;
    currentHighlightGroup.add(currentHighlightMesh);
    let myText = currentObject.myText;
    // Berechne die BoundingBox des Textes
    const textBoundingBox = new THREE.Box3().setFromObject(myText);
    const textSize = new THREE.Vector3();
    textBoundingBox.getSize(textSize); // Größe des Textes
    myText.position.set(
        boxCenter.x - textSize.x / 2, // Horizontal zentrieren
        boxCenter.y + boxSize.y / 2 + 0.5, // Oberhalb des Objekts platzieren
        boxCenter.z
    );
    const cameraWorldPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraWorldPosition); // Kamera-Weltposition

    const textWorldPosition = new THREE.Vector3();
    myText.getWorldPosition(textWorldPosition); // Text-Weltposition

    const direction = new THREE.Vector3().subVectors(cameraWorldPosition, textWorldPosition);

    direction.y = 0;
    direction.normalize();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), // Standard-Richtungsvektor
        direction
    );

    myText.quaternion.copy(quaternion); // Setze die Rotation des Textes in Richtung der Kamera

    currentHighlightGroup.add(myText);
    scene.add(currentHighlightGroup);
}


function highlightRay() {
    tempMatrixHighlight.identity().extractRotation(controller1.matrixWorld);
    highlightRaycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    highlightRaycaster.ray.direction.set(0, camera_y_offset, -1).applyMatrix4(tempMatrixHighlight);
    let proxyObjects = interactableObjects.map((x) => x);
    if (question_container) {
        proxyObjects = interactableObjects.concat(question_container);
    }
    let intersects = highlightRaycaster.intersectObjects(proxyObjects, true);
    let btn_hovered = false;
    if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
            const intersectedObject = intersects[i].object;
            // Traverse parents to check if any has the name "Lambo"
            let currentObject = intersectedObject;

            while (currentObject) {
                if (!currentHighlightGroup) {
                    if (currentObject.name === "lambo" || currentObject.name === "helmet" || currentObject.name === "submarine") {
                        handleHighlightedObject(currentObject);
                        return;
                    }
                    if (currentObject.name === "moveableObject") {
                        console.log('Moveable object hovered');
                        return;
                    }
                }

                // handle quizboard options
                if (currentObject.name.startsWith('option')) {
                    button_hover(currentObject);
                    btn_hovered = true;
                    // console.log('Option getroffen:', currentObject.name);
                    return;
                } else {
                    button_hover(null);
                }
                currentObject = currentObject.parent;
                if (!btn_hovered) {
                    button_hover(null);
                }
            }
        }
    } else {
        scene.remove(currentHighlightMesh);
        scene.remove(currentHighlightGroup);
        button_hover(null);
        currentHighlightGroup = null;
    }
}

function button_hover(currentObject) {
    if (!currentObject) {
        question_container.children.forEach((child) => {
            if (child.name.startsWith("option") && child.state !== 'selected') {
                child.set({backgroundColor: new THREE.Color(colors.button)});
                child.state = 'idle';
            }
        });
        return;
    }
    if (currentObject.state !== 'selected') {
        currentObject.set({backgroundColor: new THREE.Color(colors.hovered)});
        currentObject.state = 'hovered';
    }
    question_container.children.forEach((child) => {
        if (child.name.startsWith("option") && child.name !== currentObject.name && child.state !== 'selected') {
            child.set({backgroundColor: new THREE.Color(colors.button)});
            child.state = 'idle';
        }
    });
}

function render(time) {
    if (inputTimestamp) {
        console.log('Eingabelatenz messen', inputTimestamp, " | ", performance.now());
        let latency = performance.now() - inputTimestamp;
        console.log(`Eingabelatenz: ${latency} ms`);

        console.log(`Eingabelatenz: ${latency.toFixed(9)} ms`);
        inputTimestamp = null; // Zurücksetzen nach Messung
    }
    loggers.forEach((logger) => {
        logger.updateFPS();
    });
    if (mixer) mixer.update(0.016); // 16ms für eine 60FPS-Rate
    updateArms(dolly.leftArm, dolly.rightArm);
    moveCharacter();
    sendCharacterState();
    calculateFPS();
    ThreeMeshUI.update();
    renderer.xr.updateCamera(camera);
    renderer.render(scene, camera);
}

function isMobileByScreenSize() {
    return window.innerWidth <= 800 && window.innerHeight <= 1200;
}

function moveCharacter() {
    try {
        let thumpstick_axes1 = controller1.userData.inputSource.gamepad.axes;
        let thumpstick_axes2 = controller2.userData.inputSource.gamepad.axes;
        if (thumpstick_axes1[3] > 0.5) {
            dolly.translateZ(0.1);
        }
        if (thumpstick_axes1[3] < -0.5) {
            dolly.translateZ(-0.1);
        }
        if (thumpstick_axes1[2] > 0.5) {
            dolly.rotateY(-0.05);
        }
        if (thumpstick_axes1[2] < -0.5) {
            dolly.rotateY(0.05);
        }
        if (thumpstick_axes1[1] > 0.5) {
            dolly.translateX(-0.1);
        }
        if (thumpstick_axes1[1] < -0.5) {
            dolly.translateX(0.1);
        }

        if (thumpstick_axes2[2] > 0.5) {
            dolly.rotateY(-0.05);
        }
        if (thumpstick_axes2[2] < -0.5) {
            dolly.rotateY(0.05);
        }
    } catch (e) {
        console.log("");
    }
}


function induceControllerRay(controller, isMoveableObject = false) {
    if (currentHighlightGroup) {
        switch (currentHighlightGroup.currentObject) {
            case "lambo":
                console.log("Requesting quiz for lambo");
                socket.emit('request_quiz', {player_id: socket.id, exponat: currentHighlightGroup.currentObject});
                break;
            case "helmet":
                console.log("Requesting quiz for helmet");
                socket.emit('request_quiz', {player_id: socket.id, exponat: currentHighlightGroup.currentObject});
                break;
            case "submarine":
                console.log("Requesting quiz for submarine");
                socket.emit('request_quiz', {player_id: socket.id, exponat: currentHighlightGroup.currentObject});
                break;
            default:
                break;
        }
        return;
    }
    if (!controller) {
        console.error('Controller ist nicht definiert');
        return;
    }
    const line = controller.getObjectByName('ray');
    if (!line) {
        console.error('Ray ist nicht definiert');
        return;
    }
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, camera_y_offset, -1).applyMatrix4(tempMatrix);
    tryQuizButtonSelect();
    // Prüfe auf Treffer
    const intersects = raycaster.intersectObjects(scene.children, true);
    console.log("intersects:", intersects);
    if (intersects.length > 0) {
        line.material.color.set(0xffff00); // Strahl färben
        for (let i = 0; i < intersects.length; i++) {
            let currentObject = intersects[i].object;
            while (currentObject.parent) {
                if (currentObject === panel_model) {
                    console.log('Panel model getroffen');
                    // lade hochauflösendes Modell
                    startProcedure(loadHighResHelmet, "Helmet laden", 25);
                    loadHighResHelmet();
                    break;
                }
                if (currentObject === panel_exit) {
                    // beende webxr sitzung
                    mysession.end();
                    onSessionEnd();
                    break;
                }
                if (currentObject === videoMesh) {
                    toggleVideoPlayback(); // Video abspielen oder pausieren
                }
                if (isMoveableObject) {
                    // news position
                    console.log('Moveable object getroffen');
                    let newPos = intersects[i].point;
                    newPos.y = 1;
                    console.log('New position mov obje:', newPos);
                    moveableObject.moveableObjectPos = [newPos.x, 0.3, newPos.z];
                    socket.emit('update_moveable_object', moveableObject);
                }
                currentObject = currentObject.parent;
            }

        }
    }
}

function tryQuizButtonSelect() {
    if (question_container) {
        question_container.children.forEach((child) => {
            if (child.name.startsWith("option")) {
                if (child.state === 'hovered') {
                    console.log('Option seleddddcted:', child.name);
                    child.set({backgroundColor: new THREE.Color(colors.selected)});
                    child.state = 'selected';
                    if (question_container.selectedOption && question_container.selectedOption !== child) {
                        question_container.selectedOption.set({backgroundColor: new THREE.Color(colors.button)});
                        question_container.selectedOption.state = 'idle';
                    }
                    question_container.selectedOption = child;
                    console.log('Selected option:', child.name);
                }
            }
        })
    }
}

function toggleVideoPlayback() {
    if (!isVideoPlaying) {
        startProcedure(() => console.log("Dummy function"), "Video abspielen", 15);
        video.play();
        playButtonMesh.visible = false;
        isVideoPlaying = true;
    } else {
        video.pause();
        playButtonMesh.visible = true;
        isVideoPlaying = false;
    }
}

function getCharacterState() {
    if (!dolly) {
        console.warn('Dolly ist nicht definiert!');
        return;
    }

    // Holen der aktuellen Animation
    const currentAnimation = dolly.currentAnimationName || 'Idle';

    // Holen der Rotationen der Arme
    const armRotations = {
        leftArm: dolly.leftArm ? dolly.leftArm.rotation.toArray() : null,
        rightArm: dolly.rightArm ? dolly.rightArm.rotation.toArray() : null,
    };

    const rotation = {
        x: dolly.rotation.x,
        y: dolly.rotation.y,
        z: dolly.rotation.z,
    }

    const position = {
        x: dolly.position.x,
        y: dolly.position.y,
        z: dolly.position.z,
    }

    return {
        animation: currentAnimation,
        arms: armRotations,
        rotation: rotation,
        position: position,
    };
}

function sendCharacterState() {
    const characterState = getCharacterState();

    // Sende die Daten an den Server
    socket.emit('update_character', {
        id: socket.id, // Spieler-ID
        state: characterState,
    });
}


